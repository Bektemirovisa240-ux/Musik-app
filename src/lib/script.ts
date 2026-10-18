const cache = new Map<string, Promise<void>>();

export function loadScript(src: string): Promise<void> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        cache.delete(src);
        reject(new Error(`Skript konnte nicht geladen werden: ${new URL(src).host}`));
      };
      document.head.appendChild(s);
    });
    cache.set(src, p);
  }
  return p;
}

let jsonpSeq = 0;

/** JSONP request – used for APIs without CORS support (Deezer). */
export function jsonp<T>(url: string, timeoutMs = 10000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const cb = `__pulse_jsonp_${Date.now()}_${jsonpSeq++}`;
    const s = document.createElement('script');
    const w = window as unknown as Record<string, unknown>;
    const cleanup = () => {
      clearTimeout(timer);
      delete w[cb];
      s.remove();
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Zeitüberschreitung bei der Anfrage'));
    }, timeoutMs);
    w[cb] = (data: T) => {
      cleanup();
      resolve(data);
    };
    s.onerror = () => {
      cleanup();
      reject(new Error('Netzwerkfehler'));
    };
    s.src = `${url}${url.includes('?') ? '&' : '?'}output=jsonp&callback=${cb}`;
    document.head.appendChild(s);
  });
}
