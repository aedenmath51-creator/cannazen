type LotusLogoProps = {
  className?: string;
  size?: number;
};

export function LotusLogo({ className, size = 64 }: LotusLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M50 88 C 36 88 24 80 18 68 C 30 64 42 70 50 88 Z"
        fill="currentColor"
        opacity="0.45"
      />
      <path
        d="M50 88 C 64 88 76 80 82 68 C 70 64 58 70 50 88 Z"
        fill="currentColor"
        opacity="0.45"
      />
      <path
        d="M50 88 C 32 84 18 70 14 50 C 28 48 42 60 50 88 Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M50 88 C 68 84 82 70 86 50 C 72 48 58 60 50 88 Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M50 88 C 36 78 26 58 28 36 C 40 40 48 58 50 88 Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M50 88 C 64 78 74 58 72 36 C 60 40 52 58 50 88 Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M50 88 C 42 76 38 58 42 38 C 48 46 50 64 50 88 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M50 88 C 58 76 62 58 58 38 C 52 46 50 64 50 88 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M50 88 C 47 70 47 44 50 22 C 53 44 53 70 50 88 Z"
        fill="currentColor"
        opacity="1"
      />
      <ellipse cx="50" cy="86" rx="6" ry="2.5" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
