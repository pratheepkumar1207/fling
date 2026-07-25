import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Button, Input } from "../../components/ui";
import BottomNav from "../../components/BottomNav";
import { disconnectSocket } from "../../lib/socket";

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile(name);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex-1 px-5 pb-6 pt-8">
        <h1 className="mb-6 text-xl font-bold">Profile</h1>

        <div className="mb-6 flex items-center gap-3">
          <Avatar name={user?.name} size={56} />
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-text-dim">{user?.phone}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saved ? "Saved ✓" : saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <Button variant="danger" onClick={handleLogout} className="mt-8">
          Log out
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
