import { itunesSearch } from '../lib/catalog';
import { getConfig } from '../lib/config';
import { loadScript } from '../lib/script';
import { load, save } from '../lib/storage';
import type { Emit, Engine, Provider, Track } from './types';

let music: any = null;
let initializing: Promise<any> | null = null;
let authorized = load<boolean>('apple.authorized', false);
let emit: Emit = () => {};

function ensureMusicKit(): Promise<any> {
  if (music) return Promise.resolve(music);
  initializing ??= (async () => {
    const developerToken = getConfig('appleDeveloperToken');
    if (!developerToken) throw new Error('Bitte zuerst den Apple Music Developer-Token eintragen.');
    if (!window.MusicKit) {
      const loaded = new Promise<void>((r) => document.addEventListener('musickitloaded', () => r(), { once: true }));
      await loadScript('https://js-cdn.music.apple.com/musickit/v3/musickit.js');
      if (!window.MusicKit) await loaded;
    }
    const mk = await window.MusicKit.configure({ developerToken, app: { name: 'Pulse', build: '1.0.0' } });
    const S = window.MusicKit.PlaybackStates;
    mk.addEventListener('playbackStateDidChange', ({ state }: any) => {
      if (state === S.playing) emit({ playing: true, durationMs: mk.currentPlaybackDuration * 1000 });
      else if (state === S.paused || state === S.stopped) emit({ playing: false });
      else if (state === S.ended || state === S.completed) emit({ ended: true });
    });
    mk.addEventListener('playbackTimeDidChange', () =>
      emit({ positionMs: mk.currentPlaybackTime * 1000, durationMs: mk.currentPlaybackDuration * 1000 }),
    );
    music = mk;
    authorized = mk.isAuthorized;
    save('apple.authorized', authorized);
    return mk;
  })().catch((e) => {
    initializing = null;
    throw e;
  });
  return initializing;
}

function artwork(a: any): string | undefined {
  return a?.url?.replace('{w}', '400').replace('{h}', '400');
}

function mapSong(s: any): Track {
  const a = s.attributes ?? {};
  return {
    key: `apple:${s.id}`,
    provider: 'apple',
    sourceId: s.id,
    title: a.name,
    artist: a.artistName,
    album: a.albumName,
    artwork: artwork(a.artwork),
    durationMs: a.durationInMillis,
    externalUrl: a.url,
    previewUrl: a.previews?.[0]?.url,
  };
}

const engine: Engine = {
  id: 'apple',
  bind: (e) => (emit = e),
  async load(track, volume) {
    const mk = await ensureMusicKit();
    mk.volume = volume;
    await mk.setQueue({ song: track.sourceId, startPlaying: true });
    if (!mk.isPlaying) await mk.play();
  },
  pause: () => music?.pause(),
  resume: () => music?.play(),
  seek: (ms) => music?.seekToTime(ms / 1000),
  setVolume: (v) => music && (music.volume = v),
  stop: () => music?.stop?.(),
};

export const apple: Provider = {
  id: 'apple',
  name: 'Apple Music',
  color: '#ff4f8b',
  tagline: 'Apple-Music-Katalog & deine Mediathek',
  playbackNote: 'Suche & 30-Sekunden-Hörproben sofort ohne Konto. Volle Songs mit Apple-Music-Abo (Anmeldung mit deiner Apple-ID).',
  setupSteps: [
    'Melde dich im Apple Developer Program an und erstelle unter „Keys“ einen MusicKit-Schlüssel.',
    'Erzeuge damit einen Developer-Token (JWT, ES256, max. 6 Monate gültig).',
    'Füge den Token hier ein und klicke auf „Mit Apple anmelden“.',
  ],
  configFields: [{ key: 'appleDeveloperToken', label: 'Developer-Token', placeholder: 'eyJhbGciOiJFUzI1NiIs…', secret: true }],
  requiresLogin: true,
  libraryName: 'Apple Music – Mediathek',
  isConfigured: () => !!getConfig('appleDeveloperToken'),
  isConnected: () => authorized,
  canSearch: () => true, // falls back to the public iTunes catalog without login

  async connect() {
    const mk = await ensureMusicKit();
    await mk.authorize();
    authorized = mk.isAuthorized;
    save('apple.authorized', authorized);
    if (!authorized) throw new Error('Apple-Anmeldung abgebrochen.');
  },

  disconnect() {
    void music?.unauthorize?.();
    authorized = false;
    save('apple.authorized', false);
  },

  async getProfile() {
    const mk = await ensureMusicKit();
    return { name: 'Apple-ID verbunden', email: mk.storefrontCountryCode ? `Store: ${mk.storefrontCountryCode.toUpperCase()}` : undefined };
  },

  async search(q) {
    if (!authorized) return itunesSearch(q);
    const mk = await ensureMusicKit();
    const sf = mk.storefrontId || 'de';
    const res = await mk.api.music(`/v1/catalog/${sf}/search`, { term: q, types: 'songs', limit: 20 });
    return (res.data?.results?.songs?.data ?? []).map(mapSong);
  },

  async library() {
    const mk = await ensureMusicKit();
    const res = await mk.api.music('/v1/me/library/songs', { limit: 50 });
    return (res.data?.data ?? []).map(mapSong);
  },

  async resolveUrl(url) {
    if (url.hostname !== 'music.apple.com') return null;
    const id = url.searchParams.get('i') ?? url.pathname.match(/\/song\/[^/]+\/(\d+)/)?.[1];
    if (!id) return null;
    const mk = await ensureMusicKit();
    const res = await mk.api.music(`/v1/catalog/${mk.storefrontId || 'de'}/songs/${id}`);
    return res.data?.data?.[0] ? mapSong(res.data.data[0]) : null;
  },

  engine,
};

/** Restores an earlier Apple Music session in the background. */
export function restoreApple(): void {
  if (authorized && getConfig('appleDeveloperToken')) void ensureMusicKit().catch(() => {});
}
