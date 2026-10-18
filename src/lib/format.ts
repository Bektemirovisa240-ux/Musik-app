export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** ISO 8601 duration (PT3M25S) → milliseconds. */
export function parseIsoDuration(iso: string | undefined): number | undefined {
  const m = iso?.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  const [, d, h, min, s] = m.map((x) => Number(x) || 0);
  return (((d * 24 + h) * 60 + min) * 60 + s) * 1000;
}

export function decodeHtml(text: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
