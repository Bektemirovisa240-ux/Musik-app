import { providerById } from '../providers';
import type { ProviderId } from '../providers/types';

export function ProviderBadge({ id, compact }: { id: ProviderId; compact?: boolean }) {
  const p = providerById[id];
  return (
    <span className={`provider-badge ${compact ? 'compact' : ''}`} style={{ '--pc': p.color } as React.CSSProperties} title={p.name}>
      <i />
      {!compact && p.name}
    </span>
  );
}
