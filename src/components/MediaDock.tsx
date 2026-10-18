import { useState } from 'react';
import { useStore } from '../lib/store';
import { player } from '../player/player';
import { SC_HOST_ID } from '../providers/soundcloud';
import { YT_HOST_ID } from '../providers/youtube';
import { ChevronDownIcon } from './Icons';

/**
 * Hosts the official YouTube / SoundCloud players. They must stay mounted and
 * visible while playing (platform terms), so they live in a floating dock.
 */
export function MediaDock() {
  const engine = useStore(player, (s) => s.engine);
  const [small, setSmall] = useState(false);
  const visible = engine === 'youtube' || engine === 'soundcloud';

  return (
    <div className={`media-dock glass ${visible ? 'visible' : ''} ${small ? 'small' : ''} show-${engine}`}>
      <div className="dock-head">
        <span>{engine === 'soundcloud' ? 'SoundCloud-Player' : 'YouTube-Player'}</span>
        <button className="icon-btn" onClick={() => setSmall(!small)} aria-label={small ? 'Vergrößern' : 'Verkleinern'}>
          <ChevronDownIcon size={16} style={{ transform: small ? 'rotate(180deg)' : undefined }} />
        </button>
      </div>
      <div className="dock-body">
        <div id={YT_HOST_ID} className="dock-frame yt" />
        <div id={SC_HOST_ID} className="dock-frame sc" />
      </div>
    </div>
  );
}
