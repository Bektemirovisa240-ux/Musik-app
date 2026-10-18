import { useStore } from '../lib/store';
import { providers } from '../providers';
import { connections } from '../state/connections';
import { go, ui, type View } from '../state/ui';
import { HomeIcon, LibraryIcon, LinkIcon, SearchIcon } from './Icons';

const NAV: { view: View; label: string; Icon: typeof HomeIcon }[] = [
  { view: 'home', label: 'Start', Icon: HomeIcon },
  { view: 'search', label: 'Suche', Icon: SearchIcon },
  { view: 'library', label: 'Bibliothek', Icon: LibraryIcon },
  { view: 'connect', label: 'Verbindungen', Icon: LinkIcon },
];

export function Logo() {
  return (
    <div className="logo">
      <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
        <rect width="64" height="64" rx="16" className="logo-bg" />
        <path d="M8 34h10l5-14 8 28 7-20 4 6h14" className="logo-pulse" />
      </svg>
      <span>Pulse</span>
    </div>
  );
}

export function Sidebar() {
  const view = useStore(ui, (s) => s.view);
  const conn = useStore(connections, (s) => s);
  return (
    <nav className="sidebar glass">
      <Logo />
      <ul className="nav">
        {NAV.map(({ view: v, label, Icon }) => (
          <li key={v}>
            <button className={view === v ? 'active' : ''} onClick={() => go(v)}>
              <Icon size={20} />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="side-platforms">
        <h4>Plattformen</h4>
        {providers.map((p) => {
          const on = conn[p.id]?.connected;
          return (
            <button key={p.id} className="side-platform" onClick={() => go('connect')}>
              <i className={on ? 'on' : ''} style={{ '--pc': p.color } as React.CSSProperties} />
              <span>{p.name}</span>
              <small>{on ? (p.requiresLogin ? 'verbunden' : 'aktiv') : 'verbinden'}</small>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
