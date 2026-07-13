import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Eye, EyeOff, Copy, Check, Snowflake, Play, Ban, Wallet,
  ArrowUpCircle, ArrowDownCircle, AlertTriangle, X, CheckCircle2,
  RefreshCw, Receipt, TrendingUp, TrendingDown, Hash,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CURRENCY_SYMBOLS = { NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵" };
const sym = (code) => CURRENCY_SYMBOLS[code] ?? code ?? "";
const fmt = (amount, currency) =>
  `${sym(currency)}${parseFloat(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

// Brand → gradient, so the card face actually looks like its network
const BRAND_STYLES = {
  visa:       "from-indigo-600 via-indigo-700 to-blue-900",
  mastercard: "from-orange-500 via-red-600 to-rose-800",
  verve:      "from-emerald-600 via-teal-700 to-slate-900",
};
const brandGradient = (brand) => BRAND_STYLES[String(brand || "").toLowerCase()] || "from-gray-700 via-gray-800 to-gray-950";

const STATUS_STYLES = {
  active:     "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/40",
  freeze:     "bg-blue-400/20 text-blue-200 ring-1 ring-blue-300/40",
  terminated: "bg-red-400/20 text-red-200 ring-1 ring-red-300/40",
  blocked:    "bg-gray-300/20 text-gray-200 ring-1 ring-gray-300/40",
};

// ── Card face (visual card design) ────────────────────────────────────────────
const CardFace = ({ card }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const s = String(card.status || "").toLowerCase();

  const displayNumber = revealed
    ? (card.number || "").replace(/(.{4})/g, "$1 ").trim()
    : (card.masked || "•••• •••• •••• ••••");

  const handleCopy = async () => {
    if (!card.number) return;
    try {
      await navigator.clipboard.writeText(card.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore silently */
    }
  };

  return (
    <div className={`relative w-full max-w-md rounded-3xl bg-gradient-to-br ${brandGradient(card.brand)} p-6 text-white shadow-xl overflow-hidden`}>
      {/* Decorative glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-14 -left-10 w-48 h-48 rounded-full bg-black/20 blur-2xl" />

      <div className="relative flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1">Virtual Card</p>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_STYLES[s] || STATUS_STYLES.blocked}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {s || "unknown"}
          </span>
        </div>
        <p className="text-sm font-bold uppercase tracking-wider text-white/90">{card.brand}</p>
      </div>

      <div className="relative flex items-center gap-2.5 mb-6">
        <p className="font-mono text-xl tracking-[0.15em] select-all">{displayNumber}</p>
        <button
          onClick={() => setRevealed((v) => !v)}
          title={revealed ? "Hide number" : "Reveal number"}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition shrink-0"
        >
          {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        {revealed && (
          <button
            onClick={handleCopy}
            title="Copy full number"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition shrink-0"
          >
            {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
          </button>
        )}
      </div>

      <div className="relative flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Card Holder</p>
          <p className="text-sm font-semibold tracking-wide uppercase">{card.name}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Expires</p>
          <p className="text-sm font-semibold tracking-wide">{card.expiry}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">CVV</p>
          <p className="text-sm font-semibold tracking-wide">{revealed ? card.ccv : "•••"}</p>
        </div>
      </div>
    </div>
  );
};

// ── Detail row (for the secondary info panel) ─────────────────────────────────
const Detail = ({ label, value, className = "" }) => (
  <div className="flex flex-col space-y-1">
    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-semibold text-gray-800 ${className}`}>{value || "—"}</span>
  </div>
);

