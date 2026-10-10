import { Link } from "react-router-dom";

// Uses the original AMYA logo artwork (exact lettering, AMYA + ARTISANAL FOODS together).
// "ink" = terracotta lettering for ivory/light backgrounds; "ivory" = ivory lettering for terracotta backgrounds.
const SRC = {
  ink: "/brand/amya-logo-terracotta.png",
  ivory: "/brand/amya-logo-ivory.png",
};

const HEIGHT = { sm: "h-8", md: "h-11", lg: "h-20", header: "h-11 lg:h-9", menu: "h-12" };

export default function Logo({ variant = "ink", className = "", size = "md" }) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`} data-testid="brand-logo" aria-label="AMYA Artisanal Foods">
      <img
        src={SRC[variant] || SRC.ink}
        alt="AMYA Artisanal Foods"
        className={`${HEIGHT[size] || HEIGHT.md} w-auto object-contain select-none`}
        draggable="false"
      />
    </Link>
  );
}
