interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { fontSize: 14, lineHeight: 1.2 },
  md: { fontSize: 18, lineHeight: 1.2 },
  lg: { fontSize: 24, lineHeight: 1.2 },
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  const dims = SIZES[size];

  return (
    <div className={className} style={{ lineHeight: dims.lineHeight }}>
      <span style={{ fontSize: dims.fontSize, fontWeight: 300, color: "#9CA3AF" }}>
        use
      </span>
      <span style={{ fontSize: dims.fontSize, fontWeight: 700, color: "#F8F8F8" }}>
        Findash
      </span>
    </div>
  );
}
