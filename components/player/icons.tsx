/** Bộ icon nhỏ vẽ tay bằng SVG — nhẹ hơn kéo cả thư viện icon về. */
type IconProps = { className?: string };

const base = "h-full w-full";

export const PlayIcon = ({ className = base }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.72-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14Z" />
  </svg>
);

export const PauseIcon = ({ className = base }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <rect x="6" y="4.5" width="4" height="15" rx="1.4" />
    <rect x="14" y="4.5" width="4" height="15" rx="1.4" />
  </svg>
);

export const NextIcon = ({ className = base }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <path d="M6 5.6v12.8a.8.8 0 0 0 1.23.67l9.4-6.4a.8.8 0 0 0 0-1.34l-9.4-6.4A.8.8 0 0 0 6 5.6Z" />
    <rect x="17.6" y="5" width="2.6" height="14" rx="1.3" />
  </svg>
);

export const PrevIcon = ({ className = base }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <path d="M18 5.6v12.8a.8.8 0 0 1-1.23.67l-9.4-6.4a.8.8 0 0 1 0-1.34l9.4-6.4A.8.8 0 0 1 18 5.6Z" />
    <rect x="3.8" y="5" width="2.6" height="14" rx="1.3" />
  </svg>
);

export const VolumeIcon = ({
  className = base,
  muted = false,
}: IconProps & { muted?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path
      d="M11 5 6.5 8.5H3.5v7h3L11 19V5Z"
      fill="currentColor"
      stroke="none"
    />
    {muted ? (
      <>
        <path d="m16 9.5 4.5 5" />
        <path d="m20.5 9.5-4.5 5" />
      </>
    ) : (
      <>
        <path d="M14.8 9.2a4 4 0 0 1 0 5.6" />
        <path d="M17.6 6.6a8 8 0 0 1 0 10.8" />
      </>
    )}
  </svg>
);

export const ListIcon = ({ className = base }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    className={className}
    aria-hidden
  >
    <path d="M4 7h11M4 12h11M4 17h7" />
    <circle cx="19" cy="16" r="2.4" fill="currentColor" stroke="none" />
    <path d="M21.4 16V8.6l-4 1" />
  </svg>
);

/** Đĩa than quay khi đang phát — dấu hiệu "có nhạc" thấy được từ xa. */
export const DiscIcon = ({ className = base }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle
      cx="12"
      cy="12"
      r="9.2"
      stroke="currentColor"
      strokeWidth="1.4"
      opacity="0.5"
    />
    <circle
      cx="12"
      cy="12"
      r="5.6"
      stroke="currentColor"
      strokeWidth="1.1"
      opacity="0.35"
    />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path
      d="M12 2.8a9.2 9.2 0 0 1 8.2 5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/** Hai đường chéo nhau kèm đầu mũi tên — dấu hiệu quen thuộc của chế độ xáo bài. */
export const ShuffleIcon = ({ className = base }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M3 6.5h3.4c1 0 2 .5 2.6 1.4l5 7.2c.6.9 1.6 1.4 2.6 1.4H21" />
    <path d="M3 17.5h3.4c1 0 2-.5 2.6-1.4l5-7.2c.6-.9 1.6-1.4 2.6-1.4H21" />
    <path d="m18.2 4.8 2.8 2.7-2.8 2.7" />
    <path d="m18.2 13.8 2.8 2.7-2.8 2.7" />
  </svg>
);
