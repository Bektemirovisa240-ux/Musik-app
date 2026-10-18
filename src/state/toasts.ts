import { createStore } from '../lib/store';

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'success' | 'error';
}

export const toasts = createStore<{ items: Toast[] }>({ items: [] });
let seq = 0;

export function toast(text: string, kind: Toast['kind'] = 'info') {
  const id = ++seq;
  toasts.set((s) => ({ items: [...s.items.slice(-3), { id, text, kind }] }));
  setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000);
}

export function dismiss(id: number) {
  toasts.set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
}
