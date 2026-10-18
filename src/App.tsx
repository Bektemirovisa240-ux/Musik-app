import { useEffect } from 'react';
import { LedBackground } from './components/LedBackground';
import { MediaDock } from './components/MediaDock';
import { NowPlaying } from './components/NowPlaying';
import { PlayerBar } from './components/PlayerBar';
import { QueuePanel } from './components/QueuePanel';
import { Logo, Sidebar } from './components/Sidebar';
import { Toasts } from './components/Toasts';
import { HomeIcon, LibraryIcon, LinkIcon, SearchIcon } from './components/Icons';
import { useStore } from './lib/store';
import { togglePlay } from './player/player';
import { go, ui } from './state/ui';
import { CollectionView } from './views/CollectionView';
import { Connect } from './views/Connect';
import { Home } from './views/Home';
import { Library } from './views/Library';
import { Search } from './views/Search';

const VIEWS = { home: Home, search: Search, library: Library, connect: Connect, collection: CollectionView };

function MobileNav() {
  const view = useStore(ui, (s) => s.view);
  const items = [
    { v: 'home', Icon: HomeIcon, label: 'Start' },
    { v: 'search', Icon: SearchIcon, label: 'Suche' },
    { v: 'library', Icon: LibraryIcon, label: 'Bibliothek' },
    { v: 'connect', Icon: LinkIcon, label: 'Konten' },
  ] as const;
  return (
    <nav className="mobile-nav glass">
      {items.map(({ v, Icon, label }) => (
        <button key={v} className={view === v ? 'active' : ''} onClick={() => go(v)}>
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function App() {
  const view = useStore(ui, (s) => s.view);
  const collectionKey = useStore(ui, (s) => s.collection?.id);
  const View = VIEWS[view];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName) && !target.isContentEditable) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app">
      <LedBackground />
      <Sidebar />
      <header className="mobile-top">
        <Logo />
      </header>
      <main className="main" key={view === 'collection' ? `c-${collectionKey}` : view}>
        <View />
      </main>
      <QueuePanel />
      <MediaDock />
      <PlayerBar />
      <MobileNav />
      <NowPlaying />
      <Toasts />
    </div>
  );
}
