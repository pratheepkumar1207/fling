import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { Button, Input } from "../../components/ui";

export default function KycScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    panNumber: "",
    accountHolderName: "",
    bankAccountNumber: "",
    ifsc: "",
  });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/kyc/status").then(({ data }) => setStatus(data.status)).catch(() => {});
  }, []);

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (Object.values(form).some((v) => !v.trim())) {
      setError("Every field is required");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/kyc/submit", form);
      setStatus(data.status);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't submit — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "verified") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-4xl">✅</span>
        <h1 className="text-xl font-bold">You're verified</h1>
        <p className="text-sm text-text-dim">You can now cash out coins for rupees.</p>
        <Button onClick={() => navigate("/wallet")} className="mt-4 max-w-[220px]">
          Back to wallet
        </Button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-4xl">⏳</span>
        <h1 className="text-xl font-bold">Verification pending</h1>
        <p className="text-sm text-text-dim">
          We're reviewing your details. This usually takes 1–2 business days.
        </p>
        <Button variant="ghost" onClick={() => navigate("/wallet")} className="mt-4 max-w-[220px]">
          Back to wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col px-6 pb-10 pt-8">
      <button onClick={() => navigate(-1)} className="mb-6 self-start text-text-dim">
        ← Back
      </button>
      <h1 className="mb-1 text-2xl font-bold">Verify your identity</h1>
      <p className="mb-6 text-sm text-text-dim">
        Required once, before your first cash-out. Your details are reviewed manually.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="PAN number"
          placeholder="ABCDE1234F"
          value={form.panNumber}
          onChange={(e) => update("panNumber", e.target.value.toUpperCase())}
          maxLength={10}
        />
        <Input
          label="Account holder name"
          placeholder="As per bank records"
          value={form.accountHolderName}
          onChange={(e) => update("accountHolderName", e.target.value)}
        />
        <Input
          label="Bank account number"
          value={form.bankAccountNumber}
          onChange={(e) => update("bankAccountNumber", e.target.value)}
        />
        <Input
          label="IFSC code"
          placeholder="HDFC0001234"
          value={form.ifsc}
          onChange={(e) => update("ifsc", e.target.value.toUpperCase())}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting…" : "Submit for verification"}
        </Button>
      </form>
    </div>
  );
}
