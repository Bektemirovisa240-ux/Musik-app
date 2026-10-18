import type { Emit, Engine, Track } from '../providers/types';

/** HTMLAudioElement based engine for direct audio URLs (previews). */
export function createAudioEngine(id: string, resolveSrc: (t: Track) => Promise<string | undefined>): Engine {
  const audio = new Audio();
  audio.preload = 'auto';
  let emit: Emit = () => {};

  audio.addEventListener('play', () => emit({ playing: true }));
  audio.addEventListener('pause', () => emit({ playing: false }));
  audio.addEventListener('timeupdate', () => emit({ positionMs: audio.currentTime * 1000 }));
  audio.addEventListener('durationchange', () => {
    if (Number.isFinite(audio.duration)) emit({ durationMs: audio.duration * 1000 });
  });
  audio.addEventListener('ended', () => emit({ ended: true }));

  return {
    id,
    bind: (e) => (emit = e),
    async load(track, volume) {
      const src = await resolveSrc(track);
      if (!src) throw new Error('Für diesen Titel ist keine Hörprobe verfügbar.');
      audio.src = src;
      audio.volume = volume;
      await audio.play();
    },
    pause: () => audio.pause(),
    resume: () => void audio.play().catch(() => {}),
    seek: (ms) => (audio.currentTime = ms / 1000),
    setVolume: (v) => (audio.volume = v),
    stop() {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    },
  };
}
