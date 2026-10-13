import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Download, X, ChevronRight, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
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

export default function AdminOrders({ orders, reload }) {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [q, setQ] = useState("");

  // Summary respects the DATE RANGE only (an at-a-glance overview).
  const dateScoped = useMemo(
    () => orders.filter((o) => withinRange(o.created_at, from, to)),
    [orders, from, to]
  );

  // The table + export respect ALL filters.
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

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCSV(`amya-orders-${stamp}.csv`, ordersToCSV(rows));
  };

  return (
    <div data-testid="orders-panel" className="space-y-7">
      {/* ---- Summary ---- */}
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
          <IndianRupee size={12} /> Revenue counts only verified online payments and collected COD, excluding cancelled, pending, failed and refunded orders.
        </p>
      </div>

      {/* ---- Filters ---- */}
      <div className="bg-ivory-warm border border-ink/10 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} data-testid="order-search"
                 placeholder="Search order ID, name or phone" className="h-9 pl-9" />
        </div>
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
          <button onClick={resetFilters} data-testid="reset-filters" className="inline-flex items-center gap-1 font-sans text-xs text-ink-soft hover:text-terracotta">
            <X size={13} /> Clear
          </button>
        )}
        <button onClick={exportCsv} data-testid="export-csv"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-sans uppercase tracking-[0.1em] bg-terracotta text-ivory rounded-full hover:bg-terracotta-deep transition-colors ml-auto">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* ---- Results ---- */}
      <p className="font-sans text-xs text-ink-soft" data-testid="orders-result-count">
        Showing {rows.length} of {dateScoped.length} order{dateScoped.length === 1 ? "" : "s"}
      </p>

      {rows.length === 0 ? (
        <p className="font-serif text-xl text-ink/50 py-10 text-center">No orders match these filters.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto border border-ink/10 rounded-xl bg-white">
            <table className="w-full text-left">
              <thead className="bg-ivory-warm">
                <tr className="font-sans text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
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
                      onClick={() => navigate(`/admin/orders/${o.order_number}`)}
                      className="border-t border-ink/8 hover:bg-ivory-warm/60 cursor-pointer align-top">
                    <td className="px-4 py-3 font-sans text-xs font-medium text-ink">{o.order_number}</td>
                    <td className="px-4 py-3 font-sans text-xs text-ink-soft whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                    <td className="px-4 py-3 font-sans text-xs text-ink">
                      <span className="block">{o.customer?.name}</span>
                      <span className="block text-ink-soft">{o.customer?.mobile}</span>
                    </td>
                    <td className="px-4 py-3 font-sans text-xs text-ink-soft max-w-[220px]">{itemsSummary(o)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-sans text-[10px] text-ink-soft">{paymentMethodLabel(o.payment_method)}</span>
                        <Badge meta={paymentStatusMeta(o.payment_status)} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge meta={orderStatusMeta(o.order_status)} /></td>
                    <td className="px-4 py-3 font-serif text-sm text-terracotta text-right whitespace-nowrap">{o.total_pending ? "TBC" : inr(o.total)}</td>
                    <td className="px-4 py-3 text-ink-soft"><ChevronRight size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rows.map((o) => (
              <button key={o.order_number} data-testid={`order-card-${o.order_number}`}
                      onClick={() => navigate(`/admin/orders/${o.order_number}`)}
                      className="w-full text-left bg-white border border-ink/10 rounded-xl p-4 active:bg-ivory-warm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-sans text-xs font-medium text-ink">{o.order_number}</p>
                  <p className="font-serif text-sm text-terracotta">{o.total_pending ? "TBC" : inr(o.total)}</p>
                </div>
                <p className="font-sans text-xs text-ink mt-1">{o.customer?.name} · {o.customer?.mobile}</p>
                <p className="font-sans text-[11px] text-ink-soft mt-0.5">{formatDateTime(o.created_at)}</p>
                <p className="font-sans text-[11px] text-ink-soft mt-1">{itemsSummary(o)}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge meta={orderStatusMeta(o.order_status)} />
                  <Badge meta={paymentStatusMeta(o.payment_status)} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