// ── Action buttons (freeze / unfreeze / terminate / adjust balance) ───────────
const CardActions = ({ card, onAction, actionLoading, onAdjustBalance }) => {
  const s = String(card.status || "").toLowerCase();
  const isTerminated = s === "terminated";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {s === "active" && (
        <button
          onClick={() => onAction("freeze")}
          disabled={actionLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition"
        >
          <Snowflake size={13} /> Freeze
        </button>
      )}
      {s === "freeze" && (
        <button
          onClick={() => onAction("unfreeze")}
          disabled={actionLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition"
        >
          <Play size={13} /> Unfreeze
        </button>
      )}
      {!isTerminated && (
        <button
          onClick={() => onAction("terminate")}
          disabled={actionLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
        >
          <Ban size={13} /> Terminate
        </button>
      )}
      <button
        onClick={onAdjustBalance}
        disabled={isTerminated}
        title={isTerminated ? "Cannot adjust a terminated card" : "Credit or debit card balance"}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <Wallet size={13} /> Adjust Balance
      </button>
    </div>
  );
};

// ── Card Balance Modal (credit / debit) ───────────────────────────────────────
const CardBalanceModal = ({ card, onClose }) => {
  const [actionType, setActionType] = useState("credit");
  const [amount, setAmount] = useState("");
  const [info, setInfo] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return setError("Enter a valid amount.");
    if (!info.trim()) return setError("Info is required.");
    setError("");
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/superAdmin/users/adjust-card-balance`,
        {
          userId: card.userId,
          cardId: card.id,
          amount: parseFloat(amount),
          actionType,
          info: info.trim(),
          description: description.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to adjust card balance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Wallet size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 leading-tight">Adjust Card Balance</h2>
              <p className="text-xs text-gray-400">{card.name} · {card.masked} · {card.currency}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <X size={15} />
          </button>
        </div>

        {result ? (
          <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={26} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Adjustment Successful</h3>
              <p className="text-sm text-gray-500 mt-0.5">Card balance updated and transaction recorded</p>
            </div>
            <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl divide-y divide-gray-100">
              {[
                { label: "Old Balance", value: fmt(result.oldBalance, result.currency) },
                { label: "New Balance", value: fmt(result.newBalance, result.currency), highlight: true },
                { label: "Transaction ID", value: result.transactionId, mono: true },
                { label: "Reference", value: result.referenceId, mono: true },
              ].map(({ label, value, highlight, mono }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-sm font-semibold ${highlight ? "text-emerald-600" : "text-gray-800"} ${mono ? "font-mono text-xs" : ""}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-xs text-gray-500">Current Balance</span>
              <span className="text-sm font-bold text-gray-800">{fmt(card.balance, card.currency)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "credit", label: "Credit", desc: "Add funds", icon: <ArrowUpCircle size={14} className="text-emerald-500 shrink-0" /> },
                { value: "debit", label: "Debit", desc: "Deduct funds", icon: <ArrowDownCircle size={14} className="text-red-500 shrink-0" /> },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setActionType(opt.value)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition ${
                    actionType === opt.value
                      ? opt.value === "credit"
                        ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                        : "border-red-400 bg-red-50 ring-2 ring-red-100"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {opt.icon}
                  <div>
                    <p className={`text-sm font-semibold ${actionType === opt.value ? (opt.value === "credit" ? "text-emerald-700" : "text-red-700") : "text-gray-700"}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-gray-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-gray-400">{sym(card.currency)}</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Info <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                placeholder="e.g. Refund for card decline transaction"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Description <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Compensating ADJ-TX-1234 card decline"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition resize-none"
              />
            </div>

            {actionType === "debit" && amount && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  You're about to <strong>debit {fmt(amount, card.currency)}</strong> from this card. This cannot be undone.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <X size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  actionType === "debit" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing…
                  </>
                ) : (
                  <>
                    {actionType === "debit" ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                    {actionType === "debit" ? "Debit Card" : "Credit Card"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ── Transaction status badge ───────────────────────────────────────────────────
const TxStatusBadge = ({ status }) => {
  const s = String(status || "").toLowerCase();
  const map = {
    success:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    pending:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    failed:    "bg-red-50 text-red-600 ring-1 ring-red-200",
    reversed:  "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${map[s] || "bg-gray-100 text-gray-500 ring-1 ring-gray-200"}`}>
      {s || "—"}
    </span>
  );
};

// ── Transaction summary strip ─────────────────────────────────────────────────
const TxSummary = ({ transactions, currency }) => {
  const stats = useMemo(() => {
    let credit = 0, debit = 0;
    for (const t of transactions) {
      const amt = parseFloat(t.amount || 0);
      const type = String(t.type || t.transactionType || "").toLowerCase();
      if (type.includes("credit") || type === "funding" || type === "deposit") credit += amt;
      else if (type.includes("debit") || type === "withdrawal" || type === "spend") debit += amt;
    }
    return { count: transactions.length, credit, debit, net: credit - debit };
  }, [transactions]);

  const cards = [
    { label: "Transactions", value: stats.count.toLocaleString(), icon: <Receipt size={15} />, bg: "bg-indigo-50", fg: "text-indigo-600" },
    { label: "Total Credit", value: fmt(stats.credit, currency), icon: <TrendingUp size={15} />, bg: "bg-emerald-50", fg: "text-emerald-600" },
    { label: "Total Debit", value: fmt(stats.debit, currency), icon: <TrendingDown size={15} />, bg: "bg-red-50", fg: "text-red-500" },
    { label: "Net Movement", value: fmt(stats.net, currency), icon: <Hash size={15} />, bg: "bg-blue-50", fg: "text-blue-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${c.bg}`}>
            <span className={c.fg}>{c.icon}</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{c.label}</p>
          <p className="text-lg font-bold text-gray-900">{c.value}</p>
        </div>
      ))}
    </div>
  );
};

// ── Card transactions table ───────────────────────────────────────────────────
const CardTransactionsTable = ({ card }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");

  const fetchTransactions = async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE_URL}/superAdmin/transactions`, {
        params: { transactionClass: "card" },
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      const all = res.data?.data ?? res.data?.transactions ?? [];

      // Backend shape (confirmed): each transaction has `card_id` (snake_case),
      // matched against this card's `card_id` — NOT `cardId`/`id`. Falling back
      // to the other variants too in case some records are shaped differently.
      const scoped = all.filter((t) => {
        const tCardId = t.card_id ?? t.cardId ?? t.card?.id;
        return tCardId === card.card_id || tCardId === card.id;
      });

      setTransactions(scoped);
    } catch (err) {
      console.error("Failed to fetch card transactions:", err);
      setError("Failed to fetch transactions for this card.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (card?.id) fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id]);

  return (
    <div className="space-y-4">
      <TxSummary transactions={transactions} currency={card.currency} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Card Transactions</h3>
          <button
            onClick={() => fetchTransactions(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-xs text-gray-400">Loading transactions…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button onClick={() => fetchTransactions()} className="text-xs text-red-600 hover:underline">
              Try again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-1">
            <p className="text-2xl">🧾</p>
            <p className="text-sm font-medium text-gray-500">No transactions found for this card</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Date", "Type", "Amount", "Status", "Reference", "Description"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t) => {
                  const type = String(t.type || t.transactionType || "").toLowerCase();
                  const isCredit = type.includes("credit") || type === "funding" || type === "deposit";
                  return (
                    <tr key={t.id || t.reference} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold capitalize ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
                          {isCredit ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                          {type || "—"}
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 font-semibold ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
                        {isCredit ? "+" : "-"}{fmt(t.amount, t.currency || card.currency)}
                      </td>
                      <td className="px-5 py-3.5"><TxStatusBadge status={t.status} /></td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{t.trans_id || t.reference || t.referenceId || "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 max-w-xs truncate">{t.description || t.info || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const ViewCardDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);

  const token = localStorage.getItem("token");

  const fetchCard = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/superAdmin/cards`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const foundCard = res.data.data.find((c) => c.id === id);
      setCard(foundCard);
    } catch (error) {
      console.error("Error fetching card details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAction = async (action) => {
    if (!card?.id) return;
    const endpointMap = {
      freeze: "/superAdmin/card/freeze",
      unfreeze: "/superAdmin/card/unfreeze",
      terminate: "/superAdmin/card/terminate",
    };
    try {
      setActionLoading(true);
      await axios.post(`${API_BASE_URL}${endpointMap[action]}`, { cardId: card.id }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      await fetchCard();
    } catch (err) {
      console.error(`Failed to ${action} card:`, err);
      alert(`Failed to ${action} card`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm text-gray-400">Loading card details…</p>
      </div>
    );

  if (!card)
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-2">
        <p className="text-2xl">💳</p>
        <p className="text-sm font-medium text-gray-600">Card not found.</p>
        <button onClick={() => navigate(-1)} className="text-xs text-blue-600 hover:underline mt-1">
          ← Go back
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {balanceModalOpen && (
        <CardBalanceModal card={card} onClose={() => { setBalanceModalOpen(false); fetchCard(); }} />
      )}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 mb-6 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Card visual + actions ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <CardFace card={card} />

          <div className="flex-1 w-full space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{card.name}'s Card</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Manage status and balance for this card</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{fmt(card.balance, card.currency)}</p>
                </div>
              </div>

              <CardActions
                card={card}
                onAction={handleAction}
                actionLoading={actionLoading}
                onAdjustBalance={() => setBalanceModalOpen(true)}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 gap-y-5 gap-x-6">
              <Detail label="Card ID" value={card.card_id} />
              <Detail label="Customer ID" value={card.customer_id || "N/A"} />
              <Detail label="Currency" value={card.currency} />
              <Detail label="Previous Balance" value={fmt(card.prev_balance, card.currency)} />
              <Detail label="Billing City" value={card.billing_city || "N/A"} />
              <Detail label="Billing State" value={card.billing_state || "N/A"} />
              <Detail label="Billing Postal Code" value={card.billing_postal_code || "N/A"} />
              <Detail label="Created At" value={card.createdAt ? new Date(card.createdAt).toLocaleString() : "N/A"} />
            </div>
          </div>
        </div>

        {/* ── Transactions ── */}
        <CardTransactionsTable card={card} />
      </div>
    </div>
  );
};

export default ViewCardDetails;