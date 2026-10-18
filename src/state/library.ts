import { load, save } from '../lib/storage';
import { createStore } from '../lib/store';
import type { Track } from '../providers/types';

export const library = createStore({
  favorites: load<Track[]>('favorites', []),
  recent: load<Track[]>('recent', []),
});

export function isFavorite(key: string) {
  return library.get().favorites.some((t) => t.key === key);
}

export function toggleFavorite(track: Track) {
  const favs = library.get().favorites;
  const favorites = isFavorite(track.key) ? favs.filter((t) => t.key !== track.key) : [track, ...favs];
  library.set({ favorites });
  save('favorites', favorites);
}

export function addRecent(track: Track) {
  const recent = [track, ...library.get().recent.filter((t) => t.key !== track.key)].slice(0, 30);
  library.set({ recent });
  save('recent', recent);
}
