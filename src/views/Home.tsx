import { useEffect, useState } from 'react';
import { TrackCards, TrackList } from '../components/TrackList';
import { LinkIcon, SearchIcon } from '../components/Icons';
import { useStore } from '../lib/store';
import { providers } from '../providers';
import { deezerCharts } from '../providers/deezer';
import type { Track } from '../providers/types';
import { connections } from '../state/connections';
import { library } from '../state/library';
import { go } from '../state/ui';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
}

export function Home() {
  const recent = useStore(library, (s) => s.recent);
  const favorites = useStore(library, (s) => s.favorites);
  const conn = useStore(connections, (s) => s);
  const [charts, setCharts] = useState<Track[] | null>(null);
  const [chartError, setChartError] = useState(false);

  useEffect(() => {
    deezerCharts().then(setCharts).catch(() => setChartError(true));
  }, []);

  const loginProviders = providers.filter((p) => p.requiresLogin);
  const connectedCount = loginProviders.filter((p) => conn[p.id]?.connected).length;

  return (
    <div className="view home">
      <section className="hero glass">
        <div className="hero-text">
          <span className="eyebrow">Alle Musik. Eine App.</span>
          <h1>{greeting()} 👋</h1>
          <p>
            Spotify, YouTube, Apple Music, SoundCloud und Deezer – durchsuche alles auf einmal, mische Songs aller
            Plattformen in einer Warteschlange und höre direkt hier.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => go('search')}>
              <SearchIcon size={18} /> Musik suchen
            </button>
            <button className="ghost-btn" onClick={() => go('connect')}>
              <LinkIcon size={18} /> {connectedCount}/{loginProviders.length} Konten verbunden
            </button>
          </div>
        </div>
        <div className="hero-orbs" aria-hidden="true">
          {providers.map((p, i) => (
            <span key={p.id} className={`orb ${conn[p.id]?.connected ? 'on' : ''}`} style={{ '--pc': p.color, '--i': i } as React.CSSProperties}>
              {p.name[0]}
            </span>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2>Zuletzt gehört</h2>
          <TrackCards tracks={recent.slice(0, 12)} />
        </section>
      )}

      {favorites.length > 0 && (
        <section>
          <div className="section-head">
            <h2>Deine Favoriten</h2>
            <button className="link-btn" onClick={() => go('library')}>Alle anzeigen</button>
          </div>
          <TrackList tracks={favorites.slice(0, 5)} />
        </section>
      )}

      <section>
        <div className="section-head">
          <h2>Trends gerade</h2>
          <span className="muted small">Charts via Deezer · Hörproben</span>
        </div>
        {charts ? (
          <TrackCards tracks={charts} />
        ) : chartError ? (
          <p className="muted">Charts konnten nicht geladen werden.</p>
        ) : (
          <div className="card-row skeleton-row">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton-card" />)}</div>
        )}
      </section>
    </div>
  );
}
