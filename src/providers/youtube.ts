import { getConfig } from '../lib/config';
import { decodeHtml, parseIsoDuration } from '../lib/format';
import { loadScript } from '../lib/script';
import { load, save } from '../lib/storage';
import type { Emit, Engine, Provider, Track } from './types';

const API = 'https://www.googleapis.com/youtube/v3';
const SCOPES = 'openid email profile https://www.googleapis.com/auth/youtube.readonly';
export const YT_HOST_ID = 'pulse-yt-host';

interface Token {
  access: string;
  expires: number;
}

let token: Token | null = load<Token | null>('google.token', null);
const tokenValid = () => !!token && token.expires > Date.now() + 30_000;

export function preloadGoogle(): void {
  if (getConfig('googleClientId')) void loadScript('https://accounts.google.com/gsi/client').catch(() => {});
}

async function api<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params);
  const headers: Record<string, string> = {};
  if (tokenValid()) headers.Authorization = `Bearer ${token!.access}`;
  else if (getConfig('youtubeApiKey')) qs.set('key', getConfig('youtubeApiKey'));
  else throw new Error('YouTube-Sitzung abgelaufen – bitte erneut verbinden.');
  const res = await fetch(`${API}${path}?${qs}`, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `YouTube-Fehler ${res.status}`);
  return json as T;
}

function mapVideo(id: string, snippet: any, durationIso?: string): Track {
  const th = snippet?.thumbnails ?? {};
  return {
    key: `youtube:${id}`,
    provider: 'youtube',
    sourceId: id,
    title: decodeHtml(snippet?.title ?? 'YouTube-Video'),
    artist: decodeHtml((snippet?.channelTitle ?? '').replace(/ - Topic$/, '')),
    artwork: (th.high ?? th.medium ?? th.default)?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    durationMs: parseIsoDuration(durationIso),
    externalUrl: `https://www.youtube.com/watch?v=${id}`,
  };
}

async function videosByIds(ids: string[]): Promise<Track[]> {
  if (!ids.length) return [];
  const res = await api<any>('/videos', { part: 'snippet,contentDetails', id: ids.join(',') });
  return res.items.map((v: any) => mapVideo(v.id, v.snippet, v.contentDetails?.duration));
}

/* ---------- IFrame player ---------- */

let player: any = null;
let ready: Promise<void> | null = null;
let emit: Emit = () => {};
let poll: number | undefined;
let pendingLoad: { resolve: () => void; reject: (e: Error) => void } | null = null;

const YT_ERRORS: Record<number, string> = {
  2: 'Ungültige Video-ID.',
  5: 'Dieses Video kann nicht im Browser abgespielt werden.',
  100: 'Video nicht gefunden oder privat.',
  101: 'Der Besitzer erlaubt keine Wiedergabe außerhalb von YouTube.',
  150: 'Der Besitzer erlaubt keine Wiedergabe außerhalb von YouTube.',
};

function ensurePlayer(): Promise<void> {
  ready ??= new Promise<void>((resolve, reject) => {
    const init = () => {
      const host = document.getElementById(YT_HOST_ID);
      if (!host) return reject(new Error('Player-Container fehlt.'));
      const target = document.createElement('div');
      host.replaceChildren(target);
      player = new window.YT.Player(target, {
        width: '100%',
        height: '100%',
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1 },
        events: {
          onReady: () => resolve(),
          onStateChange: (e: any) => {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              pendingLoad?.resolve();
              pendingLoad = null;
              const data = player.getVideoData?.();
              emit({
                playing: true,
                durationMs: player.getDuration() * 1000,
                meta: data?.title ? { title: data.title, artist: data.author } : undefined,
              });
            } else if (e.data === S.PAUSED) emit({ playing: false });
            else if (e.data === S.ENDED) emit({ ended: true });
          },
          onError: (e: any) => {
            const err = new Error(YT_ERRORS[e.data] ?? 'YouTube-Wiedergabefehler.');
            if (pendingLoad) pendingLoad.reject(err);
            else emit({ playing: false });
            pendingLoad = null;
          },
        },
      });
    };
    if (window.YT?.Player) init();
    else {
      window.onYouTubeIframeAPIReady = init;
      loadScript('https://www.youtube.com/iframe_api').catch(reject);
    }
  }).catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

