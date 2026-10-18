import { loadScript } from '../lib/script';
import type { Emit, Engine, Provider, Track } from './types';

export const SC_HOST_ID = 'pulse-sc-host';

let widget: any = null;
let iframe: HTMLIFrameElement | null = null;
let emit: Emit = () => {};

function widgetUrl(trackUrl: string) {
  const p = new URLSearchParams({ url: trackUrl, auto_play: 'true', visual: 'true', show_comments: 'false', hide_related: 'true' });
  return `https://w.soundcloud.com/player/?${p}`;
}

async function createWidget(trackUrl: string): Promise<void> {
  await loadScript('https://w.soundcloud.com/player/api.js');
  const host = document.getElementById(SC_HOST_ID);
  if (!host) throw new Error('Player-Container fehlt.');
  iframe = document.createElement('iframe');
  iframe.allow = 'autoplay; encrypted-media';
  iframe.title = 'SoundCloud';
  iframe.src = widgetUrl(trackUrl);
  host.replaceChildren(iframe);
  widget = window.SC.Widget(iframe);
  const E = window.SC.Widget.Events;
  widget.bind(E.PLAY, () => {
    emit({ playing: true });
    widget.getDuration((d: number) => emit({ durationMs: d }));
    widget.getCurrentSound((s: any) => s && emit({ meta: { title: s.title, artist: s.user?.username } }));
  });
  widget.bind(E.PAUSE, () => emit({ playing: false }));
  widget.bind(E.FINISH, () => emit({ ended: true }));
  widget.bind(E.PLAY_PROGRESS, (e: any) => emit({ positionMs: e.currentPosition }));
  await new Promise<void>((resolve) => widget.bind(E.READY, () => resolve()));
}

const engine: Engine = {
  id: 'soundcloud',
  bind: (e) => (emit = e),
  async load(track, volume) {
    if (!widget) await createWidget(track.sourceId);
    else await new Promise<void>((resolve) => widget.load(track.sourceId, { auto_play: true, visual: true, callback: resolve }));
    widget.setVolume(Math.round(volume * 100));
    widget.play();
  },
  pause: () => widget?.pause(),
  resume: () => widget?.play(),
  seek: (ms) => widget?.seekTo(ms),
  setVolume: (v) => widget?.setVolume(Math.round(v * 100)),
  stop: () => widget?.pause(),
};

export const soundcloud: Provider = {
  id: 'soundcloud',
  name: 'SoundCloud',
  color: '#ff7a1a',
  tagline: 'Remixe, DJ-Sets & Underground – per Link',
  playbackNote: 'Volle Songs über den offiziellen SoundCloud-Player. Füge einfach einen SoundCloud-Link in die Suche ein.',
  setupSteps: [
    'Keine Einrichtung nötig. Kopiere einen Link (z. B. soundcloud.com/kuenstler/song) und füge ihn in die Suche ein.',
    'SoundCloud vergibt derzeit keine offenen Such-Schlüssel für reine Web-Apps, daher gibt es keine Textsuche.',
  ],
  configFields: [],
  requiresLogin: false,
  isConfigured: () => true,
  isConnected: () => true,
  canSearch: () => false,
  async connect() {},
  disconnect() {},
  async resolveUrl(url) {
    if (!/(^|\.)soundcloud\.com$/.test(url.hostname) && url.hostname !== 'on.soundcloud.com') return null;
    const clean = url.origin + url.pathname;
    let info: any = {};
    try {
      const res = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(clean)}`);
      if (res.ok) info = await res.json();
    } catch {
      /* oEmbed is only cosmetic */
    }
    const [title, artist] = String(info.title ?? '').split(' by ');
    const track: Track = {
      key: `soundcloud:${clean}`,
      provider: 'soundcloud',
      sourceId: clean,
      title: title || decodeURIComponent(url.pathname.split('/').pop() ?? 'SoundCloud-Track').replace(/-/g, ' '),
      artist: info.author_name || artist || decodeURIComponent(url.pathname.split('/')[1] ?? ''),
      artwork: info.thumbnail_url,
      externalUrl: clean,
    };
    return track;
  },
  engine,
};
