import { formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { addToQueue, currentTrack, player, playTrack, togglePlay } from '../player/player';
import type { Track } from '../providers/types';
import { library, toggleFavorite } from '../state/library';
import { Artwork } from './Artwork';
import { Equalizer } from './Equalizer';
import { ExternalIcon, HeartFilledIcon, HeartIcon, PlayIcon, PlusIcon } from './Icons';
import { ProviderBadge } from './ProviderBadge';

export function FavoriteButton({ track }: { track: Track }) {
  const fav = useStore(library, (s) => s.favorites.some((t) => t.key === track.key));
  return (
    <button
      className={`icon-btn fav ${fav ? 'active' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(track);
      }}
      aria-label={fav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      title={fav ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}
    >
      {fav ? <HeartFilledIcon size={18} /> : <HeartIcon size={18} />}
    </button>
  );
}

export function TrackList({ tracks, showProvider = true }: { tracks: Track[]; showProvider?: boolean }) {
  const currentKey = useStore(player, (s) => currentTrack(s)?.key);
  const playing = useStore(player, (s) => s.playing);

  return (
    <ol className="track-list">
      {tracks.map((t, i) => {
        const isCurrent = t.key === currentKey;
        return (
          <li
            key={t.key + i}
            className={`track-row ${isCurrent ? 'current' : ''}`}
            onClick={() => (isCurrent ? togglePlay() : playTrack(t, tracks))}
            onKeyDown={(e) => e.key === 'Enter' && (isCurrent ? togglePlay() : playTrack(t, tracks))}
            tabIndex={0}
          >
            <span className="track-num">
              {isCurrent ? <Equalizer active={playing} /> : <span className="num">{i + 1}</span>}
              <PlayIcon className="hover-play" size={16} />
            </span>
            <Artwork src={t.artwork} alt={t.album ?? t.title} className="sm" />
            <span className="track-meta">
              <span className="track-title">{t.title}</span>
              <span className="track-artist">{t.artist}</span>
            </span>
            <span className="track-album">{t.album}</span>
            {showProvider && <ProviderBadge id={t.provider} />}
            <span className="track-actions">
              <FavoriteButton track={t} />
              <button
                className="icon-btn"
                title="Zur Warteschlange"
                aria-label="Zur Warteschlange"
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue(t);
                }}
              >
                <PlusIcon size={18} />
              </button>
              {t.externalUrl && (
                <a
                  className="icon-btn"
                  href={t.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="In der Original-App öffnen"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalIcon size={16} />
                </a>
              )}
            </span>
            <span className="track-dur">{t.durationMs ? formatTime(t.durationMs) : ''}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function TrackCards({ tracks }: { tracks: Track[] }) {
  const currentKey = useStore(player, (s) => currentTrack(s)?.key);
  const playing = useStore(player, (s) => s.playing);
  return (
    <div className="card-row">
      {tracks.map((t) => {
        const isCurrent = t.key === currentKey;
        return (
          <button key={t.key} className={`track-card ${isCurrent ? 'current' : ''}`} onClick={() => (isCurrent ? togglePlay() : playTrack(t, tracks))}>
            <span className="card-art">
              <Artwork src={t.artwork} alt={t.title} />
              <span className="card-play">{isCurrent && playing ? <Equalizer /> : <PlayIcon size={22} />}</span>
              <span className="card-badge">
                <ProviderBadge id={t.provider} compact />
              </span>
            </span>
            <span className="card-title">{t.title}</span>
            <span className="card-artist">{t.artist}</span>
          </button>
        );
      })}
    </div>
  );
}
