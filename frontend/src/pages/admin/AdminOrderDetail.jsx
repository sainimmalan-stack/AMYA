import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, FileText, MessageCircle, Truck, Ban, History, CreditCard, MapPin, Package,
} from "lucide-react";
import { api, API, formatApiError, waLink } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  LIFECYCLE, TONE, orderStatusMeta, paymentStatusMeta, inr, paymentMethodLabel, formatDateTime,
} from "@/lib/orders";

function Badge({ meta, size = "sm" }) {
  return (
    <span className={`inline-flex items-center rounded-full border font-sans uppercase tracking-[0.08em] ${TONE[meta.tone]} ${size === "lg" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]"}`}>
      {meta.label}
    </span>
  );
}

const Card = ({ title, icon: Icon, children, testid }) => (
  <div data-testid={testid} className="bg-white border border-ink/10 rounded-xl p-5">
    {title && (
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={16} className="text-terracotta" />}
        <h2 className="font-sans text-xs uppercase tracking-[0.15em] text-ink-soft">{title}</h2>
      </div>
    )}
    {children}
  </div>
);

const actBtn = "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-sans uppercase tracking-[0.08em] rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export default function AdminOrderDetail() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [track, setTrack] = useState("");
  const [courier, setCourier] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/orders/${orderNumber}`);
      setOrder(data);
      setTrack(data.tracking_reference || "");
      setCourier(data.courier_name || "");
    } catch {
      toast.error("Order not found");
      navigate("/admin");
    } finally { setLoading(false); }
  }, [orderNumber, navigate]);

  useEffect(() => {
    if (admin === false) { navigate("/admin/login"); return; }
    if (admin) load();
  }, [admin, load, navigate]);

  if (!admin || loading) return <div className="min-h-screen bg-ivory py-40 text-center font-sans text-ink-soft">Loading…</div>;
  if (!order) return null;

  const patch = async (body, okMsg = "Updated") => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/orders/${orderNumber}`, body);
      setOrder(data);
      if (data.email_result) {
        toast.success(`${okMsg}. Customer email: ${data.email_result.ok ? "sent" : `not sent (${data.email_result.detail || "error"})`}`);
      } else {
        toast.success(okMsg);
      }
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail) || "Update failed");
    } finally { setSaving(false); }
  };

  const setStatus = (s) => patch({ order_status: s }, `Order marked ${orderStatusMeta(s).label}`);
  const setPayment = (s) => patch({ payment_status: s }, `Payment marked ${paymentStatusMeta(s).label}`);
  const saveTracking = () => patch({ tracking_reference: track, courier_name: courier }, "Tracking saved");
  const doCancel = async () => {
    if (!cancelReason.trim()) { toast.error("Please enter a cancellation reason."); return; }
    await patch({ order_status: "cancelled", cancellation_reason: cancelReason.trim() }, "Order cancelled");
    setCancelOpen(false); setCancelReason("");
  };

  const c = order.customer || {};
  const isCancelled = order.order_status === "cancelled";
  const ps = order.payment_status;
  const moneyCollected = ps === "paid" || ps === "cod_collected";
  const waMsg = `Hello ${c.name || ""}, regarding your AMYA order ${order.order_number}.`;
  const history = [...(order.status_history || [])].reverse();

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-ink/10 bg-ivory sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/admin")} data-testid="back-to-dashboard" className="inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.12em] text-ink-soft hover:text-terracotta">
            <ArrowLeft size={15} /> Dashboard
          </button>
          <Logo variant="ink" size="sm" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 space-y-6">
        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-ink" data-testid="detail-order-number">{order.order_number}</h1>
            <p className="font-sans text-xs text-ink-soft mt-1">Placed {formatDateTime(order.created_at)} · Invoice {order.invoice_number}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge meta={orderStatusMeta(order.order_status)} size="lg" />
            <Badge meta={paymentStatusMeta(order.payment_status)} size="lg" />
          </div>
        </div>

        {isCancelled && order.cancellation_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4" data-testid="cancel-reason-banner">
            <p className="font-sans text-xs uppercase tracking-[0.12em] text-red-700 mb-1">Cancelled</p>
            <p className="font-sans text-sm text-red-800">{order.cancellation_reason}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: items + customer */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Items" icon={Package} testid="detail-items">
              <div className="divide-y divide-ink/8">
                {(order.items || []).map((it, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-2.5">
                    <div>
                      <p className="font-sans text-sm text-ink">{it.name}</p>
                      <p className="font-sans text-xs text-ink-soft">{it.pack_label ? `${it.pack_label} · ` : ""}Qty {it.qty}{it.unit_price != null ? ` · ${inr(it.unit_price)} each` : ""}</p>
                    </div>
                    <p className="font-sans text-sm text-ink whitespace-nowrap">{inr(it.line_total)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-ink/10 mt-3 pt-3 space-y-1.5 font-sans text-sm">
                <Row label="Subtotal" value={inr(order.subtotal)} />
                <Row label="Delivery charge" value={inr(order.delivery_charge)} />
                {order.gst_amount != null && <Row label="GST" value={inr(order.gst_amount)} />}
                <div className="flex justify-between pt-1.5 border-t border-ink/10">
                  <span className="font-serif text-lg text-ink">Total payable</span>
                  <span className="font-serif text-lg text-terracotta" data-testid="detail-total">{order.total_pending ? "To be confirmed" : inr(order.total)}</span>
                </div>
              </div>
            </Card>

            <Card title="Customer & delivery" icon={MapPin} testid="detail-customer">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 font-sans text-sm">
                <Row label="Name" value={c.name} />
                <Row label="Phone" value={c.mobile} />
                <Row label="Email" value={c.email || "—"} />
                <Row label="Payment method" value={paymentMethodLabel(order.payment_method)} />
              </div>
              <div className="mt-3 pt-3 border-t border-ink/10">
                <p className="font-sans text-[10px] uppercase tracking-[0.12em] text-ink-soft mb-1">Delivery address</p>
                <p className="font-sans text-sm text-ink whitespace-pre-line" data-testid="detail-address">{c.address}</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <a href={`${API}/admin/orders/${order.order_number}/invoice`} target="_blank" rel="noreferrer"
                   data-testid="detail-invoice" className={`${actBtn} border-terracotta text-terracotta hover:bg-terracotta hover:text-ivory`}>
                  <FileText size={14} /> Invoice / Print
                </a>
                {c.mobile && (
                  <a href={waLink(c.mobile, waMsg)} target="_blank" rel="noreferrer"
                     data-testid="detail-whatsapp" className={`${actBtn} border-ink/20 text-ink hover:border-terracotta hover:text-terracotta`}>
                    <MessageCircle size={14} /> WhatsApp customer
                  </a>
                )}
              </div>
            </Card>

            {/* Status history */}
            <Card title="Status history" icon={History} testid="detail-history">
              {history.length === 0 ? (
                <p className="font-sans text-sm text-ink-soft">No changes recorded yet.</p>
              ) : (
                <ol className="space-y-3">
                  {history.map((h, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-terracotta shrink-0" />
                      <div>
                        <p className="font-sans text-sm text-ink">
                          {h.field === "payment_status" ? "Payment" : "Order"}: <b>{h.to}</b>
                          <span className="text-ink-soft"> (was {h.from || "—"})</span>
                        </p>
                        <p className="font-sans text-[11px] text-ink-soft">{formatDateTime(h.at)} · {h.by}{h.note ? ` · “${h.note}”` : ""}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>

          {/* Right: actions */}
          <div className="space-y-6">
            <Card title="Order status" icon={Truck} testid="detail-lifecycle">
              <div className="grid grid-cols-2 gap-2">
                {LIFECYCLE.map((s) => {
                  const active = order.order_status === s;
                  return (
                    <button key={s} disabled={saving || active || isCancelled} onClick={() => setStatus(s)}
                            data-testid={`set-status-${s}`}
                            className={`${actBtn} justify-center ${active ? "bg-terracotta text-ivory border-terracotta" : "border-ink/20 text-ink hover:border-terracotta hover:text-terracotta"}`}>
                      {orderStatusMeta(s).label}
                    </button>
                  );
                })}
              </div>
              {!isCancelled ? (
                <button onClick={() => setCancelOpen(true)} data-testid="cancel-order-btn"
                        className={`${actBtn} justify-center w-full mt-2 border-red-300 text-red-600 hover:bg-red-600 hover:text-white`}>
                  <Ban size={14} /> Cancel order
                </button>
              ) : (
                <p className="font-sans text-xs text-ink-soft mt-3">This order is cancelled. Reactivate by selecting another status above.</p>
              )}
            </Card>

            <Card title="Shipping / tracking" icon={Truck} testid="detail-tracking">
              <div className="space-y-3">
                <div>
                  <Label className="text-[11px] text-ink-soft">Courier (optional)</Label>
                  <Input value={courier} onChange={(e) => setCourier(e.target.value)} data-testid="tracking-courier" placeholder="e.g. Delhivery" />
                </div>
                <div>
                  <Label className="text-[11px] text-ink-soft">Tracking reference</Label>
                  <Input value={track} onChange={(e) => setTrack(e.target.value)} data-testid="tracking-ref" placeholder="e.g. AWB123456789" />
                </div>
                <button onClick={saveTracking} disabled={saving} data-testid="save-tracking"
                        className={`${actBtn} justify-center w-full bg-ink text-ivory border-ink hover:bg-ink/90`}>Save tracking</button>
              </div>
            </Card>

            <Card title="Payment" icon={CreditCard} testid="detail-payment">
              <div className="space-y-1.5 font-sans text-sm">
                <Row label="Method" value={paymentMethodLabel(order.payment_method)} />
                <Row label="Status" value={<Badge meta={paymentStatusMeta(order.payment_status)} />} />
                {order.razorpay_order_id && <Row label="Razorpay order" value={<span className="text-[11px]">{order.razorpay_order_id}</span>} />}
                {order.razorpay_payment_id && <Row label="Razorpay payment" value={<span className="text-[11px]" data-testid="detail-rzp-payment">{order.razorpay_payment_id}</span>} />}
              </div>
              <div className="flex flex-col gap-2 mt-4">
                {order.payment_method === "cod" && ps === "cod_pending" && (
                  <button onClick={() => setPayment("cod_collected")} disabled={saving} data-testid="mark-cod-collected"
                          className={`${actBtn} justify-center border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white`}>Mark COD collected</button>
                )}
                {order.payment_method === "razorpay" && ps === "pending" && (
                  <button onClick={() => setPayment("failed")} disabled={saving} data-testid="mark-payment-failed"
                          className={`${actBtn} justify-center border-red-300 text-red-600 hover:bg-red-600 hover:text-white`}>Mark payment failed</button>
                )}
                {moneyCollected && (
                  <button onClick={() => setPayment("refund_processing")} disabled={saving} data-testid="start-refund"
                          className={`${actBtn} justify-center border-violet-300 text-violet-700 hover:bg-violet-600 hover:text-white`}>Start refund</button>
                )}
                {ps === "refund_processing" && (
                  <button onClick={() => setPayment("refunded")} disabled={saving} data-testid="confirm-refund"
                          className={`${actBtn} justify-center border-ink/20 text-ink hover:bg-ink hover:text-ivory`}>Confirm refund done</button>
                )}
                <p className="font-sans text-[11px] text-ink-soft">
                  Online payments are marked Paid automatically only after Razorpay signature verification. Process any actual refund in your Razorpay dashboard first, then confirm it here.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="bg-ivory">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Cancel this order?</DialogTitle></DialogHeader>
          <p className="font-sans text-sm text-ink-soft">This records a cancellation reason and marks the order cancelled. It does not trigger any automatic refund — process refunds separately if required.</p>
          <div className="mt-2">
            <Label className="text-xs text-ink-soft">Cancellation reason (required)</Label>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} data-testid="cancel-reason-input" placeholder="e.g. Customer requested cancellation" />
          </div>
          <DialogFooter>
            <button onClick={() => setCancelOpen(false)} className={`${actBtn} border-ink/20 text-ink`}>Keep order</button>
            <button onClick={doCancel} disabled={saving || !cancelReason.trim()} data-testid="confirm-cancel"
                    className={`${actBtn} bg-red-600 text-white border-red-600 hover:bg-red-700`}>Cancel order</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-soft text-xs uppercase tracking-[0.08em]">{label}</span>
      <span className="text-ink text-right">{value}</span>
    </div>
  );
}
