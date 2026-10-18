import { getConfig, redirectUri } from '../lib/config';
import { codeChallenge, randomString } from '../lib/pkce';
import { loadScript } from '../lib/script';
import { load, save } from '../lib/storage';
import type { Emit, Engine, Provider, Track } from './types';

const ACCOUNTS = 'https://accounts.spotify.com';
const API = 'https://api.spotify.com/v1';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-library-read',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

interface Token {
  access: string;
  refresh: string;
  expires: number;
}

let token: Token | null = load<Token | null>('spotify.token', null);

function storeToken(json: { access_token: string; refresh_token?: string; expires_in: number }) {
  token = {
    access: json.access_token,
    refresh: json.refresh_token ?? token?.refresh ?? '',
    expires: Date.now() + json.expires_in * 1000,
  };
  save('spotify.token', token);
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(`${ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || 'Spotify-Anmeldung fehlgeschlagen');
  storeToken(json);
}

let refreshing: Promise<void> | null = null;

async function accessToken(): Promise<string> {
  if (!token) throw new Error('Spotify ist nicht verbunden.');
  if (Date.now() > token.expires - 60_000) {
    refreshing ??= tokenRequest({
      grant_type: 'refresh_token',
      refresh_token: token.refresh,
      client_id: getConfig('spotifyClientId'),
    })
      .catch((e) => {
        spotify.disconnect();
        throw e;
      })
      .finally(() => (refreshing = null));
    await refreshing;
  }
  return token!.access;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (res.status === 204 || res.status === 202) return null as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `Spotify-Fehler ${res.status}`;
    if (json?.error?.reason === 'PREMIUM_REQUIRED') throw new Error('Für die volle Wiedergabe brauchst du Spotify Premium.');
    throw new Error(msg);
  }
  return json as T;
}

function mapTrack(t: any): Track {
  const images = t.album?.images ?? [];
  return {
    key: `spotify:${t.id}`,
    provider: 'spotify',
    sourceId: t.uri,
    title: t.name,
    artist: (t.artists ?? []).map((a: any) => a.name).join(', '),
    album: t.album?.name,
    artwork: (images[1] ?? images[0])?.url,
    durationMs: t.duration_ms,
    externalUrl: t.external_urls?.spotify,
    previewUrl: t.preview_url ?? undefined,
  };
}

/* ---------- Web Playback SDK ---------- */

let sdkPlayer: any = null;
let deviceId: string | null = null;
let ready: Promise<void> | null = null;
let emit: Emit = () => {};
let currentUri: string | null = null;
let poll: number | undefined;

function ensurePlayer(volume: number): Promise<void> {
  ready ??= new Promise<void>((resolve, reject) => {
    const init = () => {
      sdkPlayer = new window.Spotify.Player({
        name: 'Pulse Web Player',
        getOAuthToken: (cb: (t: string) => void) => void accessToken().then(cb),
        volume,
      });
      sdkPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        deviceId = device_id;
        resolve();
      });
      sdkPlayer.addListener('not_ready', () => (deviceId = null));
      sdkPlayer.addListener('initialization_error', ({ message }: any) => reject(new Error(message)));
      sdkPlayer.addListener('authentication_error', ({ message }: any) => reject(new Error(message)));
      sdkPlayer.addListener('account_error', () =>
        reject(new Error('Für die volle Wiedergabe brauchst du Spotify Premium.')),
      );
      sdkPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        const cur = state.track_window?.current_track;
        const finished =
          state.paused &&
          state.position === 0 &&
          state.track_window?.previous_tracks?.some((t: any) => t.uri === currentUri);
        if (finished) {
          emit({ ended: true });
          return;
        }
        emit({ playing: !state.paused, positionMs: state.position, durationMs: cur?.duration_ms ?? state.duration });
      });
      sdkPlayer.connect().then((ok: boolean) => {
        if (!ok) reject(new Error('Spotify-Player konnte nicht gestartet werden.'));
      });
    };
    if (window.Spotify?.Player) init();
    else {
      window.onSpotifyWebPlaybackSDKReady = init;
      loadScript('https://sdk.scdn.co/spotify-player.js').catch(reject);
    }
  }).catch((e) => {
    ready = null;
    sdkPlayer?.disconnect();
    sdkPlayer = null;
    throw e;
  });
  return ready;
}

const engine: Engine = {
  id: 'spotify',
  bind: (e) => (emit = e),
  async load(track, volume) {
    sdkPlayer?.activateElement?.(); // required on mobile browsers within the user gesture
    await ensurePlayer(volume);
    currentUri = track.sourceId;
    await api(`/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [track.sourceId] }),
    });
    clearInterval(poll);
    poll = window.setInterval(async () => {
      const s = await sdkPlayer?.getCurrentState();
      if (s && !s.paused) emit({ positionMs: s.position });
    }, 500);
  },
  pause: () => sdkPlayer?.pause(),
  resume: () => sdkPlayer?.resume(),
  seek: (ms) => sdkPlayer?.seek(Math.round(ms)),
  setVolume: (v) => sdkPlayer?.setVolume(v),
  stop() {
    clearInterval(poll);
    currentUri = null;
    sdkPlayer?.pause();
  },
};

