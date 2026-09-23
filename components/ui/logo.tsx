interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { width: 120, height: 40, fontSize: 12 },
  md: { width: 180, height: 60, fontSize: 16 },
  lg: { width: 240, height: 80, fontSize: 20 },
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  const dimensions = SIZES[size];

  return (
    <svg
      viewBox="0 0 240 80"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon circle */}
      <circle cx="30" cy="40" r="20" fill="none" stroke="#3B82F6" strokeWidth="2" />

      {/* Icon - stylized chart/find symbol */}
      <path
        d="M 20 45 L 25 38 L 30 42 L 35 35 L 40 40"
        stroke="#3B82F6"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Magnifying glass indicator */}
      <circle cx="38" cy="32" r="3" fill="#10B981" />

      {/* Brand text - useFindash */}
      <text
        x="55"
        y="48"
        fontSize={dimensions.fontSize}
        fontWeight="700"
        fill="#F8F8F8"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5"
      >
        useFindash
      </text>

      {/* Tagline */}
      <text
        x="55"
        y="60"
        fontSize={dimensions.fontSize * 0.6}
        fontWeight="400"
        fill="#9CA3AF"
        fontFamily="system-ui, -apple-system, sans-serif"
        opacity="0.8"
      >
        Gestão Inteligente
      </text>
    </svg>
  );
}
