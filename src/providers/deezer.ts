import { createAudioEngine } from '../player/audioEngine';
import { jsonp } from '../lib/script';
import type { Provider, Track } from './types';

const API = 'https://api.deezer.com';

export function mapDeezerTrack(t: any, album?: any): Track {
  album ??= t.album;
  return {
    key: `deezer:${t.id}`,
    provider: 'deezer',
    sourceId: String(t.id),
    title: t.title,
    artist: t.artist?.name ?? '',
    album: album?.title,
    artwork: album?.cover_big ?? album?.cover_medium,
    durationMs: 30_000,
    externalUrl: t.link,
    previewUrl: t.preview || undefined,
  };
}

export async function call<T>(path: string): Promise<T> {
  const res = await jsonp<any>(API + path);
  if (res?.error) throw new Error(res.error.message || 'Deezer-Fehler');
  return res as T;
}

/** Deezer preview links are signed and expire, so always fetch a fresh one. */
const engine = createAudioEngine('deezer', async (t) => {
  const fresh = await call<any>(`/track/${t.sourceId}`).catch(() => null);
  return fresh?.preview || t.previewUrl;
});

export const deezer: Provider = {
  id: 'deezer',
  name: 'Deezer',
  color: '#a238ff',
  tagline: 'Riesiger Katalog & Charts – sofort ohne Konto',
  playbackNote: 'Funktioniert sofort ohne Anmeldung, spielt 30-Sekunden-Hörproben (Deezer bietet keine offene Vollwiedergabe an).',
  setupSteps: ['Keine Einrichtung nötig – Deezer ist immer aktiv.'],
  configFields: [],
  requiresLogin: false,
  isConfigured: () => true,
  isConnected: () => true,
  canSearch: () => true,
  async connect() {},
  disconnect() {},
  async search(q) {
    const res = await call<any>(`/search?limit=20&q=${encodeURIComponent(q)}`);
    return res.data.map((t: any) => mapDeezerTrack(t));
  },
  async resolveUrl(url) {
    const m = /deezer\.com$/.test(url.hostname) && url.pathname.match(/\/track\/(\d+)/);
    return m ? mapDeezerTrack(await call<any>(`/track/${m[1]}`)) : null;
  },
  engine,
};
