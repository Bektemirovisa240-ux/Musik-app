import type { Collection } from '../lib/catalog';
import { openCollection } from '../state/ui';
import { Artwork } from './Artwork';
import { PlayIcon } from './Icons';

export function CollectionCards({ items }: { items: Collection[] }) {
  return (
    <div className="card-row">
      {items.map((c) => (
        <button key={`${c.source}:${c.kind}:${c.id}`} className={`track-card coll-${c.kind}`} onClick={() => openCollection(c)}>
          <span className="card-art">
            <Artwork src={c.image} alt={c.title} />
            <span className="card-play">
              <PlayIcon size={22} />
            </span>
          </span>
          <span className="card-title">{c.title}</span>
          {c.subtitle && <span className="card-artist">{c.subtitle}</span>}
        </button>
      ))}
    </div>
  );
}
