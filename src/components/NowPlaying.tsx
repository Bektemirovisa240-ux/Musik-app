import { useEffect } from 'react';
import { useStore } from '../lib/store';
import { currentTrack, player } from '../player/player';
import { providerById } from '../providers';
import { ui } from '../state/ui';
import { Artwork } from './Artwork';
import { Controls } from './Controls';
import { ChevronDownIcon, ExternalIcon } from './Icons';
import { ProviderBadge } from './ProviderBadge';
import { Seekbar } from './Seekbar';
import { FavoriteButton } from './TrackList';

export function NowPlaying() {
  const open = useStore(ui, (s) => s.nowPlayingOpen);
  const track = useStore(player, (s) => currentTrack(s));
  const playing = useStore(player, (s) => s.playing);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.set({ nowPlayingOpen: false });
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || !track) return null;
  return (
    <div className="now-playing" role="dialog" aria-label="Aktueller Titel">
      {track.artwork && <div className="np-backdrop" style={{ backgroundImage: `url("${track.artwork}")` }} />}
      <button className="icon-btn np-close" onClick={() => ui.set({ nowPlayingOpen: false })} aria-label="Schließen">
        <ChevronDownIcon size={26} />
      </button>
      <div className="np-content">
        <div className={`np-art ${playing ? 'playing' : ''}`}>
          <div className="np-ring" />
          <Artwork src={track.artwork} alt={track.title} />
        </div>
        <div className="np-info">
          <ProviderBadge id={track.provider} />
          <h1>{track.title}</h1>
          <p>{track.artist}{track.album ? ` · ${track.album}` : ''}</p>
        </div>
        <Seekbar large />
        <Controls large />
        <div className="np-extra">
          <FavoriteButton track={track} />
          {track.externalUrl && (
            <a className="ghost-btn" href={track.externalUrl} target="_blank" rel="noreferrer">
              <ExternalIcon size={16} /> In {providerById[track.provider].name} öffnen
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
