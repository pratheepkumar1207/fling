import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function SplashScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      navigate(user ? "/home" : "/login", { replace: true });
    }, 900);
    return () => clearTimeout(t);
  }, [user, navigate]);

  return (
    <div className="flex h-full min-h-svh flex-col items-center justify-center gap-4 bg-bg">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-plum shadow-[0_20px_50px_-15px_rgba(255,86,115,0.6)]">
        <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
          <path d="M20 44 L32 16 L44 44 L32 36 Z" fill="white" />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Fling</h1>
      <p className="text-sm text-text-dim">Watch together. Feel together.</p>
    </div>
  );
}
