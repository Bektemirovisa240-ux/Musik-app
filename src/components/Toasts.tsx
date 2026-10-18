import { useStore } from '../lib/store';
import { dismiss, toasts } from '../state/toasts';

export function Toasts() {
  const items = useStore(toasts, (s) => s.items);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <button key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>
          {t.text}
        </button>
      ))}
    </div>
  );
}
