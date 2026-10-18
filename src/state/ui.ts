import { createStore } from '../lib/store';

export type View = 'home' | 'search' | 'library' | 'connect';

export const ui = createStore({
  view: 'home' as View,
  query: '',
  queueOpen: false,
  nowPlayingOpen: false,
});

export const go = (view: View) => ui.set({ view });
