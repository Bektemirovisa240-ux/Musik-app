import { createStore } from '../lib/store';
import { providers } from '../providers';
import type { Profile, ProviderId } from '../providers/types';

type Status = { connected: boolean; profile?: Profile };

export const connections = createStore<Record<ProviderId, Status>>(
  Object.fromEntries(providers.map((p) => [p.id, { connected: p.isConnected() }])) as Record<ProviderId, Status>,
);

/** Re-reads every provider's connection state and fetches account info. */
export async function refreshConnections() {
  await Promise.all(
    providers.map(async (p) => {
      const connected = p.isConnected();
      let profile: Profile | undefined;
      if (connected && p.requiresLogin && p.getProfile) profile = await p.getProfile().catch(() => undefined);
      connections.set({ [p.id]: { connected, profile } } as Partial<Record<ProviderId, Status>>);
    }),
  );
}
