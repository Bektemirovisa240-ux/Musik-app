/**
 * Dark animated backdrop. Colors are derived from the global --hue custom
 * property, which slowly cycles through the whole color wheel (see styles.css).
 */
export function LedBackground() {
  return (
    <div className="led-bg" aria-hidden="true">
      <div className="led-blob b1" />
      <div className="led-blob b2" />
      <div className="led-blob b3" />
      <div className="led-blob b4" />
      <div className="led-grid" />
      <div className="led-noise" />
    </div>
  );
}