export const spotify: Provider = {
  id: 'spotify',
  name: 'Spotify',
  color: '#1ed760',
  tagline: 'Deine Spotify-Bibliothek, Suche & Lieblingssongs',
  playbackNote: 'Volle Songs mit Spotify Premium. Ohne Premium nur Hörproben, falls verfügbar.',
  setupSteps: [
    'Öffne developer.spotify.com/dashboard und erstelle eine App („Web API“ + „Web Playback SDK“).',
    'Trage die unten angezeigte Redirect-URI exakt so ein.',
    'Kopiere die Client-ID hierher und klicke auf „Mit Spotify anmelden“.',
  ],
  configFields: [{ key: 'spotifyClientId', label: 'Client-ID', placeholder: 'z. B. 3f1c…' }],
  requiresLogin: true,
  libraryName: 'Spotify – Lieblingssongs',
  isConfigured: () => !!getConfig('spotifyClientId'),
  isConnected: () => !!token,
  canSearch: () => !!token,

  async connect() {
    const clientId = getConfig('spotifyClientId');
    if (!clientId) throw new Error('Bitte zuerst die Spotify Client-ID eintragen.');
    const verifier = randomString(64);
    const state = `spotify:${randomString(16)}`;
    sessionStorage.setItem('pulse.spotify.verifier', verifier);
    sessionStorage.setItem('pulse.oauth.state', state);
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri(),
      code_challenge_method: 'S256',
      code_challenge: await codeChallenge(verifier),
      scope: SCOPES,
      state,
    });
    window.location.assign(`${ACCOUNTS}/authorize?${params}`);
  },

  disconnect() {
    token = null;
    save('spotify.token', null);
    sdkPlayer?.disconnect();
    sdkPlayer = null;
    ready = null;
  },

  async getProfile() {
    const me = await api<any>('/me');
    return { name: me.display_name || me.id, email: me.email, avatar: me.images?.[0]?.url };
  },

  async search(q) {
    const res = await api<any>(`/search?type=track&limit=20&q=${encodeURIComponent(q)}`);
    return res.tracks.items.map(mapTrack);
  },

  async library() {
    const res = await api<any>('/me/tracks?limit=50');
    return res.items.map((i: any) => mapTrack(i.track));
  },

  async resolveUrl(url) {
    const m = url.hostname === 'open.spotify.com' && url.pathname.match(/\/track\/([A-Za-z0-9]+)/);
    if (!m) return null;
    if (!token) throw new Error('Verbinde Spotify, um Spotify-Links abzuspielen.');
    return mapTrack(await api<any>(`/tracks/${m[1]}`));
  },

  engine,
};

/** Completes the OAuth redirect. Returns true if the URL belonged to Spotify. */
export async function handleSpotifyRedirect(params: URLSearchParams): Promise<boolean> {
  const state = params.get('state');
  if (!state?.startsWith('spotify:')) return false;
  const expected = sessionStorage.getItem('pulse.oauth.state');
  sessionStorage.removeItem('pulse.oauth.state');
  if (params.get('error')) throw new Error('Spotify-Anmeldung wurde abgebrochen.');
  if (state !== expected) throw new Error('Ungültige Anmeldeantwort – bitte erneut versuchen.');
  await tokenRequest({
    grant_type: 'authorization_code',
    code: params.get('code') ?? '',
    redirect_uri: redirectUri(),
    client_id: getConfig('spotifyClientId'),
    code_verifier: sessionStorage.getItem('pulse.spotify.verifier') ?? '',
  });
  sessionStorage.removeItem('pulse.spotify.verifier');
  return true;
}
