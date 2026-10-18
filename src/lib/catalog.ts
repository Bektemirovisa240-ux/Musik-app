import { call as deezer, mapDeezerTrack } from '../providers/deezer';
import type { Track } from '../providers/types';

/** Real, public music content (charts, albums, artists) that needs no login. */

export interface Collection {
  kind: 'album' | 'artist' | 'playlist';
  source: 'deezer' | 'itunes';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
}

export interface HomeFeed {
  tracks: Track[];
  albums: Collection[];
  artists: Collection[];
  playlists: Collection[];
  source: string;
}

/* ---------- Deezer ---------- */

async function deezerHome(): Promise<HomeFeed> {
  const res = await deezer<any>('/chart/0?limit=24');
  return {
    source: 'Deezer-Charts',
    tracks: res.tracks.data.map((t: any) => mapDeezerTrack(t)),
    albums: res.albums.data.map((a: any) => ({
      kind: 'album',
      source: 'deezer',
      id: String(a.id),
      title: a.title,
      subtitle: a.artist?.name,
      image: a.cover_xl ?? a.cover_big,
    })),
    artists: res.artists.data.map((a: any) => ({
      kind: 'artist',
      source: 'deezer',
      id: String(a.id),
      title: a.name,
      subtitle: 'Künstler',
      image: a.picture_xl ?? a.picture_big,
    })),
    playlists: res.playlists.data.map((p: any) => ({
      kind: 'playlist',
      source: 'deezer',
      id: String(p.id),
      title: p.title,
      subtitle: p.nb_tracks ? `${p.nb_tracks} Songs` : p.user?.name,
      image: p.picture_xl ?? p.picture_big,
    })),
  };
}

async function deezerCollection(c: Collection): Promise<Track[]> {
  if (c.kind === 'album') {
    const album = await deezer<any>(`/album/${c.id}`);
    return album.tracks.data.map((t: any) => mapDeezerTrack(t, album));
  }
  const path = c.kind === 'artist' ? `/artist/${c.id}/top?limit=30` : `/playlist/${c.id}/tracks?limit=60`;
  const res = await deezer<any>(path);
  return res.data.map((t: any) => mapDeezerTrack(t));
}

/* ---------- Apple / iTunes (public, CORS-enabled) ---------- */

const COUNTRY = 'de';
const big = (url?: string) => url?.replace(/\d+x\d+bb/, '600x600bb');

/** iTunes ids are Apple Music catalog ids, so these play fully once Apple Music is connected. */
export function mapItunesTrack(r: any): Track {
  return {
    key: `apple:${r.trackId}`,
    provider: 'apple',
    sourceId: String(r.trackId),
    title: r.trackName,
    artist: r.artistName,
    album: r.collectionName,
    artwork: big(r.artworkUrl100),
    durationMs: r.trackTimeMillis,
    externalUrl: r.trackViewUrl,
    previewUrl: r.previewUrl,
  };
}

export async function itunesSearch(term: string): Promise<Track[]> {
  const qs = new URLSearchParams({ term, country: COUNTRY, media: 'music', entity: 'song', limit: '20' });
  const res = await fetch(`https://itunes.apple.com/search?${qs}`);
  if (!res.ok) throw new Error('Apple-Music-Suche nicht erreichbar');
  return ((await res.json()).results ?? []).map(mapItunesTrack);
}

async function itunesLookup(params: Record<string, string>): Promise<any[]> {
  const res = await fetch(`https://itunes.apple.com/lookup?${new URLSearchParams({ country: COUNTRY, ...params })}`);
  if (!res.ok) throw new Error('iTunes nicht erreichbar');
  return (await res.json()).results ?? [];
}

async function appleChart(type: 'songs' | 'albums'): Promise<any[]> {
  const res = await fetch(`https://rss.applemarketingtools.com/api/v2/${COUNTRY}/music/most-played/25/${type}.json`);
  if (!res.ok) throw new Error('Apple-Charts nicht erreichbar');
  return (await res.json()).feed?.results ?? [];
}

async function itunesHome(): Promise<HomeFeed> {
  const [songs, albums] = await Promise.all([appleChart('songs'), appleChart('albums').catch(() => [])]);
  const details = await itunesLookup({ id: songs.map((s) => s.id).join(',') });
  const artists = new Map<string, Collection>();
  for (const s of songs) {
    if (s.artistId && !artists.has(s.artistId))
      artists.set(s.artistId, { kind: 'artist', source: 'itunes', id: s.artistId, title: s.artistName, subtitle: 'Künstler', image: big(s.artworkUrl100) });
  }
  return {
    source: 'Apple-Music-Charts',
    tracks: details.filter((r) => r.wrapperType === 'track').map(mapItunesTrack),
    albums: albums.map((a) => ({ kind: 'album', source: 'itunes', id: a.id, title: a.name, subtitle: a.artistName, image: big(a.artworkUrl100) })),
    artists: [...artists.values()],
    playlists: [],
  };
}

async function itunesCollection(c: Collection): Promise<Track[]> {
  const results = await itunesLookup({ id: c.id, entity: 'song', limit: '30' });
  return results.filter((r) => r.wrapperType === 'track' && r.kind === 'song').map(mapItunesTrack);
}

/* ---------- public API ---------- */

export async function loadHomeFeed(): Promise<HomeFeed> {
  try {
    return await deezerHome();
  } catch {
    return itunesHome();
  }
}

export function loadCollection(c: Collection): Promise<Track[]> {
  return c.source === 'deezer' ? deezerCollection(c) : itunesCollection(c);
}
