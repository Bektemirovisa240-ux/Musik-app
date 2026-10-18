import { errorMessage } from '../lib/format';
import { load, save } from '../lib/storage';
import { createStore } from '../lib/store';
import { providerById, providers } from '../providers';
import type { Engine, PlaybackUpdate, Track } from '../providers/types';
import { toast } from '../state/toasts';
import { addRecent } from '../state/library';
import { createAudioEngine } from './audioEngine';

export type Repeat = 'off' | 'all' | 'one';

export interface PlayerState {
  queue: Track[];
  index: number;
  playing: boolean;
  loading: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  shuffle: boolean;
  repeat: Repeat;
  /** Id of the engine currently producing sound. */
  engine: string | null;
  previewOnly: boolean;
}

export const player = createStore<PlayerState>({
  queue: [],
  index: -1,
  playing: false,
  loading: false,
  positionMs: 0,
  durationMs: 0,
  volume: load('volume', 0.8),
  shuffle: false,
  repeat: 'off',
  engine: null,
  previewOnly: false,
});

/** Used when full playback fails but a 30s preview exists. */
const previewEngine = createAudioEngine('preview', async (t) => t.previewUrl);
const engines: Engine[] = [...providers.map((p) => p.engine), previewEngine];

for (const engine of engines) {
  engine.bind((u) => onUpdate(engine.id, u));
}

function onUpdate(engineId: string, u: PlaybackUpdate) {
  const s = player.get();
  if (s.engine !== engineId) return;
  if (u.ended) {
    void handleEnded();
    return;
  }
  const patch: Partial<PlayerState> = {};
  if (u.playing !== undefined) patch.playing = u.playing;
  if (u.positionMs !== undefined) patch.positionMs = u.positionMs;
  if (u.durationMs && u.durationMs > 0) patch.durationMs = u.durationMs;
  if (u.meta) {
    const cur = s.queue[s.index];
    // Only fill in placeholder metadata (e.g. pasted links), never overwrite real data.
    if (cur && (cur.title === 'YouTube-Video' || !cur.artist)) {
      const updated = { ...cur, title: u.meta.title || cur.title, artist: u.meta.artist || cur.artist };
      patch.queue = s.queue.map((t, i) => (i === s.index ? updated : t));
    }
  }
  player.set(patch);
}

const currentEngine = () => engines.find((e) => e.id === player.get().engine);
export const currentTrack = (s: PlayerState = player.get()): Track | undefined => s.queue[s.index];

let loadSeq = 0;

async function start(index: number) {
  const s = player.get();
  const track = s.queue[index];
  if (!track) return;
  const seq = ++loadSeq;
  const engine = providerById[track.provider].engine;
  for (const e of engines) if (e !== engine) e.stop();

  player.set({
    index,
    loading: true,
    playing: false,
    positionMs: 0,
    durationMs: track.durationMs ?? 0,
    engine: engine.id,
    previewOnly: track.provider === 'deezer',
  });

  try {
    await engine.load(track, s.volume);
    if (seq !== loadSeq) return;
    player.set({ loading: false });
    addRecent(track);
  } catch (e) {
    if (seq !== loadSeq) return;
    engine.stop();
    if (track.previewUrl) {
      try {
        player.set({ engine: previewEngine.id, previewOnly: true, durationMs: 30_000 });
        await previewEngine.load(track, s.volume);
        if (seq !== loadSeq) return;
        player.set({ loading: false });
        toast(`${errorMessage(e)} Es läuft die 30-Sekunden-Hörprobe.`, 'info');
        addRecent(track);
        return;
      } catch {
        /* fall through to the error below */
      }
    }
    player.set({ loading: false, playing: false });
    toast(errorMessage(e), 'error');
  }
}

async function handleEnded() {
  const s = player.get();
  if (s.repeat === 'one') return start(s.index);
  const next = nextIndex(s);
  if (next === -1) {
    player.set({ playing: false, positionMs: 0 });
    return;
  }
  return start(next);
}

function nextIndex(s: PlayerState): number {
  if (!s.queue.length) return -1;
  if (s.shuffle && s.queue.length > 1) {
    let i = s.index;
    while (i === s.index) i = Math.floor(Math.random() * s.queue.length);
    return i;
  }
  if (s.index + 1 < s.queue.length) return s.index + 1;
  return s.repeat === 'all' ? 0 : -1;
}

/* ---------- public controls ---------- */

export function playTrack(track: Track, context?: Track[]) {
  const queue = context && context.some((t) => t.key === track.key) ? context : [track];
  player.set({ queue });
  void start(queue.findIndex((t) => t.key === track.key));
}

export function playAt(index: number) {
  void start(index);
}

export function togglePlay() {
  const s = player.get();
  if (s.index < 0) {
    if (s.queue.length) void start(0);
    return;
  }
  const engine = currentEngine();
  if (!engine) return;
  if (s.playing) engine.pause();
  else engine.resume();
  player.set({ playing: !s.playing }); // optimistic; engines confirm via events
}

export function next() {
  const i = nextIndex({ ...player.get(), repeat: player.get().repeat === 'one' ? 'all' : player.get().repeat });
  if (i !== -1) void start(i);
}

export function previous() {
  const s = player.get();
  if (s.positionMs > 3000 || s.index <= 0) {
    seek(0);
    return;
  }
  void start(s.index - 1);
}

export function seek(ms: number) {
  currentEngine()?.seek(ms);
  player.set({ positionMs: ms });
}

export function setVolume(v: number) {
  const volume = Math.min(1, Math.max(0, v));
  currentEngine()?.setVolume(volume);
  player.set({ volume });
  save('volume', volume);
}

export function addToQueue(track: Track) {
  player.set((s) => ({ queue: [...s.queue, track] }));
  toast(`„${track.title}“ zur Warteschlange hinzugefügt`, 'success');
}

export function removeFromQueue(index: number) {
  const s = player.get();
  if (index === s.index) return;
  player.set({ queue: s.queue.filter((_, i) => i !== index), index: index < s.index ? s.index - 1 : s.index });
}

export function toggleShuffle() {
  player.set((s) => ({ shuffle: !s.shuffle }));
}

export function cycleRepeat() {
  player.set((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' }));
}
