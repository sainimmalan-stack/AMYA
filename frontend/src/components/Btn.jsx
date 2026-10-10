import { Link } from "react-router-dom";

const base = "inline-flex items-center justify-center gap-2 font-sans text-xs uppercase tracking-[0.2em] px-8 py-4 transition-all duration-300 rounded-full";

const variants = {
  solid: "bg-terracotta text-ivory hover:bg-terracotta-deep",
  solidIvory: "bg-ivory text-terracotta hover:bg-ivory-warm",
  outline: "border border-ink/25 text-ink hover:bg-ink hover:text-ivory",
  outlineIvory: "border border-ivory/50 text-ivory hover:bg-ivory hover:text-terracotta",
};

export default function Btn({ as = "link", to, href, variant = "solid", className = "", children, ...props }) {
  const cls = `${base} ${variants[variant]} ${className}`;
  if (as === "a") return <a href={href} className={cls} {...props}>{children}</a>;
  if (as === "button") return <button className={cls} {...props}>{children}</button>;
  return <Link to={to} className={cls} {...props}>{children}</Link>;
}
