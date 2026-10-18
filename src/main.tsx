import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { errorMessage } from './lib/format';
import { restoreApple } from './providers/apple';
import { handleSpotifyRedirect, spotify } from './providers/spotify';
import { refreshConnections } from './state/connections';
import { toast } from './state/toasts';
import { go } from './state/ui';
import './styles.css';

async function boot() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('state')) {
    window.history.replaceState(null, '', window.location.pathname);
    try {
      if (await handleSpotifyRedirect(params)) toast(`${spotify.name} verbunden 🎉`, 'success');
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
    go('connect');
  }
  restoreApple();
  void refreshConnections();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
void boot();
