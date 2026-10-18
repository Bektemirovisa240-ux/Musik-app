import { useStore } from '../lib/store';
import { currentTrack, player, setVolume } from '../player/player';
import { ui } from '../state/ui';
import { Artwork } from './Artwork';
import { Controls } from './Controls';
import { MuteIcon, QueueIcon, VolumeIcon } from './Icons';
import { ProviderBadge } from './ProviderBadge';
import { Seekbar } from './Seekbar';
import { FavoriteButton } from './TrackList';

export function PlayerBar() {
  const track = useStore(player, (s) => currentTrack(s));
  const volume = useStore(player, (s) => s.volume);
  const previewOnly = useStore(player, (s) => s.previewOnly);
  const queueOpen = useStore(ui, (s) => s.queueOpen);

  return (
    <footer className="player-bar">
      <div className="led-strip" aria-hidden="true" />
      <div className="pb-track">
        {track ? (
          <>
            <button className="pb-art" onClick={() => ui.set({ nowPlayingOpen: true })} title="Vollbild-Player öffnen">
              <Artwork src={track.artwork} alt={track.title} />
            </button>
            <div className="pb-meta">
              <span className="pb-title">{track.title}</span>
              <span className="pb-artist">
                <ProviderBadge id={track.provider} compact /> {track.artist}
                {previewOnly && <em className="preview-tag">Hörprobe</em>}
              </span>
            </div>
            <FavoriteButton track={track} />
          </>
        ) : (
          <div className="pb-empty">Wähle einen Song – egal von welcher Plattform.</div>
        )}
      </div>
      <div className="pb-center">
        <Controls />
        <Seekbar />
      </div>
      <div className="pb-right">
        <button className={`icon-btn toggle ${queueOpen ? 'active' : ''}`} onClick={() => ui.set({ queueOpen: !queueOpen })} title="Warteschlange">
          <QueueIcon size={18} />
        </button>
        <button className="icon-btn" onClick={() => setVolume(volume > 0 ? 0 : 0.8)} title="Stumm">
          {volume > 0 ? <VolumeIcon size={18} /> : <MuteIcon size={18} />}
        </button>
        <input
          type="range"
          className="range volume"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ '--pct': `${volume * 100}%` } as React.CSSProperties}
          aria-label="Lautstärke"
        />
      </div>
    </footer>
  );
}
