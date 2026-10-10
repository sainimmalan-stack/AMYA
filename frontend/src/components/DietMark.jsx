// Classic Indian veg / non-veg indicator
export default function DietMark({ diet, className = "" }) {
  if (!diet) return null;
  const isVeg = diet === "veg";
  const color = isVeg ? "#2E7D32" : "#8E2E2E";
  const label = isVeg ? "Vegetarian" : "Non-vegetarian";
  return (
    <span
      data-testid={`diet-${diet}`}
      title={label}
      aria-label={label}
      className={`inline-flex items-center justify-center h-5 w-5 bg-ivory/90 border ${className}`}
      style={{ borderColor: color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}
