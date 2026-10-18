import type { Collection } from '../lib/catalog';
import { createStore } from '../lib/store';

export type View = 'home' | 'search' | 'library' | 'connect' | 'collection';

export const ui = createStore({
  view: 'home' as View,
  query: '',
  queueOpen: false,
  nowPlayingOpen: false,
  collection: null as Collection | null,
});

export const go = (view: View) => ui.set({ view });

export const openCollection = (collection: Collection) => ui.set({ view: 'collection', collection });
