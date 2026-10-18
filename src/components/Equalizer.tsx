export function Equalizer({ active = true }: { active?: boolean }) {
  return (
    <span className={`eq ${active ? 'on' : ''}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
