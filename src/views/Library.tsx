import { useEffect, useState } from 'react';
import { TrackList } from '../components/TrackList';
import { errorMessage } from '../lib/format';
import { useStore } from '../lib/store';
import { playTrack } from '../player/player';
import { providers } from '../providers';
import type { ProviderId, Track } from '../providers/types';
import { connections } from '../state/connections';
import { library } from '../state/library';
import { go } from '../state/ui';
import { PlayIcon } from '../components/Icons';

type Tab = 'favorites' | ProviderId;

export function Library() {
  const favorites = useStore(library, (s) => s.favorites);
  const conn = useStore(connections, (s) => s);
  const [tab, setTab] = useState<Tab>('favorites');
  const [remote, setRemote] = useState<{ tracks?: Track[]; error?: string; loading?: boolean }>({});

  const withLibrary = providers.filter((p) => p.library && conn[p.id]?.connected);

  useEffect(() => {
    if (tab === 'favorites') return;
    const p = providers.find((x) => x.id === tab);
    if (!p?.library) return;
    let cancelled = false;
    setRemote({ loading: true });
    p.library()
      .then((tracks) => !cancelled && setRemote({ tracks }))
      .catch((e) => !cancelled && setRemote({ error: errorMessage(e) }));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const list = tab === 'favorites' ? favorites : remote.tracks ?? [];

  return (
    <div className="view library">
      <div className="section-head">
        <h1>Bibliothek</h1>
        {list.length > 0 && (
          <button className="primary-btn" onClick={() => playTrack(list[0], list)}>
            <PlayIcon size={16} /> Alle abspielen
          </button>
        )}
      </div>
      <div className="chips">
        <button className={`chip ${tab === 'favorites' ? 'active' : ''}`} onClick={() => setTab('favorites')}>
          ♥ Pulse-Favoriten <small>{favorites.length}</small>
        </button>
        {withLibrary.map((p) => (
          <button key={p.id} className={`chip ${tab === p.id ? 'active' : ''}`} onClick={() => setTab(p.id)}>
            {p.libraryName}
          </button>
        ))}
      </div>

      {tab === 'favorites' ? (
        favorites.length ? (
          <TrackList tracks={favorites} />
        ) : (
          <div className="empty glass">
            <h3>Noch keine Favoriten</h3>
            <p className="muted">Tippe bei einem Song auf ♥ – deine Favoriten sammeln Songs aller Plattformen an einem Ort.</p>
          </div>
        )
      ) : remote.loading ? (
        <div className="skeleton-list">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton-line" />)}</div>
      ) : remote.error ? (
        <p className="error-text">{remote.error}</p>
      ) : (
        <TrackList tracks={list} showProvider={false} />
      )}

      {withLibrary.length === 0 && (
        <p className="muted small">
          Verbinde Spotify, YouTube oder Apple Music unter{' '}
          <button className="link-btn" onClick={() => go('connect')}>Verbindungen</button>, um deine dortigen Bibliotheken hier zu sehen.
        </p>
      )}
    </div>
  );
}
