import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import Logo from "@/components/Logo";
import Btn from "@/components/Btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const strong = (pw) => pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);

export default function AdminResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!token) { toast.error("This reset link is missing its token."); return; }
    if (!strong(password)) { toast.error("Password must be at least 8 characters with a letter and a number."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      toast.success("Password reset. Please sign in.");
      navigate("/admin/login");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not reset password");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-terracotta text-ivory grain flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md bg-ivory text-ink p-8 sm:p-10 relative z-10" data-testid="admin-reset-card">
        <div className="flex justify-center mb-6"><Logo variant="ink" size="md" /></div>
        <h1 className="font-serif text-3xl text-center">Choose a new password</h1>
        {!token ? (
          <p className="font-sans text-sm text-terracotta text-center mt-4">This reset link is invalid. Please request a new one from the sign-in page.</p>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5" data-testid="admin-reset-form">
            <div>
              <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">New password</Label>
              <Input data-testid="reset-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className={`font-sans text-[11px] mt-1 ${password && !strong(password) ? "text-terracotta" : "text-ink-soft"}`}>At least 8 characters, including a letter and a number.</p>
            </div>
            <div>
              <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">Confirm new password</Label>
              <Input data-testid="reset-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Btn as="button" type="button" onClick={submit} variant="solid" disabled={loading} data-testid="reset-submit" className="w-full">
              {loading ? "Saving…" : "Reset password"}
            </Btn>
          </form>
        )}
        <div className="text-center mt-6">
          <Link to="/admin/login" className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft hover:text-terracotta">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
