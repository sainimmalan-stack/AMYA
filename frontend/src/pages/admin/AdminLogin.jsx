import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import Logo from "@/components/Logo";
import Btn from "@/components/Btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogin() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) { navigate("/admin"); return; }
    api.get("/auth/setup-status")
      .then(({ data }) => { if (data.needs_setup) navigate("/admin/setup"); })
      .catch(() => {});
  }, [admin, navigate]);

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email || !password) { toast.error("Enter your email and password."); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back.");
      navigate("/admin");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Login failed");
    } finally { setLoading(false); }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(e); };

  return (
    <div className="min-h-screen bg-terracotta text-ivory grain flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-ivory text-ink p-8 sm:p-10 relative z-10">
        <div className="flex justify-center mb-8"><Logo variant="ink" size="md" /></div>
        <h1 className="font-serif text-3xl text-center">Admin sign in</h1>
        <p className="font-sans text-xs text-ink-soft text-center mt-2 uppercase tracking-[0.15em]">Founder dashboard</p>
        <form onSubmit={submit} className="mt-8 space-y-5" data-testid="admin-login-form">
          <div>
            <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">Email</Label>
            <Input data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey} />
          </div>
          <div>
            <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">Password</Label>
            <Input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={onKey} />
          </div>
          <Btn as="button" type="button" onClick={submit} variant="solid" disabled={loading} data-testid="login-submit" className="w-full">
            {loading ? "Signing in…" : "Sign in"}
          </Btn>
        </form>
      </div>
    </div>
  );
}
