import { apple } from './apple';
import { deezer } from './deezer';
import { soundcloud } from './soundcloud';
import { spotify } from './spotify';
import type { Provider, ProviderId } from './types';
import { youtube } from './youtube';

export const providers: Provider[] = [spotify, youtube, apple, soundcloud, deezer];

export const providerById = Object.fromEntries(providers.map((p) => [p.id, p])) as Record<ProviderId, Provider>;

/** Platforms people ask for that offer no public web playback API. */
export const unsupported = [
  { name: 'Amazon Music', reason: 'Keine öffentliche Wiedergabe-Schnittstelle für fremde Apps.' },
  { name: 'Tidal', reason: 'Wiedergabe-SDK nur für ausgewählte Partner freigegeben.' },
];
