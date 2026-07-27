/**
 * Loyalty Web brand mark — a droplet (wash) with a check (loyalty), in a teal
 * squircle. Self-contained (its own background), so it replaces the old
 * icon-in-a-box lockups. Solid fill (no gradient) to stay id-collision-free
 * when several instances render on one page; the favicon/PWA icons keep the
 * gradient. Matches app/icon.svg.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="512" height="512" rx="120" fill="#087F78" />
      <path
        d="M256 108C256 108 150 232 150 322a106 106 0 1 0 212 0C362 232 256 108 256 108Z"
        fill="#ffffff"
      />
      <path
        d="M212 328l30 32 62-74"
        stroke="#087F78"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
