import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Download, X, ChevronRight, IndianRupee, Trash2, RotateCcw, ShieldAlert } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ORDER_STATUS, PAYMENT_STATUS, TONE, orderStatusMeta, paymentStatusMeta,
  inr, paymentMethodLabel, revenueOf, withinRange, formatDateTime, itemsSummary,
  ordersToCSV, downloadCSV,
} from "@/lib/orders";

function Badge({ meta }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-sans uppercase tracking-[0.08em] whitespace-nowrap ${TONE[meta.tone]}`}>
      {meta.label}
    </span>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div data-testid={`stat-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
         className={`rounded-xl border p-4 ${accent ? "bg-terracotta text-ivory border-terracotta" : "bg-white border-ink/10"}`}>
      <p className={`font-sans text-[10px] uppercase tracking-[0.14em] ${accent ? "text-ivory/80" : "text-ink-soft"}`}>{label}</p>
      <p className={`font-serif text-2xl mt-1 ${accent ? "text-ivory" : "text-ink"}`}>{value}</p>
    </div>
  );
}

const selCls = "h-9 px-2 border border-ink/15 rounded-md bg-white font-sans text-xs text-ink";
const Check = (props) => <input type="checkbox" className="h-4 w-4 accent-[#B94F40] cursor-pointer" {...props} />;

