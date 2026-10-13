import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import Btn from "@/components/Btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const strong = (pw) => pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);

export default function AdminSetup() {
  const { admin, setupAdmin } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) { navigate("/admin"); return; }
    api.get("/auth/setup-status")
      .then(({ data }) => {
        if (!data.needs_setup) { navigate("/admin/login"); return; }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [admin, navigate]);

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!name.trim() || !email.trim()) { toast.error("Enter your name and email."); return; }
    if (!strong(password)) { toast.error("Password must be at least 8 characters with a letter and a number."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    try {
      await setupAdmin(name.trim(), email.trim(), password);
      toast.success("Admin account created. Welcome to AMYA.");
      navigate("/admin");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not create the account");
    } finally { setLoading(false); }
  };

  if (checking) return <div className="min-h-screen bg-terracotta grain flex items-center justify-center text-ivory font-sans text-sm">Checking…</div>;

  return (
    <div className="min-h-screen bg-terracotta text-ivory grain flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md bg-ivory text-ink p-8 sm:p-10 relative z-10" data-testid="admin-setup-card">
        <div className="flex justify-center mb-6"><Logo variant="ink" size="md" /></div>
        <div className="flex items-center justify-center gap-2 text-terracotta mb-1"><ShieldCheck size={16} /><span className="font-sans text-xs uppercase tracking-[0.18em]">Secure first-time setup</span></div>
        <h1 className="font-serif text-3xl text-center mt-2">Create your admin account</h1>
        <p className="font-sans text-xs text-ink-soft text-center mt-2">Choose your own email and password. This one-time setup is available only until the first account is created.</p>
        <form onSubmit={submit} className="mt-7 space-y-4" data-testid="admin-setup-form">
          <div>
            <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">Your name</Label>
            <Input data-testid="setup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amulya Nimmala" />
          </div>
          <div>
            <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">Email</Label>
            <Input data-testid="setup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">Password</Label>
            <Input data-testid="setup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className={`font-sans text-[11px] mt-1 ${password && !strong(password) ? "text-terracotta" : "text-ink-soft"}`}>At least 8 characters, including a letter and a number.</p>
          </div>
          <div>
            <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">Confirm password</Label>
            <Input data-testid="setup-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Btn as="button" type="button" onClick={submit} variant="solid" disabled={loading} data-testid="setup-submit" className="w-full">
            {loading ? "Creating…" : "Create admin account"}
          </Btn>
        </form>
      </div>
    </div>
  );
}
