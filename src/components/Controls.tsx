import { useStore } from '../lib/store';
import { cycleRepeat, next, player, previous, togglePlay, toggleShuffle } from '../player/player';
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon, ShuffleIcon } from './Icons';

export function Controls({ large }: { large?: boolean }) {
  const playing = useStore(player, (s) => s.playing);
  const loading = useStore(player, (s) => s.loading);
  const shuffle = useStore(player, (s) => s.shuffle);
  const repeat = useStore(player, (s) => s.repeat);
  const hasQueue = useStore(player, (s) => s.queue.length > 0);

  return (
    <div className={`controls ${large ? 'large' : ''}`}>
      <button className={`icon-btn toggle ${shuffle ? 'active' : ''}`} onClick={toggleShuffle} title="Zufallswiedergabe" aria-pressed={shuffle}>
        <ShuffleIcon size={18} />
      </button>
      <button className="icon-btn" onClick={previous} disabled={!hasQueue} title="Zurück">
        <PrevIcon size={large ? 26 : 20} />
      </button>
      <button className={`play-btn ${loading ? 'loading' : ''}`} onClick={togglePlay} disabled={!hasQueue} aria-label={playing ? 'Pause' : 'Abspielen'}>
        {playing ? <PauseIcon size={large ? 30 : 22} /> : <PlayIcon size={large ? 30 : 22} />}
      </button>
      <button className="icon-btn" onClick={next} disabled={!hasQueue} title="Weiter">
        <NextIcon size={large ? 26 : 20} />
      </button>
      <button
        className={`icon-btn toggle ${repeat !== 'off' ? 'active' : ''}`}
        onClick={cycleRepeat}
        title={repeat === 'one' ? 'Titel wiederholen' : repeat === 'all' ? 'Alle wiederholen' : 'Wiederholen aus'}
      >
        <RepeatIcon size={18} />
        {repeat === 'one' && <small className="repeat-one">1</small>}
      </button>
    </div>
  );
}
