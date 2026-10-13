export default function Availability({ status, className = "" }) {
  const map = {
    "ready": { label: "Available to Order", cls: "bg-terracotta text-ivory" },
    "order": { label: "Available to Order", cls: "bg-terracotta text-ivory" },
    "available": { label: "Available to Order", cls: "bg-terracotta text-ivory" },
    "in-stock": { label: "Available to Order", cls: "bg-terracotta text-ivory" },
    "out-of-stock": { label: "Out of Stock", cls: "border border-ink/25 text-ink-soft bg-ink/5" },
    "enquire": { label: "Signature Spice", cls: "bg-gold text-ivory" },
    "coming-soon": { label: "Coming Soon", cls: "border border-terracotta/40 text-terracotta-deep bg-transparent" },
    "unavailable": { label: "Temporarily Unavailable", cls: "border border-ink/20 text-ink-soft bg-ink/5" },
  };
  const m = map[status] || map["coming-soon"];
  return (
    <span
      data-testid={`availability-${status}`}
      className={`inline-block px-2.5 py-1 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.14em] sm:tracking-[0.2em] rounded-sm ${m.cls} ${className}`}
    >
      {m.label}
    </span>
  );
}