const engine: Engine = {
  id: 'youtube',
  bind: (e) => (emit = e),
  async load(track, volume) {
    await ensurePlayer();
    player.setVolume(Math.round(volume * 100));
    await new Promise<void>((resolve, reject) => {
      pendingLoad = { resolve, reject };
      player.loadVideoById(track.sourceId);
      // Autoplay may be blocked; don't hang forever – the user can press play.
      setTimeout(() => {
        if (pendingLoad?.resolve === resolve) {
          pendingLoad = null;
          resolve();
        }
      }, 8000);
    });
    clearInterval(poll);
    poll = window.setInterval(() => {
      if (player?.getPlayerState?.() === window.YT.PlayerState.PLAYING) {
        emit({ positionMs: player.getCurrentTime() * 1000 });
      }
    }, 500);
  },
  pause: () => player?.pauseVideo(),
  resume: () => player?.playVideo(),
  seek: (ms) => player?.seekTo(ms / 1000, true),
  setVolume: (v) => player?.setVolume(Math.round(v * 100)),
  stop() {
    clearInterval(poll);
    player?.stopVideo?.();
  },
};

export const youtube: Provider = {
  id: 'youtube',
  name: 'YouTube',
  color: '#ff3355',
  tagline: 'Musikvideos, Live-Sets & deine „Mag ich“-Videos',
  playbackNote: 'Volle Songs kostenlos über den offiziellen YouTube-Player.',
  setupSteps: [
    'Öffne console.cloud.google.com, erstelle ein Projekt und aktiviere die „YouTube Data API v3“.',
    'Erstelle unter „Anmeldedaten“ eine OAuth-Client-ID (Webanwendung) und trage die Redirect-URI als „Autorisierte JavaScript-Quelle“ ein (nur Origin).',
    'Kopiere die Client-ID hierher. Optional: ein API-Schlüssel erlaubt die Suche auch ohne Anmeldung.',
  ],
  configFields: [
    { key: 'googleClientId', label: 'OAuth Client-ID', placeholder: '1234…apps.googleusercontent.com' },
    { key: 'youtubeApiKey', label: 'API-Schlüssel (optional)', placeholder: 'AIza…', secret: true },
  ],
  requiresLogin: true,
  libraryName: 'YouTube – „Mag ich“',
  isConfigured: () => !!getConfig('googleClientId') || !!getConfig('youtubeApiKey'),
  isConnected: tokenValid,
  canSearch: () => tokenValid() || !!getConfig('youtubeApiKey'),

  async connect() {
    const clientId = getConfig('googleClientId');
    if (!clientId) throw new Error('Bitte zuerst die Google OAuth Client-ID eintragen.');
    await loadScript('https://accounts.google.com/gsi/client');
    await new Promise<void>((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error) return reject(new Error(resp.error_description || 'Google-Anmeldung fehlgeschlagen'));
          token = { access: resp.access_token, expires: Date.now() + Number(resp.expires_in) * 1000 };
          save('google.token', token);
          resolve();
        },
        error_callback: (err: any) =>
          reject(new Error(err?.type === 'popup_closed' ? 'Anmeldung abgebrochen.' : 'Popup wurde blockiert – bitte erlauben.')),
      });
      client.requestAccessToken();
    });
  },

  disconnect() {
    if (token) window.google?.accounts?.oauth2?.revoke?.(token.access);
    token = null;
    save('google.token', null);
  },

  async getProfile() {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token?.access}` },
    });
    if (!res.ok) throw new Error('Google-Profil nicht abrufbar');
    const me = await res.json();
    return { name: me.name, email: me.email, avatar: me.picture };
  },

  async search(q) {
    const res = await api<any>('/search', {
      part: 'snippet',
      type: 'video',
      videoCategoryId: '10',
      maxResults: '20',
      q,
    });
    const ids = res.items.map((i: any) => i.id.videoId).filter(Boolean);
    try {
      return await videosByIds(ids); // adds durations
    } catch {
      return res.items.map((i: any) => mapVideo(i.id.videoId, i.snippet));
    }
  },

  async library() {
    if (!tokenValid()) throw new Error('YouTube-Sitzung abgelaufen – bitte erneut verbinden.');
    const res = await api<any>('/videos', { part: 'snippet,contentDetails', myRating: 'like', maxResults: '50' });
    return res.items.map((v: any) => mapVideo(v.id, v.snippet, v.contentDetails?.duration));
  },

  async resolveUrl(url) {
    const host = url.hostname.replace(/^(www|m|music)\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = url.pathname.slice(1);
    else if (host === 'youtube.com') id = url.searchParams.get('v') ?? url.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1] ?? null;
    if (!id) return null;
    if (youtube.canSearch()) {
      const [t] = await videosByIds([id]).catch(() => []);
      if (t) return t;
    }
    return mapVideo(id, null); // title is filled in once playback starts
  },

  engine,
};
