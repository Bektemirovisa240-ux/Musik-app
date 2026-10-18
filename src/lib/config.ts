import { load, save } from './storage';

export type ConfigKey = 'spotifyClientId' | 'googleClientId' | 'youtubeApiKey' | 'appleDeveloperToken';

const ENV: Record<ConfigKey, string | undefined> = {
  spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  youtubeApiKey: import.meta.env.VITE_YOUTUBE_API_KEY,
  appleDeveloperToken: import.meta.env.VITE_APPLE_DEVELOPER_TOKEN,
};

export function getConfig(key: ConfigKey): string {
  const user = load<Partial<Record<ConfigKey, string>>>('config', {});
  return (user[key] || ENV[key] || '').trim();
}

export function setConfig(key: ConfigKey, value: string): void {
  const user = load<Partial<Record<ConfigKey, string>>>('config', {});
  user[key] = value.trim();
  save('config', user);
}

/** The exact URL that must be registered as redirect URI with the providers. */
export function redirectUri(): string {
  return window.location.origin + window.location.pathname;
}
