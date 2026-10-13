import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import Logo from "@/components/Logo";
import Btn from "@/components/Btn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminForgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim()) { toast.error("Enter your admin email."); return; }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-terracotta text-ivory grain flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md bg-ivory text-ink p-8 sm:p-10 relative z-10" data-testid="admin-forgot-card">
        <div className="flex justify-center mb-6"><Logo variant="ink" size="md" /></div>
        {sent ? (
          <div className="text-center">
            <MailCheck className="mx-auto text-terracotta" size={40} />
            <h1 className="font-serif text-2xl mt-3">Check your inbox</h1>
            <p className="font-sans text-sm text-ink-soft mt-2">If an admin account exists for that email, we've sent a password reset link. It expires in 1 hour.</p>
            <Link to="/admin/login" className="inline-block mt-6 font-sans text-xs uppercase tracking-[0.15em] text-terracotta hover:underline" data-testid="back-to-login">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-3xl text-center">Reset your password</h1>
            <p className="font-sans text-xs text-ink-soft text-center mt-2">Enter your admin email and we'll send you a secure reset link.</p>
            <form onSubmit={submit} className="mt-7 space-y-5" data-testid="admin-forgot-form">
              <div>
                <Label className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft mb-2 block">Admin email</Label>
                <Input data-testid="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Btn as="button" type="button" onClick={submit} variant="solid" disabled={loading} data-testid="forgot-submit" className="w-full">
                {loading ? "Sending…" : "Send reset link"}
              </Btn>
            </form>
            <div className="text-center mt-6">
              <Link to="/admin/login" className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft hover:text-terracotta">Back to sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
