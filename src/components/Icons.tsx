import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function make(path: React.ReactNode, filled = false) {
  return ({ size = 20, ...props }: P) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {path}
    </svg>
  );
}

export const PlayIcon = make(<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" />, true);
export const PauseIcon = make(<><rect x="6" y="4" width="4.5" height="16" rx="1.5" /><rect x="13.5" y="4" width="4.5" height="16" rx="1.5" /></>, true);
export const NextIcon = make(<><path d="M5 5.5v13a1 1 0 0 0 1.6.8l8.5-6.5a1 1 0 0 0 0-1.6L6.6 4.7A1 1 0 0 0 5 5.5Z" /><rect x="17" y="4.5" width="2.5" height="15" rx="1.2" /></>, true);
export const PrevIcon = make(<><path d="M19 5.5v13a1 1 0 0 1-1.6.8l-8.5-6.5a1 1 0 0 1 0-1.6l8.5-6.5A1 1 0 0 1 19 5.5Z" /><rect x="4.5" y="4.5" width="2.5" height="15" rx="1.2" /></>, true);
export const HomeIcon = make(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9v11h5v-6h4v6h5V9" /></>);
export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const LibraryIcon = make(<><path d="M4 4v16M9 4v16" /><path d="m14 4.5 5.5 15" /></>);
export const LinkIcon = make(<><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>);
export const HeartIcon = make(<path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.6 4 7.2 4c2 0 3.5 1.1 4.8 2.8C13.3 5.1 14.8 4 16.8 4c3.6 0 5.7 3.6 4.5 6.8C19.5 15.4 12 20 12 20Z" />);
export const HeartFilledIcon = make(<path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.6 4 7.2 4c2 0 3.5 1.1 4.8 2.8C13.3 5.1 14.8 4 16.8 4c3.6 0 5.7 3.6 4.5 6.8C19.5 15.4 12 20 12 20Z" />, true);
export const VolumeIcon = make(<><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></>);
export const MuteIcon = make(<><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="m17 9 5 6M22 9l-5 6" /></>);
export const QueueIcon = make(<><path d="M3 6h13M3 12h13M3 18h8" /><path d="M17 15v6l4-3z" /></>);
export const ShuffleIcon = make(<><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></>);
export const RepeatIcon = make(<><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></>);
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);
export const CloseIcon = make(<path d="M6 6l12 12M18 6 6 18" />);
export const ChevronDownIcon = make(<path d="m6 9 6 6 6-6" />);
export const ExternalIcon = make(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>);
export const CheckIcon = make(<path d="m5 12 5 5 9-10" />);
export const MusicIcon = make(<><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>);
export const CopyIcon = make(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>);
