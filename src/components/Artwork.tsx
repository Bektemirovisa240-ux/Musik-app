import { MusicIcon } from './Icons';

export function Artwork({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  return src ? (
    <img className={`artwork ${className}`} src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" />
  ) : (
    <div className={`artwork artwork-empty ${className}`} aria-label={alt}>
      <MusicIcon size={22} />
    </div>
  );
}
