import { useStore } from '../lib/store';
import { player, playAt, removeFromQueue } from '../player/player';
import { ui } from '../state/ui';
import { Artwork } from './Artwork';
import { Equalizer } from './Equalizer';
import { CloseIcon } from './Icons';
import { ProviderBadge } from './ProviderBadge';

export function QueuePanel() {
  const open = useStore(ui, (s) => s.queueOpen);
  const queue = useStore(player, (s) => s.queue);
  const index = useStore(player, (s) => s.index);
  const playing = useStore(player, (s) => s.playing);

  return (
    <aside className={`queue-panel glass ${open ? 'open' : ''}`} aria-hidden={!open}>
      <header>
        <h3>Warteschlange</h3>
        <button className="icon-btn" onClick={() => ui.set({ queueOpen: false })} aria-label="Schließen">
          <CloseIcon size={18} />
        </button>
      </header>
      {queue.length === 0 ? (
        <p className="muted">Noch leer. Füge Songs mit + hinzu – Spotify, YouTube & Co. lassen sich frei mischen.</p>
      ) : (
        <ul>
          {queue.map((t, i) => (
            <li key={t.key + i} className={i === index ? 'current' : i < index ? 'played' : ''} onClick={() => playAt(i)}>
              <Artwork src={t.artwork} alt={t.title} className="xs" />
              <span className="q-meta">
                <span className="q-title">{t.title}</span>
                <span className="q-artist">
                  <ProviderBadge id={t.provider} compact /> {t.artist}
                </span>
              </span>
              {i === index ? (
                <Equalizer active={playing} />
              ) : (
                <button
                  className="icon-btn"
                  aria-label="Entfernen"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(i);
                  }}
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
