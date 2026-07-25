export function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "w-full rounded-2xl py-3.5 font-semibold text-[15px] transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
  const variants = {
    primary: "bg-primary text-white shadow-[0_8px_24px_-8px_rgba(255,86,115,0.6)] hover:bg-primary-dim",
    ghost: "bg-surface-2 text-text border border-border hover:bg-surface-3",
    gold: "bg-gold text-[#3a2a00] shadow-[0_8px_24px_-8px_rgba(255,201,77,0.5)]",
    danger: "bg-transparent border border-danger text-danger",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, className = "", ...props }) {
  return (
    <label className="block text-left">
      {label && <span className="mb-1.5 block text-xs font-medium text-text-dim">{label}</span>}
      <input
        className={`w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-[15px] text-text placeholder:text-text-faint outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      />
    </label>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Avatar({ name, size = 40, ring = false }) {
  const initials = (name || "?").trim().slice(0, 2).toUpperCase();
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white ${ring ? "live-pulse ring-2 ring-primary" : ""}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: "linear-gradient(135deg, #FF5673, #2D1B4E)",
      }}
    >
      {initials}
    </div>
  );
}

export function CoinBadge({ amount, size = "sm" }) {
  const sizes = { sm: "text-xs px-2.5 py-1", md: "text-sm px-3 py-1.5" };
  return (
    <span
      className={`mono inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 font-semibold text-gold ${sizes[size]}`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
        <text x="6" y="8.5" fontSize="7" textAnchor="middle" fill="currentColor">₹</text>
      </svg>
      {Math.round(amount).toLocaleString("en-IN")}
    </span>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-2 text-2xl">
        🎬
      </div>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {hint && <p className="max-w-[240px] text-sm text-text-dim">{hint}</p>}
      {action}
    </div>
  );
}

export function Spinner({ size = 20 }) {
  return (
    <svg
      className="animate-spin text-current"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
