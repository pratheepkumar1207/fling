import { NavLink } from "react-router-dom";

const items = [
  { to: "/home", label: "Home", icon: "🏠" },
  { to: "/wallet", label: "Wallet", icon: "💰" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-20 flex border-t border-border bg-surface/95 backdrop-blur">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
              isActive ? "text-primary" : "text-text-faint"
            }`
          }
        >
          <span className="text-lg leading-none">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
