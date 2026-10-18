export type ProviderId = 'spotify' | 'youtube' | 'apple' | 'deezer' | 'soundcloud';

export interface Track {
  /** Globally unique key: "<provider>:<sourceId>" */
  key: string;
  provider: ProviderId;
  /** Provider specific id/uri used for playback. */
  sourceId: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  durationMs?: number;
  externalUrl?: string;
  /** 30s preview, used as fallback when full playback is not possible. */
  previewUrl?: string;
}

export interface Profile {
  name: string;
  email?: string;
  avatar?: string;
}

export interface PlaybackUpdate {
  playing?: boolean;
  positionMs?: number;
  durationMs?: number;
  ended?: boolean;
  /** Metadata discovered during playback (e.g. title of a pasted YouTube link). */
  meta?: Partial<Pick<Track, 'title' | 'artist' | 'durationMs'>>;
}

export type Emit = (update: PlaybackUpdate) => void;

export interface Engine {
  id: string;
  /** Loads the track and starts playback. Rejects if playback is impossible. */
  load(track: Track, volume: number): Promise<void>;
  pause(): void;
  resume(): void;
  seek(ms: number): void;
  setVolume(volume: number): void;
  stop(): void;
  bind(emit: Emit): void;
}

export interface ConfigField {
  key: import('../lib/config').ConfigKey;
  label: string;
  placeholder: string;
  secret?: boolean;
}

export interface Provider {
  id: ProviderId;
  name: string;
  /** Brand-ish accent color used for badges. */
  color: string;
  tagline: string;
  /** Short honest note about what playback is possible. */
  playbackNote: string;
  setupSteps: string[];
  configFields: ConfigField[];
  /** False for providers that work without an account (Deezer previews, SoundCloud links). */
  requiresLogin: boolean;
  isConfigured(): boolean;
  isConnected(): boolean;
  /** Can search right now (connected, or via API key / public API). */
  canSearch(): boolean;
  connect(): Promise<void>;
  disconnect(): void;
  getProfile?(): Promise<Profile>;
  search?(query: string): Promise<Track[]>;
  library?(): Promise<Track[]>;
  libraryName?: string;
  /** Resolves a pasted share link into a track. Returns null if the URL isn't for this provider. */
  resolveUrl?(url: URL): Promise<Track | null>;
  engine: Engine;
}
