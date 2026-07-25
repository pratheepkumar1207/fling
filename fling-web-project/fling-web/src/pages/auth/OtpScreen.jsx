import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function OtpScreen() {
  const { state } = useLocation();
  const phone = state?.phone || "";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const { loginWithFirebaseToken } = useAuth();

  function handleChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const confirmation = window.__flingConfirmation;
      if (!confirmation) throw new Error("Session expired — request a new code");
      const result = await confirmation.confirm(code);
      const idToken = await result.user.getIdToken();
      const { isNewUser } = await loginWithFirebaseToken(idToken);
      navigate(isNewUser ? "/home?welcome=1" : "/home", { replace: true });
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "") || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-h-svh flex-col justify-between px-6 pb-10 pt-16">
      <div>
        <button onClick={() => navigate(-1)} className="mb-8 text-text-dim">
          ← Back
        </button>
        <h1 className="mb-2 text-2xl font-bold">Enter the code</h1>
        <p className="mb-8 text-sm text-text-dim">
          We sent a 6-digit code to <span className="text-text">{phone}</span>
        </p>

        <div className="mb-6 flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="h-14 w-12 rounded-xl border border-border bg-surface-2 text-center text-xl font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          ))}
        </div>
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}
        <Button onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying…" : "Verify & continue"}
        </Button>
      </div>

      <button className="text-sm text-text-dim underline underline-offset-2">
        Didn't get a code? Resend
      </button>
    </div>
  );
}
