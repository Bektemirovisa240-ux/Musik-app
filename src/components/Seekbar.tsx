import { useState } from 'react';
import { formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { player, seek } from '../player/player';

export function Seekbar({ large }: { large?: boolean }) {
  const pos = useStore(player, (s) => s.positionMs);
  const dur = useStore(player, (s) => s.durationMs);
  const [drag, setDrag] = useState<number | null>(null);
  const value = drag ?? pos;
  const pct = dur > 0 ? Math.min(100, (value / dur) * 100) : 0;

  return (
    <div className={`seek ${large ? 'large' : ''}`}>
      <span className="time">{formatTime(value)}</span>
      <input
        type="range"
        className="range"
        min={0}
        max={dur || 1}
        step={250}
        value={value}
        disabled={!dur}
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
        onChange={(e) => setDrag(Number(e.target.value))}
        onPointerUp={() => {
          if (drag != null) seek(drag);
          setDrag(null);
        }}
        onKeyUp={() => {
          if (drag != null) seek(drag);
          setDrag(null);
        }}
        aria-label="Position"
      />
      <span className="time">{formatTime(dur)}</span>
    </div>
  );
}
