import { useEffect, useState } from 'react';
import { CheckIcon, ChevronDownIcon, CopyIcon } from '../components/Icons';
import { getConfig, redirectUri, setConfig } from '../lib/config';
import { errorMessage } from '../lib/format';
import { useStore } from '../lib/store';
import { providers, unsupported } from '../providers';
import type { Provider } from '../providers/types';
import { preloadGoogle } from '../providers/youtube';
import { connections, refreshConnections } from '../state/connections';
import { toast } from '../state/toasts';

function PlatformCard({ p }: { p: Provider }) {
  const status = useStore(connections, (s) => s[p.id]);
  const [busy, setBusy] = useState(false);
  const [setupOpen, setSetupOpen] = useState(p.requiresLogin && !p.isConfigured());
  const [values, setValues] = useState(() => Object.fromEntries(p.configFields.map((f) => [f.key, getConfig(f.key)])));
  const [copied, setCopied] = useState(false);

  const connect = async () => {
    for (const f of p.configFields) setConfig(f.key, values[f.key] ?? '');
    setBusy(true);
    try {
      await p.connect();
      await refreshConnections();
      if (p.isConnected()) toast(`${p.name} verbunden 🎉`, 'success');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    p.disconnect();
    await refreshConnections();
    toast(`${p.name} getrennt`);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(redirectUri());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const connected = status?.connected;

  return (
    <article className={`platform-card glass ${connected ? 'connected' : ''}`} style={{ '--pc': p.color } as React.CSSProperties}>
      <header>
        <span className="pc-logo">{p.name[0]}</span>
        <div>
          <h3>{p.name}</h3>
          <p className="muted small">{p.tagline}</p>
        </div>
        <span className={`pc-status ${connected ? 'on' : ''}`}>{connected ? (p.requiresLogin ? 'Verbunden' : 'Aktiv') : 'Nicht verbunden'}</span>
      </header>

      {connected && status.profile && (
        <div className="pc-account">
          {status.profile.avatar ? <img src={status.profile.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="avatar-fallback">{status.profile.name[0]}</span>}
          <div>
            <strong>{status.profile.name}</strong>
            {status.profile.email && <span className="muted small">{status.profile.email}</span>}
          </div>
        </div>
      )}

      <p className="pc-note small">{p.playbackNote}</p>

      {p.requiresLogin && (
        <div className="pc-actions">
          {connected ? (
            <button className="ghost-btn" onClick={disconnect}>Trennen</button>
          ) : (
            <button className="primary-btn" onClick={connect} disabled={busy}>
              {busy ? 'Verbinde …' : `Mit ${p.name} anmelden`}
            </button>
          )}
          <button className="link-btn" onClick={() => setSetupOpen(!setupOpen)}>
            Einrichtung <ChevronDownIcon size={14} style={{ transform: setupOpen ? 'rotate(180deg)' : undefined }} />
          </button>
        </div>
      )}

      {(setupOpen || !p.requiresLogin) && (
        <div className="pc-setup">
          <ol>
            {p.setupSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          {p.requiresLogin && (
            <>
              <label className="field">
                <span>Redirect-URI / Quelle</span>
                <span className="copy-field">
                  <code>{redirectUri()}</code>
                  <button className="icon-btn" onClick={copy} aria-label="Kopieren">
                    {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                  </button>
                </span>
              </label>
              {p.configFields.map((f) => (
                <label key={f.key} className="field">
                  <span>{f.label}</span>
                  <input
                    type={f.secret ? 'password' : 'text'}
                    value={values[f.key] ?? ''}
                    placeholder={f.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    onBlur={() => {
                      setConfig(f.key, values[f.key] ?? '');
                      void refreshConnections();
                    }}
                  />
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </article>
  );
}

export function Connect() {
  useEffect(() => {
    preloadGoogle(); // keeps the Google popup inside the click gesture
    void refreshConnections();
  }, []);

  return (
    <div className="view connect">
      <h1>Verbindungen</h1>
      <p className="muted lead">
        Melde dich mit deinen echten Konten an. Die Anmeldung läuft immer direkt über die offizielle Login-Seite der
        jeweiligen Plattform (OAuth) – Pulse sieht dein Passwort nie. Alle Zugangsdaten bleiben nur in diesem Browser.
      </p>
      <div className="platform-grid">
        {providers.map((p) => (
          <PlatformCard key={p.id} p={p} />
        ))}
      </div>
      <h2>Nicht möglich</h2>
      <div className="unsupported">
        {unsupported.map((u) => (
          <div key={u.name} className="glass unsupported-item">
            <strong>{u.name}</strong>
            <span className="muted small">{u.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
