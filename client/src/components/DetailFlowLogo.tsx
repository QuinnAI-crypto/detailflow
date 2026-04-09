export function DetailFlowLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="DetailFlow logo"
    >
      <rect width="40" height="40" rx="8" fill="hsl(220, 93%, 60%)" />
      <path
        d="M12 10h8c6.627 0 12 5.373 12 12s-5.373 12-12 12h-8V10z"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="22" r="3.5" fill="white" opacity="0.9" />
      <path
        d="M20 18.5c0-2.5 2-4.5 4.5-4.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
