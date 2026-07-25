import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui";
import { startPhoneSignIn, firebaseConfigured } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

// Numbers allowed to skip real OTP verification — must also be listed in the
// backend's DEV_LOGIN_PHONES env var, which is the actual enforcement point.
// This client-side list only decides which UX path to try first.
const TEST_PHONES = ["8220785431"];

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithDevPhone } = useAuth();

  const digits = phone.replace(/\D/g, "");
  const valid = digits.length === 10;

  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    if (!valid) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    const e164 = `+91${digits}`;

    if (TEST_PHONES.includes(digits)) {
      setLoading(true);
      try {
        const { isNewUser } = await loginWithDevPhone(e164);
        navigate(isNewUser ? "/home?welcome=1" : "/home", { replace: true });
        return;
      } catch (err) {
        setError(
          err.response?.data?.error ||
            "Dev login isn't enabled on the backend — set ALLOW_DEV_LOGIN=true and DEV_LOGIN_PHONES."
        );
        setLoading(false);
        return;
      }
    }

    if (!firebaseConfigured) {
      setError(
        "Firebase isn't configured yet — add your Firebase web config to .env to enable real OTP sign-in."
      );
      return;
    }

    setLoading(true);
    try {
      const confirmationResult = await startPhoneSignIn(e164);
      window.__flingConfirmation = confirmationResult;
      navigate("/otp", { state: { phone: e164 } });
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Could not send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-svh flex-col justify-between px-6 pb-10 pt-16">
      <div>
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-plum">
          <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
            <path d="M20 44 L32 16 L44 44 L32 36 Z" fill="white" />
          </svg>
        </div>
        <h1 className="mb-2 text-3xl font-bold">Welcome to Fling</h1>
        <p className="mb-8 text-sm text-text-dim">
          Sync a video, jump on a call, and hang out with your people — enter your number to get started.
        </p>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="flex overflow-hidden rounded-xl border border-border bg-surface-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <span className="flex items-center border-r border-border px-4 text-[15px] text-text-dim">
              🇮🇳 +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-text-faint"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          {TEST_PHONES.includes(digits) && !error && (
            <p className="text-xs text-gold">Test number — this will skip OTP verification.</p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Send OTP"}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-text-faint">
        By continuing you agree to Fling's Terms & Privacy Policy.
      </p>

      {/* Required, invisible container for Firebase's reCAPTCHA */}
      <div id="recaptcha-container" />
    </div>
  );
}
