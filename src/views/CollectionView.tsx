import { useEffect, useState } from 'react';
import { Artwork } from '../components/Artwork';
import { ChevronDownIcon, PlayIcon, ShuffleIcon } from '../components/Icons';
import { TrackList } from '../components/TrackList';
import { loadCollection } from '../lib/catalog';
import { errorMessage, formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { player, playTrack } from '../player/player';
import type { Track } from '../providers/types';
import { go, ui } from '../state/ui';

const KIND = { album: 'Album', artist: 'Künstler · Top-Songs', playlist: 'Playlist' };

export function CollectionView() {
  const c = useStore(ui, (s) => s.collection);
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!c) return;
    let cancelled = false;
    setTracks(null);
    setError(null);
    loadCollection(c)
      .then((t) => !cancelled && setTracks(t))
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [c]);

  if (!c) return null;
  const total = tracks?.reduce((sum, t) => sum + (t.durationMs ?? 0), 0) ?? 0;

  const shufflePlay = () => {
    if (!tracks?.length) return;
    player.set({ shuffle: true });
    playTrack(tracks[Math.floor(Math.random() * tracks.length)], tracks);
  };

  return (
    <div className="view collection">
      <header className={`coll-hero coll-${c.kind}`}>
        {c.image && <div className="coll-backdrop" style={{ backgroundImage: `url("${c.image}")` }} />}
        <button className="icon-btn coll-back" onClick={() => go('home')} aria-label="Zurück">
          <ChevronDownIcon size={22} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <div className="coll-cover">
          <Artwork src={c.image} alt={c.title} />
        </div>
        <div className="coll-info">
          <span className="eyebrow">{KIND[c.kind]}</span>
          <h1>{c.title}</h1>
          <p className="muted">
            {c.subtitle}
            {tracks && ` · ${tracks.length} Songs${total ? ` · ${formatTime(total)}` : ''}`}
          </p>
          <div className="hero-actions">
            <button className="primary-btn" disabled={!tracks?.length} onClick={() => tracks && playTrack(tracks[0], tracks)}>
              <PlayIcon size={16} /> Abspielen
            </button>
            <button className="ghost-btn" disabled={!tracks?.length} onClick={shufflePlay}>
              <ShuffleIcon size={16} /> Zufällig
            </button>
          </div>
        </div>
      </header>
      {error ? (
        <p className="error-text">{error}</p>
      ) : tracks ? (
        <TrackList tracks={tracks} />
      ) : (
        <div className="skeleton-list">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton-line" />)}</div>
      )}
    </div>
  );
}
