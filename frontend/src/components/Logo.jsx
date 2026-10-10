import { Link } from "react-router-dom";

export default function Logo({ variant = "ink", className = "", size = "md" }) {
  // variant: "ink" (deep terracotta text for ivory bg) | "ivory" (for terracotta bg)
  const color = variant === "ivory" ? "#FFF5E8" : "#8E3A2E";
  const sub = variant === "ivory" ? "rgba(255,245,232,0.8)" : "rgba(142,58,46,0.7)";
  const sizes = {
    sm: { a: "text-2xl", s: "text-[8px]" },
    md: { a: "text-3xl", s: "text-[9px]" },
    lg: { a: "text-6xl sm:text-7xl", s: "text-xs" },
  }[size];
  return (
    <Link to="/" className={`inline-flex flex-col items-center leading-none ${className}`} data-testid="brand-logo">
      <span className="font-serif font-semibold tracking-[0.18em]" style={{ color }}>
        <span className={sizes.a}>AMYA</span>
      </span>
      <span
        className={`font-sans uppercase ${sizes.s} mt-1`}
        style={{ color: sub, letterSpacing: "0.42em", paddingLeft: "0.42em" }}
      >
        Artisanal Foods
      </span>
    </Link>
  );
}
