export const Logo = ({ className = "w-30 h-auto" }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 100"
      className={className}
      aria-label="PairDev Logo"
    >
      <defs>
        <linearGradient id="techGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="1" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* ICON: The Interlocking Brackets */}
      <g transform="translate(55, 24) scale(0.5)">
        <path
          d="M20 10 L60 50 L20 90"
          fill="none"
          stroke="url(#techGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M70 10 L30 50 L70 90"
          fill="none"
          stroke="currentColor" // Uses text color (works in dark mode)
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </g>

      {/* TEXT: PairDev */}
      <text
        x="110"
        y="62"
        fontSize="36"
        fill="currentColor" // Uses text color (works in dark mode)
      >
        <tspan fontWeight="700">Pair</tspan>
        <tspan fontWeight="700">Dev</tspan>
      </text>
    </svg>
  );
};

export const LogoIcon = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      aria-label="PairDev Icon"
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="1" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* ICON: The Interlocking Brackets */}
      <g transform="translate(5, 5) scale(1)">
        <path
          d="M20 10 L60 50 L20 90"
          fill="none"
          stroke="url(#iconGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M70 10 L30 50 L70 90"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </g>
    </svg>
  );
};