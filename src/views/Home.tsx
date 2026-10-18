import { useEffect, useState } from 'react';
import { CollectionCards } from '../components/CollectionCards';
import { LinkIcon, PlayIcon, SearchIcon } from '../components/Icons';
import { TrackCards, TrackList } from '../components/TrackList';
import { loadHomeFeed, type HomeFeed } from '../lib/catalog';
import { useStore } from '../lib/store';
import { playTrack } from '../player/player';
import { providers } from '../providers';
import { connections } from '../state/connections';
import { library } from '../state/library';
import { go } from '../state/ui';

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
}

/** Slowly scrolling wall of real album covers. */
function CoverWall({ images }: { images: string[] }) {
  if (images.length < 6) return <div className="cover-wall empty" aria-hidden="true" />;
  const cols = [0, 1, 2].map((c) => images.filter((_, i) => i % 3 === c));
  return (
    <div className="cover-wall" aria-hidden="true">
      {cols.map((col, c) => (
        <div key={c} className={`cover-col c${c}`}>
          {[...col, ...col].map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
          ))}
        </div>
      ))}
    </div>
  );
}

function Skeletons() {
  return <div className="card-row skeleton-row">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton-card" />)}</div>;
}

export function Home() {
  const recent = useStore(library, (s) => s.recent);
  const favorites = useStore(library, (s) => s.favorites);
  const conn = useStore(connections, (s) => s);
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadHomeFeed().then(setFeed).catch(() => setFailed(true));
  }, []);

  const loginProviders = providers.filter((p) => p.requiresLogin);
  const connectedCount = loginProviders.filter((p) => conn[p.id]?.connected).length;
  const wall = [...(feed?.albums ?? []).map((a) => a.image), ...(feed?.tracks ?? []).map((t) => t.artwork)]
    .filter((x): x is string => !!x)
    .filter((x, i, a) => a.indexOf(x) === i)
    .slice(0, 18);
  const top = feed?.tracks[0];

  return (
    <div className="view home">
      <section className="hero glass">
        <CoverWall images={wall} />
        <div className="hero-text">
          <span className="eyebrow">Alle Musik. Eine App.</span>
          <h1>{greeting()} 👋</h1>
          <p>
            Spotify, YouTube, Apple Music, SoundCloud und Deezer – durchsuche alles auf einmal, mische Songs aller
            Plattformen in einer Warteschlange und höre direkt hier.
          </p>
          <div className="hero-actions">
            {top ? (
              <button className="primary-btn" onClick={() => playTrack(top, feed!.tracks)}>
                <PlayIcon size={16} /> Charts abspielen
              </button>
            ) : (
              <button className="primary-btn" onClick={() => go('search')}>
                <SearchIcon size={18} /> Musik suchen
              </button>
            )}
            <button className="ghost-btn" onClick={() => go('connect')}>
              <LinkIcon size={18} /> {connectedCount}/{loginProviders.length} Konten verbunden
            </button>
          </div>
          {top && (
            <p className="hero-now small">
              🔥 Platz 1 gerade: <strong>{top.title}</strong> – {top.artist}
            </p>
          )}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2>Zuletzt gehört</h2>
          <TrackCards tracks={recent.slice(0, 12)} />
        </section>
      )}

      <section>
        <div className="section-head">
          <h2>Top-Songs</h2>
          {feed && <span className="muted small">{feed.source} · live</span>}
        </div>
        {feed ? <TrackCards tracks={feed.tracks} /> : failed ? <p className="muted">Charts konnten nicht geladen werden – bist du online?</p> : <Skeletons />}
      </section>

      {(!feed || feed.artists.length > 0) && !failed && (
        <section>
          <h2>Angesagte Künstler</h2>
          {feed ? <CollectionCards items={feed.artists} /> : <Skeletons />}
        </section>
      )}

      {(!feed || feed.albums.length > 0) && !failed && (
        <section>
          <h2>Top-Alben</h2>
          {feed ? <CollectionCards items={feed.albums} /> : <Skeletons />}
        </section>
      )}

      {feed && feed.playlists.length > 0 && (
        <section>
          <h2>Beliebte Playlists</h2>
          <CollectionCards items={feed.playlists} />
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
    </div>
  );
}
