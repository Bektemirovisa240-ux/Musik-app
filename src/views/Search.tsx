import { useEffect, useRef, useState } from 'react';
import { TrackList } from '../components/TrackList';
import { ProviderBadge } from '../components/ProviderBadge';
import { SearchIcon, CloseIcon } from '../components/Icons';
import { errorMessage } from '../lib/format';
import { useStore } from '../lib/store';
import { playTrack } from '../player/player';
import { providerById, providers } from '../providers';
import type { ProviderId, Track } from '../providers/types';
import { connections } from '../state/connections';
import { toast } from '../state/toasts';
import { go, ui } from '../state/ui';

type Result = { status: 'loading' | 'done' | 'error'; tracks: Track[]; error?: string };

function asUrl(q: string): URL | null {
  try {
    const u = new URL(q.trim());
    return u.protocol.startsWith('http') ? u : null;
  } catch {
    return null;
  }
}

export function Search() {
  const query = useStore(ui, (s) => s.query);
  useStore(connections, (s) => s); // re-run when accounts change
  const [results, setResults] = useState<Partial<Record<ProviderId, Result>>>({});
  const [filter, setFilter] = useState<ProviderId | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchable = providers.filter((p) => p.canSearch());

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults({});
      return;
    }
    let cancelled = false;
    const url = asUrl(q);
    const timer = setTimeout(async () => {
      if (url) {
        // Pasted share link → resolve and play directly.
        for (const p of providers) {
          try {
            const t = await p.resolveUrl?.(url);
            if (t && !cancelled) {
              setResults({ [p.id]: { status: 'done', tracks: [t] } });
              playTrack(t);
              return;
            }
          } catch (e) {
            if (!cancelled) toast(errorMessage(e), 'error');
            return;
          }
        }
        if (!cancelled) toast('Dieser Link wird nicht unterstützt.', 'error');
        return;
      }
      setResults(Object.fromEntries(searchable.map((p) => [p.id, { status: 'loading', tracks: [] }])));
      await Promise.all(
        searchable.map(async (p) => {
          let r: Result;
          try {
            r = { status: 'done', tracks: (await p.search!(q)) ?? [] };
          } catch (e) {
            r = { status: 'error', tracks: [], error: errorMessage(e) };
          }
          if (!cancelled) setResults((prev) => ({ ...prev, [p.id]: r }));
        }),
      );
    }, url ? 0 : 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchable.map((p) => p.id).join()]);

  const ids = Object.keys(results) as ProviderId[];
  const shown = filter === 'all' ? ids : ids.filter((id) => id === filter);
  const notSearchable = providers.filter((p) => !p.canSearch() && p.id !== 'soundcloud');

  return (
    <div className="view search">
      <div className="search-box glass">
        <SearchIcon size={22} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => ui.set({ query: e.target.value })}
          placeholder="Songs, Künstler … oder einen Link von Spotify, YouTube, SoundCloud, Apple Music einfügen"
          aria-label="Suche"
        />
        {query && (
          <button className="icon-btn" onClick={() => ui.set({ query: '' })} aria-label="Leeren">
            <CloseIcon size={18} />
          </button>
        )}
      </div>

      {ids.length > 1 && (
        <div className="chips">
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Alle
          </button>
          {ids.map((id) => (
            <button key={id} className={`chip ${filter === id ? 'active' : ''}`} onClick={() => setFilter(id)}>
              <ProviderBadge id={id} />
              <small>{results[id]?.tracks.length ?? 0}</small>
            </button>
          ))}
        </div>
      )}

      {!query && (
        <div className="search-empty">
          <h2>Suche überall gleichzeitig</h2>
          <p className="muted">
            Aktuell durchsucht: {searchable.map((p) => p.name).join(', ')}.
            {notSearchable.length > 0 && (
              <>
                {' '}Verbinde{' '}
                <button className="link-btn" onClick={() => go('connect')}>
                  {notSearchable.map((p) => p.name).join(', ')}
                </button>{' '}
                für mehr Treffer.
              </>
            )}
          </p>
          <p className="muted small">Tipp: Einen SoundCloud- oder YouTube-Link einfügen spielt ihn sofort ab.</p>
        </div>
      )}

      {shown.map((id) => {
        const r = results[id]!;
        return (
          <section key={id} className="result-group">
            <div className="section-head">
              <h2>
                <ProviderBadge id={id} />
              </h2>
              {r.status === 'done' && <span className="muted small">{providerById[id].playbackNote}</span>}
            </div>
            {r.status === 'loading' && <div className="skeleton-list">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton-line" />)}</div>}
            {r.status === 'error' && <p className="error-text">{r.error}</p>}
            {r.status === 'done' &&
              (r.tracks.length ? <TrackList tracks={filter === 'all' ? r.tracks.slice(0, 6) : r.tracks} /> : <p className="muted">Keine Treffer.</p>)}
            {filter === 'all' && r.status === 'done' && r.tracks.length > 6 && (
              <button className="link-btn" onClick={() => setFilter(id)}>
                Alle {r.tracks.length} Treffer anzeigen
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
