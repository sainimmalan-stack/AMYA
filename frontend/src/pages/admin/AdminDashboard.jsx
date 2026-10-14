import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, LogOut, Check, X, Copy, RefreshCw, Ban, MessageCircle, Link2 } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useConfig } from "@/context/ConfigContext";
import { countryByCode } from "@/lib/intl";
import { COUNTRIES } from "@/lib/intl";
import Logo from "@/components/Logo";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import AdminOrders from "@/pages/admin/AdminOrders";

const EMPTY = {
  name: "", category: "oils", slug: "", short_description: "", description: "", extraction_method: "",
  ingredients: "", allergens: "", storage: "", delivery_info: "", returns_info: "", food_label_info: "",
  batch_info: "", images: [], pack_sizes: [], availability: "coming-soon", live_press: false, featured: false, sort_order: 0,
};

function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="font-serif text-2xl">{children}</h2>
      {action}
    </div>
  );
}

const btn = "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-sans uppercase tracking-[0.1em] transition-colors";

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const { refresh } = useConfig();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [editing, setEditing] = useState(null);

  const loadAll = useCallback(async () => {
    const [p, b, e, ba, cfg, o] = await Promise.all([
      api.get("/products"), api.get("/admin/bookings"), api.get("/admin/enquiries"),
      api.get("/batches"), api.get("/config"), api.get("/admin/orders"),
    ]);
    setProducts(p.data); setBookings(b.data); setEnquiries(e.data); setBatches(ba.data);
    setSettings(cfg.data.settings); setOrders(o.data);
  }, []);

  useEffect(() => {
    if (admin === false) { navigate("/admin/login"); return; }
    if (admin) loadAll().catch(() => toast.error("Failed to load data"));
  }, [admin, navigate, loadAll]);

  if (!admin) return <div className="py-40 text-center font-sans text-ink-soft">Loading…</div>;

  const doLogout = async () => { await logout(); navigate("/admin/login"); };

  // ---- product actions ----
  const saveProduct = async (data) => {
    try {
      if (data.id) await api.put(`/admin/products/${data.id}`, data);
      else await api.post("/admin/products", data);
      toast.success("Product saved");
      setEditing(null);
      loadAll();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };
  const setAvailability = async (id, status) => {
    await api.patch(`/admin/products/${id}/availability`, { status });
    loadAll();
  };
  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await api.delete(`/admin/products/${id}`); toast.success("Deleted"); loadAll();
  };
  const bookingStatus = async (id, status) => { await api.patch(`/admin/bookings/${id}`, { status }); loadAll(); };
  const enquiryStatus = async (id, status) => { await api.patch(`/admin/enquiries/${id}`, { status }); loadAll(); };
  const saveSettings = async () => {
    try { await api.put("/admin/settings", settings); toast.success("Settings saved"); refresh(); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;
  const newOrders = orders.filter((o) => o.order_status === "placed").length;

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-ink/10 bg-ivory sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4"><Logo variant="ink" size="sm" /><span className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft hidden sm:inline">Dashboard</span></div>
          <div className="flex items-center gap-4">
            <span className="font-sans text-sm text-ink-soft hidden sm:inline">{admin.name}</span>
            <button onClick={doLogout} data-testid="admin-logout" className={`${btn} border border-ink/20 hover:bg-ink hover:text-ivory rounded-full`}><LogOut size={14} /> Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        <Tabs defaultValue="products">
          <TabsList className="flex flex-wrap h-auto bg-ivory-warm">
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Bookings {pendingBookings > 0 && <Badge className="ml-2 bg-terracotta">{pendingBookings}</Badge>}</TabsTrigger>
            <TabsTrigger value="enquiries" data-testid="tab-enquiries">Enquiries {newEnquiries > 0 && <Badge className="ml-2 bg-terracotta">{newEnquiries}</Badge>}</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Orders {newOrders > 0 && <Badge className="ml-2 bg-terracotta">{newOrders}</Badge>}</TabsTrigger>
            <TabsTrigger value="payment-links" data-testid="tab-payment-links">Payment Links</TabsTrigger>
            <TabsTrigger value="batches" data-testid="tab-batches">Batches</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          {/* PRODUCTS */}
          <TabsContent value="products" className="mt-8">
            <SectionTitle action={
              <button onClick={() => setEditing({ ...EMPTY })} data-testid="add-product-btn" className={`${btn} bg-terracotta text-ivory hover:bg-terracotta-deep rounded-full`}><Plus size={14} /> Add product</button>
            }>Products</SectionTitle>
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} data-testid={`admin-product-${p.slug}`} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white border border-ink/10 p-4">
                  <div className="h-16 w-16 bg-ivory-warm overflow-hidden shrink-0">{p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg">{p.name}</p>
                    <p className="font-sans text-xs text-ink-soft uppercase tracking-[0.1em]">{p.category} {p.live_press && "· live press"} {p.featured && "· featured"}</p>
                  </div>
                  <select value={p.availability} onChange={(e) => setAvailability(p.id, e.target.value)} data-testid={`avail-${p.slug}`}
                          className="h-9 px-2 border border-input bg-ivory font-sans text-xs">
                    <option value="in-stock">Available to Order</option>
                    <option value="available">Available to Order</option>
                    <option value="out-of-stock">Out of Stock</option>
                    <option value="coming-soon">Coming Soon</option>
                    <option value="unavailable">Temporarily Unavailable</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing({ ...EMPTY, ...p })} data-testid={`edit-${p.slug}`} className={`${btn} border border-ink/20 hover:bg-ink hover:text-ivory`}><Pencil size={13} /></button>
                    <button onClick={() => deleteProduct(p.id)} data-testid={`delete-${p.slug}`} className={`${btn} border border-ink/20 hover:bg-terracotta hover:text-ivory`}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* BOOKINGS */}
          <TabsContent value="bookings" className="mt-8">
            <SectionTitle>Live Press booking requests</SectionTitle>
            {bookings.length === 0 ? <p className="font-sans text-ink-soft">No bookings yet.</p> : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} data-testid={`booking-${b.id}`} className="bg-white border border-ink/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-serif text-lg">{b.name} · {b.product_name}</p>
                      <StatusPill status={b.status} />
                    </div>
                    <p className="font-sans text-sm text-ink-soft mt-1">Qty {b.quantity} · {b.preferred_date} {b.preferred_time} · {b.mobile}{b.whatsapp ? ` / wa ${b.whatsapp}` : ""}{b.postcode ? ` · ${b.postcode}` : ""}</p>
                    {b.wants_recording && <p className="font-sans text-xs text-terracotta mt-1">Requested recording if unable to attend.</p>}
                    {b.instructions && <p className="font-sans text-sm text-ink-soft mt-1">“{b.instructions}”</p>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => bookingStatus(b.id, "confirmed")} data-testid={`confirm-${b.id}`} className={`${btn} bg-terracotta text-ivory rounded-full`}><Check size={13} /> Confirm</button>
                      <button onClick={() => bookingStatus(b.id, "rejected")} data-testid={`reject-${b.id}`} className={`${btn} border border-ink/20 rounded-full`}><X size={13} /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ENQUIRIES */}
          <TabsContent value="enquiries" className="mt-8">
            <SectionTitle>Enquiries</SectionTitle>
            {enquiries.length === 0 ? <p className="font-sans text-ink-soft">No enquiries yet.</p> : (
              <div className="space-y-3">
                {enquiries.map((e) => (
                  <div key={e.id} data-testid={`enquiry-${e.id}`} className="bg-white border border-ink/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-serif text-lg">{e.name} <span className="font-sans text-xs uppercase tracking-[0.1em] text-terracotta ml-2">{e.type}</span></p>
                      <StatusPill status={e.status} />
                    </div>
                    <p className="font-sans text-sm text-ink-soft mt-1">{[e.phone, e.email, e.country, e.postcode].filter(Boolean).join(" · ")}</p>
                    <p className="font-sans text-sm text-ink mt-2">{e.message}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => enquiryStatus(e.id, "in-progress")} className={`${btn} border border-ink/20 rounded-full`}>In progress</button>
                      <button onClick={() => enquiryStatus(e.id, "closed")} className={`${btn} border border-ink/20 rounded-full`}>Close</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* BATCHES */}
          <TabsContent value="batches" className="mt-8">
            <BatchManager batches={batches} reload={loadAll} />
          </TabsContent>

          <TabsContent value="orders" className="mt-8">
            <AdminOrders orders={orders} reload={loadAll} />
          </TabsContent>

          <TabsContent value="payment-links" className="mt-8">
            <PaymentLinks />
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings" className="mt-8">
            {settings && <SettingsPanel settings={settings} setSettings={setSettings} onSave={saveSettings} />}
          </TabsContent>
        </Tabs>
      </div>

      {editing && <ProductDialog product={editing} onClose={() => setEditing(null)} onSave={saveProduct} />}
    </div>
  );
}

function StatusPill({ status }) {
  const map = { pending: "bg-ink/10 text-ink", confirmed: "bg-terracotta text-ivory", rejected: "bg-ink/20 text-ink", new: "bg-terracotta text-ivory", "in-progress": "bg-ink/10 text-ink", closed: "bg-ink/20 text-ink" };
  return <span className={`px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${map[status] || "bg-ink/10"}`}>{status}</span>;
}

function LinkStatusPill({ status }) {
  const map = { created: "bg-amber-100 text-amber-800", paid: "bg-terracotta text-ivory", cancelled: "bg-ink/15 text-ink", expired: "bg-ink/15 text-ink" };
  return <span className={`px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] rounded-full ${map[status] || "bg-ink/10 text-ink"}`} data-testid="pl-status">{status}</span>;
}

function PaymentLinks() {
  const EMPTY_F = { customer_name: "", customer_mobile: "", customer_email: "", delivery_address: "", country: "IN", subtotal: "", shipping: "", note: "", expiry_days: 7 };
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [f, setF] = useState(EMPTY_F);
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const load = useCallback(async () => {
    try { const { data } = await api.get("/admin/payment-links"); setLinks(data); }
    catch { toast.error("Failed to load payment links"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const total = (Number(f.subtotal) || 0) + (Number(f.shipping) || 0);

  const create = async () => {
    if (!f.customer_name.trim() || !f.customer_mobile.trim()) { toast.error("Customer name and mobile are required."); return; }
    if (total <= 0) { toast.error("Enter a subtotal and/or shipping so the total is greater than zero."); return; }
    setBusy("create");
    try {
      const { data } = await api.post("/admin/payment-links", {
        customer_name: f.customer_name.trim(), customer_mobile: f.customer_mobile.trim(),
        customer_email: f.customer_email.trim() || undefined, delivery_address: f.delivery_address.trim() || undefined,
        country: f.country, subtotal: Number(f.subtotal) || 0, shipping: Number(f.shipping) || 0,
        note: f.note.trim() || undefined, expiry_days: Number(f.expiry_days) || 7,
      });
      toast.success("Payment link created — SMS/email sent if contact provided");
      setF(EMPTY_F);
      setLinks((prev) => [data, ...prev]);
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail) || "Could not create link"); }
    finally { setBusy(""); }
  };

  const refresh = async (id) => {
    setBusy(id);
    try { const { data } = await api.post(`/admin/payment-links/${id}/refresh`); setLinks((p) => p.map((l) => l.link_id === id ? data : l)); toast.success(`Status: ${data.status}`); }
    catch (e) { toast.error(formatApiError(e?.response?.data?.detail) || "Could not refresh"); }
    finally { setBusy(""); }
  };
  const cancelLink = async (id) => {
    if (!window.confirm("Cancel this payment link? The customer will no longer be able to pay with it.")) return;
    setBusy(id);
    try { const { data } = await api.post(`/admin/payment-links/${id}/cancel`); setLinks((p) => p.map((l) => l.link_id === id ? data : l)); toast.success("Link cancelled"); }
    catch (e) { toast.error(formatApiError(e?.response?.data?.detail) || "Could not cancel"); }
    finally { setBusy(""); }
  };

  const copy = (url) => { navigator.clipboard?.writeText(url); toast.success("Link copied"); };
  const waHref = (l) => {
    const dial = (countryByCode(l.country).dial || "+91").replace(/\D/g, "");
    const digits = (l.customer?.mobile || "").replace(/\D/g, "");
    const num = digits.startsWith(dial) ? digits : dial + digits;
    const msg = `Hello ${l.customer?.name || ""}, here is your secure AMYA payment link for ${inr(l.total)} (items ${inr(l.subtotal)} + shipping ${inr(l.shipping)}):\n${l.short_url}\n\nThis is a one-time secure Razorpay link. Your order is confirmed only once payment is completed.`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="max-w-4xl" data-testid="payment-links-panel">
      <SectionTitle>Payment links</SectionTitle>
      <p className="font-sans text-sm text-ink-soft -mt-3 mb-5 max-w-2xl">
        After agreeing a shipping quote on WhatsApp, create a one-time Razorpay link so the customer can pay without re-entering anything. When paid, a confirmed order is created automatically in the Orders tab.
      </p>

      {/* Create form */}
      <div className="bg-white border border-ink/10 p-5 grid sm:grid-cols-2 gap-4" data-testid="pl-create-form">
        <L label="Customer name *"><Input data-testid="pl-name" value={f.customer_name} onChange={set("customer_name")} /></L>
        <L label="Mobile number *"><Input data-testid="pl-mobile" value={f.customer_mobile} onChange={set("customer_mobile")} placeholder="e.g. 9675334567" /></L>
        <L label="Email (optional)"><Input data-testid="pl-email" type="email" value={f.customer_email} onChange={set("customer_email")} /></L>
        <L label="Country">
          <select data-testid="pl-country" value={f.country} onChange={set("country")} className="w-full h-10 px-3 border border-input bg-ivory text-sm">
            {COUNTRIES.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
          </select>
        </L>
        <div className="sm:col-span-2"><L label="Delivery address (optional — shown on invoice)"><Textarea data-testid="pl-address" value={f.delivery_address} onChange={set("delivery_address")} rows={2} /></L></div>
        <L label="Product subtotal (₹) *"><Input data-testid="pl-subtotal" type="number" value={f.subtotal} onChange={set("subtotal")} /></L>
        <L label="Agreed shipping (₹)"><Input data-testid="pl-shipping" type="number" value={f.shipping} onChange={set("shipping")} /></L>
        <div className="sm:col-span-2"><L label="Note (optional — appears in the link description)"><Input data-testid="pl-note" value={f.note} onChange={set("note")} /></L></div>
        <L label="Link expiry (days)"><Input data-testid="pl-expiry" type="number" value={f.expiry_days} onChange={set("expiry_days")} /></L>
        <div className="flex items-end">
          <div className="font-sans text-sm text-ink">Total payable: <span className="font-serif text-xl text-terracotta" data-testid="pl-total">{inr(total)}</span></div>
        </div>
        <div className="sm:col-span-2">
          <button onClick={create} disabled={busy === "create"} data-testid="pl-create" className={`${btn} bg-terracotta text-ivory hover:bg-terracotta-deep rounded-full disabled:opacity-50`}>
            <Link2 size={14} /> {busy === "create" ? "Creating…" : "Create payment link"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-8 space-y-3">
        {loading ? <p className="font-sans text-ink-soft">Loading…</p> :
          links.length === 0 ? <p className="font-sans text-ink-soft" data-testid="pl-empty">No payment links yet.</p> :
          links.map((l) => (
            <div key={l.link_id} data-testid={`pl-row-${l.link_id}`} className="bg-white border border-ink/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-serif text-lg text-ink">{l.customer?.name} · {inr(l.total)}</p>
                  <p className="font-sans text-xs text-ink-soft mt-0.5">{countryByCode(l.country).name} · {l.customer?.mobile}{l.customer?.email ? ` · ${l.customer.email}` : ""} · items {inr(l.subtotal)} + ship {inr(l.shipping)}</p>
                  {l.order_number && <p className="font-sans text-xs text-terracotta mt-0.5">Paid → order {l.order_number}</p>}
                </div>
                <LinkStatusPill status={l.status} />
              </div>
              {l.short_url && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a href={l.short_url} target="_blank" rel="noreferrer" className="font-sans text-xs text-ink underline break-all max-w-full" data-testid={`pl-url-${l.link_id}`}>{l.short_url}</a>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {l.short_url && <button onClick={() => copy(l.short_url)} data-testid={`pl-copy-${l.link_id}`} className={`${btn} border border-ink/20 rounded-full`}><Copy size={13} /> Copy link</button>}
                {l.short_url && l.status !== "cancelled" && (
                  <a href={waHref(l)} target="_blank" rel="noreferrer" data-testid={`pl-wa-${l.link_id}`} className={`${btn} border border-terracotta text-terracotta hover:bg-terracotta hover:text-ivory rounded-full`}><MessageCircle size={13} /> Send on WhatsApp</a>
                )}
                <button onClick={() => refresh(l.link_id)} disabled={busy === l.link_id} data-testid={`pl-refresh-${l.link_id}`} className={`${btn} border border-ink/20 rounded-full disabled:opacity-50`}><RefreshCw size={13} /> Refresh status</button>
                {l.status !== "paid" && l.status !== "cancelled" && (
                  <button onClick={() => cancelLink(l.link_id)} disabled={busy === l.link_id} data-testid={`pl-cancel-${l.link_id}`} className={`${btn} border border-ink/20 hover:bg-ink hover:text-ivory rounded-full disabled:opacity-50`}><Ban size={13} /> Cancel</button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function AccountSecurity() {
  const { admin, check } = useAuth();
  const [cur, setCur] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!cur) { toast.error("Enter your current password."); return; }
    if (!email && !pw) { toast.error("Enter a new email and/or new password."); return; }
    if (pw) {
      if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) { toast.error("New password must be at least 8 characters with a letter and a number."); return; }
      if (pw !== confirm) { toast.error("New passwords do not match."); return; }
    }
    setSaving(true);
    try {
      await api.post("/auth/change-credentials", { current_password: cur, new_email: email || undefined, new_password: pw || undefined });
      toast.success("Credentials updated.");
      setCur(""); setEmail(""); setPw(""); setConfirm("");
      check();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail) || "Update failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="bg-white border border-ink/10 p-5 space-y-4" data-testid="account-security">
      <div>
        <p className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft">Account security</p>
        <p className="font-sans text-sm text-ink mt-1">Signed in as <b>{admin?.email}</b>. Update your own login below — no default password is stored anywhere.</p>
      </div>
      <div><Label className="text-xs text-ink-soft">Current password *</Label><Input data-testid="sec-current" type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label className="text-xs text-ink-soft">New email (optional)</Label><Input data-testid="sec-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={admin?.email} /></div>
        <div className="hidden sm:block" />
        <div><Label className="text-xs text-ink-soft">New password (optional)</Label><Input data-testid="sec-password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div><Label className="text-xs text-ink-soft">Confirm new password</Label><Input data-testid="sec-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
      </div>
      <button onClick={submit} disabled={saving} data-testid="sec-save" className={`${btn} bg-ink text-ivory rounded-full`}>{saving ? "Saving…" : "Update credentials"}</button>
    </div>
  );
}

function SettingsPanel({ settings, setSettings, onSave }) {
  const s = settings;
  const upd = (k, v) => setSettings({ ...s, [k]: v });
  const updPolicy = (k, v) => setSettings({ ...s, policies: { ...(s.policies || {}), [k]: v } });
  return (
    <div className="max-w-3xl space-y-8">
      <SectionTitle action={<button onClick={onSave} data-testid="save-settings" className={`${btn} bg-terracotta text-ivory rounded-full`}>Save settings</button>}>Site settings</SectionTitle>

      <AccountSecurity />

      <div className="bg-white border border-ink/10 p-5 space-y-4">
        <ToggleRow label="Announcement bar" checked={s.announcement_enabled} onChange={(v) => upd("announcement_enabled", v)} testid="toggle-announcement" />
        <Textarea data-testid="announcement-text" value={s.announcement_text} onChange={(e) => upd("announcement_text", e.target.value)} rows={2} />
      </div>

      <div className="bg-white border border-ink/10 p-5 space-y-4">
        <ToggleRow label="Pre-launch mode" checked={s.prelaunch_mode} onChange={(v) => upd("prelaunch_mode", v)} testid="toggle-prelaunch" />
        <ToggleRow label="Enable online checkout (only when food-business approvals are confirmed)" checked={s.checkout_enabled} onChange={(v) => upd("checkout_enabled", v)} testid="toggle-checkout" />
      </div>

      <div className="bg-white border border-ink/10 p-5 space-y-4">
        <p className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft">Manual payment details (optional — for later)</p>
        <div><Label className="text-xs text-ink-soft">Bank transfer details</Label><Textarea data-testid="bank-details" value={s.bank_details || ""} onChange={(e) => upd("bank_details", e.target.value)} rows={2} /></div>
        <div><Label className="text-xs text-ink-soft">UPI ID</Label><Input data-testid="upi-id" value={s.upi_id || ""} onChange={(e) => upd("upi_id", e.target.value)} /></div>
      </div>

        <div className="bg-white border border-ink/10 p-5 space-y-4">
        <p className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft">AMYA Oils homepage video</p>
        <div><Label className="text-xs text-ink-soft">Oils video URL (MP4 link). Leave blank to show the placeholder.</Label><Input data-testid="oils-video-url" value={s.oils_video_url || ""} onChange={(e) => upd("oils_video_url", e.target.value)} placeholder="https://.../amya-oils.mp4" /></div>
      </div>

      <div className="bg-white border border-ink/10 p-5 space-y-4">
        <p className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft">Invoice &amp; business details (printed on invoices — leave blank if not available yet)</p>
        <div><Label className="text-xs text-ink-soft">Registered / legal business name</Label><Input data-testid="set-legal-name" value={s.legal_name || ""} onChange={(e) => upd("legal_name", e.target.value)} placeholder="e.g. AMYA Artisanal Foods" /></div>
        <div><Label className="text-xs text-ink-soft">Registered business address</Label><Textarea data-testid="set-address" value={s.business_address || ""} onChange={(e) => upd("business_address", e.target.value)} rows={2} /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label className="text-xs text-ink-soft">FSSAI registration number</Label><Input data-testid="set-fssai" value={s.fssai_number || ""} onChange={(e) => upd("fssai_number", e.target.value)} /></div>
          <div><Label className="text-xs text-ink-soft">Website</Label><Input data-testid="set-website" value={s.website || ""} onChange={(e) => upd("website", e.target.value)} /></div>
          <div><Label className="text-xs text-ink-soft">Support email (on invoice)</Label><Input data-testid="set-support-email" value={s.support_email || ""} onChange={(e) => upd("support_email", e.target.value)} /></div>
          <div><Label className="text-xs text-ink-soft">Support phone (on invoice)</Label><Input data-testid="set-support-phone" value={s.support_phone || ""} onChange={(e) => upd("support_phone", e.target.value)} /></div>
          <div><Label className="text-xs text-ink-soft">Business notification email (receives orders)</Label><Input data-testid="set-notify-email" value={s.business_notify_email || ""} onChange={(e) => upd("business_notify_email", e.target.value)} /></div>
          <div><Label className="text-xs text-ink-soft">Delivery charge (₹, 0 = confirm later)</Label><Input data-testid="set-delivery" type="number" value={s.delivery_charge ?? 0} onChange={(e) => upd("delivery_charge", Number(e.target.value) || 0)} /></div>
        </div>
        <ToggleRow label="GST applicable (adds a tax line to invoices)" checked={!!s.gst_enabled} onChange={(v) => upd("gst_enabled", v)} testid="toggle-gst" />
        {s.gst_enabled && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs text-ink-soft">GSTIN</Label><Input data-testid="set-gstin" value={s.gstin || ""} onChange={(e) => upd("gstin", e.target.value)} /></div>
            <div><Label className="text-xs text-ink-soft">GST rate (%)</Label><Input data-testid="set-gst-rate" type="number" value={s.gst_rate ?? 0} onChange={(e) => upd("gst_rate", Number(e.target.value) || 0)} /></div>
          </div>
        )}
      </div>

      <div className="bg-white border border-ink/10 p-5 space-y-4">
        <p className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft">Editable policies</p>
        {[["terms", "Terms & Conditions"], ["privacy", "Privacy Policy"], ["shipping", "Shipping Policy"], ["refund", "Cancellation & Refund"], ["food_disclosure", "Food-business disclosures"]].map(([k, l]) => (
          <div key={k}>
            <Label className="text-xs text-ink-soft">{l}</Label>
            <Textarea data-testid={`policy-${k}`} value={(s.policies || {})[k] || ""} onChange={(e) => updPolicy(k, e.target.value)} rows={3} />
          </div>
        ))}
      </div>
    </div>
  );
}


function ToggleRow({ label, checked, onChange, testid }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-sans text-sm text-ink">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} data-testid={testid} />
    </div>
  );
}

function BatchManager({ batches, reload }) {
  const [f, setF] = useState({ batch_id: "", product_name: "", production_date: "", extraction_method: "", ingredient_source: "", quality_report_url: "", video_url: "", notes: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const create = async () => {
    if (!f.batch_id || !f.product_name || !f.production_date) { toast.error("Batch ID, product and date are required."); return; }
    try { await api.post("/admin/batches", f); toast.success("Batch added"); setF({ batch_id: "", product_name: "", production_date: "", extraction_method: "", ingredient_source: "", quality_report_url: "", video_url: "", notes: "" }); reload(); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };
  const del = async (id) => { await api.delete(`/admin/batches/${id}`); reload(); };
  return (
    <div className="max-w-3xl">
      <SectionTitle>Batch records</SectionTitle>
      <div className="bg-white border border-ink/10 p-5 grid sm:grid-cols-2 gap-4">
        <L label="Batch ID *"><Input data-testid="batch-id" value={f.batch_id} onChange={set("batch_id")} /></L>
        <L label="Product name *"><Input data-testid="batch-product" value={f.product_name} onChange={set("product_name")} /></L>
        <L label="Production date *"><Input data-testid="batch-date" type="date" value={f.production_date} onChange={set("production_date")} /></L>
        <L label="Extraction method"><Input value={f.extraction_method} onChange={set("extraction_method")} /></L>
        <L label="Ingredient source"><Input value={f.ingredient_source} onChange={set("ingredient_source")} /></L>
        <L label="Quality report URL"><Input value={f.quality_report_url} onChange={set("quality_report_url")} /></L>
        <L label="Preparation video URL"><Input value={f.video_url} onChange={set("video_url")} /></L>
        <div className="sm:col-span-2"><L label="Notes"><Textarea value={f.notes} onChange={set("notes")} rows={2} /></L></div>
        <div className="sm:col-span-2"><button onClick={create} data-testid="add-batch" className={`${btn} bg-terracotta text-ivory rounded-full`}><Plus size={14} /> Add batch</button></div>
      </div>
      <div className="mt-6 space-y-3">
        {batches.map((b) => (
          <div key={b.id} className="flex items-center justify-between bg-white border border-ink/10 p-4">
            <div><p className="font-serif text-lg">{b.batch_id} · {b.product_name}</p><p className="font-sans text-xs text-ink-soft">{b.production_date}</p></div>
            <button onClick={() => del(b.id)} className={`${btn} border border-ink/20 hover:bg-terracotta hover:text-ivory`}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

const L = ({ label, children }) => (<div><Label className="text-xs text-ink-soft mb-1 block">{label}</Label>{children}</div>);

function ProductDialog({ product, onClose, onSave }) {
  const [f, setF] = useState({ ...product, images: product.images || [], pack_sizes: product.pack_sizes || [] });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const addPack = () => setF({ ...f, pack_sizes: [...f.pack_sizes, { label: "", price: null, note: "" }] });
  const updPack = (i, k, v) => { const ps = [...f.pack_sizes]; ps[i] = { ...ps[i], [k]: k === "price" ? (v === "" ? null : Number(v)) : v }; setF({ ...f, pack_sizes: ps }); };
  const rmPack = (i) => setF({ ...f, pack_sizes: f.pack_sizes.filter((_, idx) => idx !== i) });

  const submit = () => {
    if (!f.name) { toast.error("Name is required"); return; }
    onSave({ ...f, sort_order: Number(f.sort_order) || 0 });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-ivory">
        <DialogHeader><DialogTitle className="font-serif text-2xl">{f.id ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-4">
          <L label="Name *"><Input data-testid="pf-name" value={f.name} onChange={set("name")} /></L>
          <L label="Category">
            <select data-testid="pf-category" value={f.category} onChange={set("category")} className="w-full h-10 px-3 border border-input bg-ivory text-sm">
              <option value="oils">Oils</option><option value="cashew-brittles">Cashew Brittles</option><option value="pickles">Pickles</option>
            </select>
          </L>
          <L label="Slug (optional)"><Input value={f.slug || ""} onChange={set("slug")} placeholder="auto from name" /></L>
          <L label="Availability">
            <select data-testid="pf-availability" value={f.availability} onChange={set("availability")} className="w-full h-10 px-3 border border-input bg-ivory text-sm">
              <option value="in-stock">Available to Order</option><option value="available">Available to Order</option><option value="out-of-stock">Out of Stock</option><option value="coming-soon">Coming Soon</option><option value="unavailable">Temporarily Unavailable</option>
            </select>
          </L>
          <div className="sm:col-span-2"><L label="Short description"><Input value={f.short_description} onChange={set("short_description")} /></L></div>
          <div className="sm:col-span-2"><L label="Description"><Textarea value={f.description} onChange={set("description")} rows={3} /></L></div>
          <L label="Extraction method"><Input value={f.extraction_method} onChange={set("extraction_method")} /></L>
          <L label="Ingredients"><Input value={f.ingredients} onChange={set("ingredients")} /></L>
          <L label="Allergens"><Input value={f.allergens} onChange={set("allergens")} /></L>
          <L label="Storage"><Input value={f.storage} onChange={set("storage")} /></L>
          <L label="Delivery info"><Input value={f.delivery_info} onChange={set("delivery_info")} /></L>
          <L label="Returns info"><Input value={f.returns_info} onChange={set("returns_info")} /></L>
          <L label="Food-label info"><Input value={f.food_label_info} onChange={set("food_label_info")} /></L>
          <L label="Sort order"><Input type="number" value={f.sort_order} onChange={set("sort_order")} /></L>
          <div className="sm:col-span-2">
            <L label="Image URLs (one per line)">
              <Textarea data-testid="pf-images" value={(f.images || []).join("\n")} onChange={(e) => setF({ ...f, images: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} rows={2} />
            </L>
          </div>
          <div className="sm:col-span-2 flex gap-8">
            <ToggleRow label="Live Press (oils only)" checked={f.live_press} onChange={(v) => setF({ ...f, live_press: v })} testid="pf-livepress" />
            <ToggleRow label="Featured" checked={f.featured} onChange={(v) => setF({ ...f, featured: v })} testid="pf-featured" />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-ink-soft">Pack sizes</Label>
              <button onClick={addPack} className={`${btn} border border-ink/20`} data-testid="pf-add-pack"><Plus size={13} /> Add</button>
            </div>
            {f.pack_sizes.map((ps, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input placeholder="Label (e.g. 500 ml)" value={ps.label} onChange={(e) => updPack(i, "label", e.target.value)} />
                <Input placeholder="Price (₹)" type="number" value={ps.price ?? ""} onChange={(e) => updPack(i, "price", e.target.value)} className="w-28" />
                <Input placeholder="Note" value={ps.note || ""} onChange={(e) => updPack(i, "note", e.target.value)} />
                <button onClick={() => rmPack(i)} className={`${btn} border border-ink/20`}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className={`${btn} border border-ink/20 rounded-full`}>Cancel</button>
          <button onClick={submit} data-testid="pf-save" className={`${btn} bg-terracotta text-ivory rounded-full`}>Save product</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