export default function AdminOrders({ orders, reload }) {
  const navigate = useNavigate();
  const [view, setView] = useState("active");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [q, setQ] = useState("");

  const [deleted, setDeleted] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkAck, setBulkAck] = useState(false);
  const [permTarget, setPermTarget] = useState(null);
  const [permAck, setPermAck] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadDeleted = useCallback(async () => {
    try { const { data } = await api.get("/admin/orders/deleted"); setDeleted(data); }
    catch { toast.error("Could not load Trash"); }
  }, []);

  useEffect(() => {
    setSelected(new Set());
    if (view === "trash") loadDeleted();
  }, [view, loadDeleted]);

  const source = view === "active" ? orders : deleted;
  const dateScoped = useMemo(() => source.filter((o) => withinRange(o.created_at, from, to)), [source, from, to]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return dateScoped.filter((o) => {
      if (payFilter !== "all" && o.payment_status !== payFilter) return false;
      if (statusFilter !== "all" && o.order_status !== statusFilter) return false;
      if (methodFilter !== "all" && o.payment_method !== methodFilter) return false;
      if (term) {
        const hay = `${o.order_number} ${o.customer?.name || ""} ${o.customer?.mobile || ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [dateScoped, payFilter, statusFilter, methodFilter, q]);

  const count = (pred) => dateScoped.filter(pred).length;
  const summary = {
    total: dateScoped.length,
    new: count((o) => o.order_status === "placed"),
    confirmed: count((o) => o.order_status === "confirmed"),
    awaiting: count((o) => ["pending", "cod_pending"].includes(o.payment_status)),
    paid: count((o) => o.payment_status === "paid"),
    preparing: count((o) => o.order_status === "preparing"),
    shipped: count((o) => o.order_status === "shipped"),
    delivered: count((o) => o.order_status === "delivered"),
    cancelled: count((o) => o.order_status === "cancelled"),
    refunded: count((o) => o.payment_status === "refunded"),
    revenue: revenueOf(dateScoped),
  };

  const resetFilters = () => { setFrom(""); setTo(""); setPayFilter("all"); setStatusFilter("all"); setMethodFilter("all"); setQ(""); };
  const anyFilter = from || to || payFilter !== "all" || statusFilter !== "all" || methodFilter !== "all" || q;
  const exportCsv = () => downloadCSV(`amya-orders-${view}-${new Date().toISOString().slice(0, 10)}.csv`, ordersToCSV(rows));

  // ---- selection ----
  const toggleSel = (on) => setSelected((prev) => { const n = new Set(prev); n.has(on) ? n.delete(on) : n.add(on); return n; });
  const allVisibleSelected = rows.length > 0 && rows.every((o) => selected.has(o.order_number));
  const toggleAll = () => setSelected((prev) => {
    if (rows.every((o) => prev.has(o.order_number))) return new Set();
    return new Set(rows.map((o) => o.order_number));
  });

  // ---- actions ----
  const doBulkDelete = async () => {
    setBusy(true);
    try {
      const nums = [...selected];
      const { data } = await api.post("/admin/orders/bulk-delete", { order_numbers: nums });
      toast.success(`${data.deleted} order${data.deleted === 1 ? "" : "s"} moved to Trash`);
      setSelected(new Set()); setBulkOpen(false); setBulkAck(false);
      reload();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail) || "Delete failed"); }
    finally { setBusy(false); }
  };
  const doRestore = async (on) => {
    try { await api.post(`/admin/orders/${on}/restore`); toast.success("Order restored"); await loadDeleted(); reload(); }
    catch (e) { toast.error(formatApiError(e?.response?.data?.detail) || "Restore failed"); }
  };
  const doPermanent = async () => {
    if (!permTarget) return;
    setBusy(true);
    try {
      await api.delete(`/admin/orders/${permTarget.order_number}/permanent`);
      toast.success("Order permanently deleted");
      setPermTarget(null); setPermAck(false); await loadDeleted();
    } catch (e) { toast.error(formatApiError(e?.response?.data?.detail) || "Permanent delete failed"); }
    finally { setBusy(false); }
  };

  const isTrash = view === "trash";

  return (
    <div data-testid="orders-panel" className="space-y-6">
      {/* View toggle */}
      <div className="inline-flex rounded-full border border-ink/15 bg-white p-1">
        {[["active", "Active orders"], ["trash", `Trash${deleted.length ? ` (${deleted.length})` : ""}`]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} data-testid={`view-${v}`}
                  className={`px-4 py-1.5 rounded-full font-sans text-xs uppercase tracking-[0.1em] transition-colors ${view === v ? "bg-terracotta text-ivory" : "text-ink-soft hover:text-terracotta"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Summary (active only) */}
      {!isTrash && (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <h2 className="font-serif text-2xl">Orders overview</h2>
            <div className="flex items-end gap-3">
              <label className="font-sans text-[10px] uppercase tracking-[0.12em] text-ink-soft">From
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="filter-from" className="h-9 mt-1 w-[150px]" />
              </label>
              <label className="font-sans text-[10px] uppercase tracking-[0.12em] text-ink-soft">To
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="filter-to" className="h-9 mt-1 w-[150px]" />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <Stat label="Verified revenue" value={inr(summary.revenue)} accent />
            <Stat label="Total orders" value={summary.total} />
            <Stat label="New" value={summary.new} />
            <Stat label="Confirmed" value={summary.confirmed} />
            <Stat label="Awaiting payment" value={summary.awaiting} />
            <Stat label="Paid" value={summary.paid} />
            <Stat label="Preparing" value={summary.preparing} />
            <Stat label="Shipped" value={summary.shipped} />
            <Stat label="Delivered" value={summary.delivered} />
            <Stat label="Cancelled" value={summary.cancelled} />
            <Stat label="Refunded" value={summary.refunded} />
          </div>
          <p className="font-sans text-[11px] text-ink-soft mt-2 flex items-center gap-1">
            <IndianRupee size={12} /> Revenue counts only verified online payments and collected COD, excluding cancelled, pending, failed, refunded and deleted orders.
          </p>
        </div>
      )}

      {isTrash && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
          <ShieldAlert size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="font-sans text-xs text-amber-800">Deleted orders are hidden from the dashboard and excluded from counts and revenue, but are still retained. Restore anytime. Permanent deletion is blocked for orders with a verified payment/refund record (kept for tax & accounting compliance).</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-ivory-warm border border-ink/10 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} data-testid="order-search" placeholder="Search order ID, name or phone" className="h-9 pl-9" />
        </div>
        {isTrash && (
          <>
            <label className="font-sans text-[10px] uppercase tracking-[0.12em] text-ink-soft">From
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="filter-from" className="h-9 mt-1 w-[140px]" /></label>
            <label className="font-sans text-[10px] uppercase tracking-[0.12em] text-ink-soft">To
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="filter-to" className="h-9 mt-1 w-[140px]" /></label>
          </>
        )}
        <select className={selCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} data-testid="filter-order-status">
          <option value="all">All order statuses</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className={selCls} value={payFilter} onChange={(e) => setPayFilter(e.target.value)} data-testid="filter-payment-status">
          <option value="all">All payment statuses</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className={selCls} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} data-testid="filter-method">
          <option value="all">All methods</option>
          <option value="cod">Cash on Delivery</option>
          <option value="razorpay">Online (Razorpay)</option>
        </select>
        {anyFilter && (
          <button onClick={resetFilters} data-testid="reset-filters" className="inline-flex items-center gap-1 font-sans text-xs text-ink-soft hover:text-terracotta"><X size={13} /> Clear</button>
        )}
        <button onClick={exportCsv} data-testid="export-csv" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-sans uppercase tracking-[0.1em] bg-terracotta text-ivory rounded-full hover:bg-terracotta-deep transition-colors ml-auto">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Bulk delete bar (active) */}
      {!isTrash && selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 bg-white border border-terracotta/40 rounded-xl p-3" data-testid="bulk-bar">
          <span className="font-sans text-sm text-ink" data-testid="selected-count">{selected.size} order{selected.size === 1 ? "" : "s"} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelected(new Set())} className="font-sans text-xs text-ink-soft hover:text-terracotta">Clear</button>
            <button onClick={() => { setBulkAck(false); setBulkOpen(true); }} data-testid="delete-selected"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-sans uppercase tracking-[0.1em] bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">
              <Trash2 size={14} /> Delete selected
            </button>
          </div>
        </div>
      )}

      <p className="font-sans text-xs text-ink-soft" data-testid="orders-result-count">
        Showing {rows.length} {isTrash ? "deleted " : ""}order{rows.length === 1 ? "" : "s"}
      </p>

      {rows.length === 0 ? (
        <p className="font-serif text-xl text-ink/50 py-10 text-center">{isTrash ? "Trash is empty." : "No orders match these filters."}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto border border-ink/10 rounded-xl bg-white">
            <table className="w-full text-left">
              <thead className="bg-ivory-warm">
                <tr className="font-sans text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  {!isTrash && <th className="px-4 py-3 w-10"><Check checked={allVisibleSelected} onChange={toggleAll} data-testid="select-all" aria-label="Select all" /></th>}
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">{isTrash ? "Deleted" : "Date"}</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.order_number} data-testid={`order-row-${o.order_number}`}
                      className="border-t border-ink/8 hover:bg-ivory-warm/60 align-top">
                    {!isTrash && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Check checked={selected.has(o.order_number)} onChange={() => toggleSel(o.order_number)} data-testid={`select-${o.order_number}`} />
                      </td>
                    )}
                    <td className="px-4 py-3 font-sans text-xs font-medium text-ink cursor-pointer" onClick={() => navigate(`/admin/orders/${o.order_number}`)}>{o.order_number}</td>
                    <td className="px-4 py-3 font-sans text-xs text-ink-soft whitespace-nowrap">{formatDateTime(isTrash ? o.deleted_at : o.created_at)}</td>
                    <td className="px-4 py-3 font-sans text-xs text-ink"><span className="block">{o.customer?.name}</span><span className="block text-ink-soft">{o.customer?.mobile}</span></td>
                    <td className="px-4 py-3 font-sans text-xs text-ink-soft max-w-[220px]">{itemsSummary(o)}</td>
                    <td className="px-4 py-3"><div className="flex flex-col gap-1 items-start"><span className="font-sans text-[10px] text-ink-soft">{paymentMethodLabel(o.payment_method)}</span><Badge meta={paymentStatusMeta(o.payment_status)} /></div></td>
                    <td className="px-4 py-3"><Badge meta={orderStatusMeta(o.order_status)} /></td>
                    <td className="px-4 py-3 font-serif text-sm text-terracotta text-right whitespace-nowrap">{o.total_pending ? "TBC" : inr(o.total)}</td>
                    <td className="px-4 py-3">
                      {isTrash ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => doRestore(o.order_number)} data-testid={`restore-${o.order_number}`} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-emerald-700 border border-emerald-300 rounded-full px-2.5 py-1 hover:bg-emerald-600 hover:text-white transition-colors"><RotateCcw size={12} /> Restore</button>
                          <button onClick={() => { setPermAck(false); setPermTarget(o); }} data-testid={`perm-${o.order_number}`} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-red-600 border border-red-300 rounded-full px-2.5 py-1 hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={12} /> Delete</button>
                        </div>
                      ) : (
                        <button onClick={() => navigate(`/admin/orders/${o.order_number}`)} className="text-ink-soft"><ChevronRight size={16} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rows.map((o) => (
              <div key={o.order_number} data-testid={`order-card-${o.order_number}`} className="bg-white border border-ink/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {!isTrash && <Check checked={selected.has(o.order_number)} onChange={() => toggleSel(o.order_number)} data-testid={`select-${o.order_number}`} />}
                    <div>
                      <p className="font-sans text-xs font-medium text-ink" onClick={() => navigate(`/admin/orders/${o.order_number}`)}>{o.order_number}</p>
                      <p className="font-sans text-xs text-ink mt-0.5">{o.customer?.name} · {o.customer?.mobile}</p>
                      <p className="font-sans text-[11px] text-ink-soft">{isTrash ? `Deleted ${formatDateTime(o.deleted_at)}` : formatDateTime(o.created_at)}</p>
                    </div>
                  </div>
                  <p className="font-serif text-sm text-terracotta">{o.total_pending ? "TBC" : inr(o.total)}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2"><Badge meta={orderStatusMeta(o.order_status)} /><Badge meta={paymentStatusMeta(o.payment_status)} /></div>
                {isTrash && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => doRestore(o.order_number)} data-testid={`restore-${o.order_number}`} className="flex-1 inline-flex justify-center items-center gap-1 text-[11px] uppercase tracking-[0.1em] text-emerald-700 border border-emerald-300 rounded-full py-1.5"><RotateCcw size={12} /> Restore</button>
                    <button onClick={() => { setPermAck(false); setPermTarget(o); }} data-testid={`perm-${o.order_number}`} className="flex-1 inline-flex justify-center items-center gap-1 text-[11px] uppercase tracking-[0.1em] text-red-600 border border-red-300 rounded-full py-1.5"><Trash2 size={12} /> Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bulk delete confirm */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="bg-ivory">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Move {selected.size} order{selected.size === 1 ? "" : "s"} to Trash?</DialogTitle></DialogHeader>
          <p className="font-sans text-sm text-ink-soft">The selected order{selected.size === 1 ? "" : "s"} will be hidden from the dashboard and excluded from counts and revenue. Nothing is permanently removed — you can restore from Trash anytime.</p>
          {selected.size > 1 && (
            <label className="flex items-center gap-2 mt-2 font-sans text-sm text-ink" data-testid="bulk-ack">
              <Check checked={bulkAck} onChange={(e) => setBulkAck(e.target.checked)} />
              I understand {selected.size} orders will be moved to Trash.
            </label>
          )}
          <DialogFooter>
            <button onClick={() => setBulkOpen(false)} className="px-3 py-2 text-xs font-sans uppercase tracking-[0.08em] rounded-full border border-ink/20 text-ink">Cancel</button>
            <button onClick={doBulkDelete} disabled={busy || (selected.size > 1 && !bulkAck)} data-testid="confirm-bulk-delete"
                    className="px-3 py-2 text-xs font-sans uppercase tracking-[0.08em] rounded-full bg-red-600 text-white border border-red-600 hover:bg-red-700 disabled:opacity-40">Move to Trash</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent delete confirm */}
      <Dialog open={!!permTarget} onOpenChange={(o) => { if (!o) setPermTarget(null); }}>
        <DialogContent className="bg-ivory">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Permanently delete this order?</DialogTitle></DialogHeader>
          <p className="font-sans text-sm text-ink-soft">
            Order <b className="text-ink">{permTarget?.order_number}</b> will be erased forever. This cannot be undone. Orders with a verified payment or refund record cannot be permanently deleted (retained for tax/accounting).
          </p>
          <label className="flex items-center gap-2 mt-2 font-sans text-sm text-ink" data-testid="perm-ack">
            <Check checked={permAck} onChange={(e) => setPermAck(e.target.checked)} />
            I understand this is permanent and irreversible.
          </label>
          <DialogFooter>
            <button onClick={() => setPermTarget(null)} className="px-3 py-2 text-xs font-sans uppercase tracking-[0.08em] rounded-full border border-ink/20 text-ink">Cancel</button>
            <button onClick={doPermanent} disabled={busy || !permAck} data-testid="confirm-permanent-delete"
                    className="px-3 py-2 text-xs font-sans uppercase tracking-[0.08em] rounded-full bg-red-600 text-white border border-red-600 hover:bg-red-700 disabled:opacity-40">Delete forever</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
