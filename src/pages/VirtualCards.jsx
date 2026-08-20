import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw, CreditCard, CheckCircle, Snowflake, XCircle,
  ShieldOff, Wallet, ArrowUpCircle, ArrowDownCircle,
  AlertTriangle, X, CheckCircle2,
} from "lucide-react";

const baseURL = import.meta.env.VITE_API_URL;

const CURRENCY_SYMBOLS = { NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵" };
const sym = (code) => CURRENCY_SYMBOLS[code] ?? code ?? "";
const fmt = (amount, currency) =>
  `${sym(currency)}${parseFloat(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    active: { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    freeze: { cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", dot: "bg-blue-500" },
    terminated: { cls: "bg-red-50 text-red-600 ring-1 ring-red-200", dot: "bg-red-500" },
    blocked: { cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-200", dot: "bg-gray-400" },
  };
  const s = String(status).toLowerCase();
  const style = map[s] || map.blocked;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {s}
    </span>
  );
};

// ── Summary card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, icon, bgColor, textColor }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bgColor}`}>
      <span className={textColor}>{icon}</span>
    </div>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{(value ?? 0).toLocaleString()}</p>
  </div>
);

// ── Action dropdown (freeze / unfreeze / terminate) ───────────────────────────
const ActionDropdown = ({ card, onAction, loading }) => {
  const s = String(card.status).toLowerCase();
  const options = [
    s === "active" && { value: "freeze", label: "❄️ Freeze" },
    s === "freeze" && { value: "unfreeze", label: "▶️ Unfreeze" },
    s !== "terminated" && { value: "terminate", label: "🚫 Terminate" },
  ].filter(Boolean);

  if (options.length === 0) return <span className="text-xs text-gray-400">—</span>;

  return (
    <select
      className="border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer disabled:opacity-50"
      defaultValue=""
      disabled={loading}
      onChange={(e) => { if (e.target.value) onAction(e.target.value, card); }}
    >
      <option value="">Action</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
};

// ── Card Balance Modal ────────────────────────────────────────────────────────
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
        `${baseURL}/superAdmin/users/adjust-card-balance`,
        {
          userId: card.userId,
          cardId: card.card_id || card.id,
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

        {/* Header */}
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
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Success state */}
        {result ? (
          <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={26} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Adjustment Successful</h3>
              <p className="text-sm text-gray-500 mt-0.5">Card balance updated and transaction recorded</p>
            </div>

            {/* Before / After */}
            <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl divide-y divide-gray-100">
              {[
                { label: "Old Balance", value: fmt(result.oldBalance, result.currency), },
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

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* Current balance chip */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
              <span className="text-xs text-gray-500">Current Balance</span>
              <span className="text-sm font-bold text-gray-800">{fmt(card.balance, card.currency)}</span>
            </div>

            {/* Action type */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "credit", label: "Credit", desc: "Add funds", icon: <ArrowUpCircle size={14} className="text-emerald-500 shrink-0" /> },
                { value: "debit", label: "Debit", desc: "Deduct funds", icon: <ArrowDownCircle size={14} className="text-red-500 shrink-0" /> },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setActionType(opt.value)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition ${actionType === opt.value
                      ? opt.value === "credit"
                        ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                        : "border-red-400 bg-red-50 ring-2 ring-red-100"
                      : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                >
                  {opt.icon}
                  <div>
                    <p className={`text-sm font-semibold ${actionType === opt.value
                        ? opt.value === "credit" ? "text-emerald-700" : "text-red-700"
                        : "text-gray-700"
                      }`}>{opt.label}</p>
                    <p className="text-[10px] text-gray-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-gray-400">
                  {sym(card.currency)}
                </span>
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

            {/* Info */}
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

            {/* Description */}
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

            {/* Debit warning */}
            {actionType === "debit" && amount && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  You're about to <strong>debit {fmt(amount, card.currency)}</strong> from this card. This cannot be undone.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Footer buttons */}
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
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${actionType === "debit"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
              >
                {submitting ? (
                  <><svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Processing…</>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function VirtualCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [balanceCard, setBalanceCard] = useState(null); // card to adjust

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchCards = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await axios.get(`${baseURL}/superAdmin/cards`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        params,
      });
      setCards(res.data?.data || []);
    } catch (err) {
      console.error("Fetch cards error:", err);
      setError("Failed to fetch cards. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (baseURL && token) fetchCards(); }, [statusFilter]);

  const summary = useMemo(() => ({
    totalCards: cards.length,
    activeCards: cards.filter((c) => String(c.status).toLowerCase() === "active").length,
    freezeCards: cards.filter((c) => String(c.status).toLowerCase() === "freeze").length,
    terminatedCards: cards.filter((c) => String(c.status).toLowerCase() === "terminated").length,
    blockedCards: cards.filter((c) => String(c.status).toLowerCase() === "blocked").length,
  }), [cards]);

  const handleAction = async (action, card) => {
    if (!card?.id) return alert("Invalid card selected");
    const endpointMap = {
      freeze: "/superAdmin/card/freeze",
      unfreeze: "/superAdmin/card/unfreeze",
      terminate: "/superAdmin/card/terminate",
    };
    try {
      setRefreshing(true);
      await axios.post(`${baseURL}${endpointMap[action]}`, { cardId: card.id }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      fetchCards(true);
    } catch (err) {
      console.error(`Failed to ${action} card:`, err);
      alert(`Failed to ${action} card`);
    } finally {
      setRefreshing(false);
    }
  };

  const summaryCards = [
    { label: "Total Cards", value: summary.totalCards, icon: <CreditCard size={17} />, bgColor: "bg-indigo-50", textColor: "text-indigo-600" },
    { label: "Active", value: summary.activeCards, icon: <CheckCircle size={17} />, bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
    { label: "Frozen", value: summary.freezeCards, icon: <Snowflake size={17} />, bgColor: "bg-blue-50", textColor: "text-blue-600" },
    { label: "Terminated", value: summary.terminatedCards, icon: <XCircle size={17} />, bgColor: "bg-red-50", textColor: "text-red-500" },
    { label: "Blocked", value: summary.blockedCards, icon: <ShieldOff size={17} />, bgColor: "bg-gray-100", textColor: "text-gray-500" },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* Card balance modal */}
      {balanceCard && (
        <CardBalanceModal
          card={balanceCard}
          onClose={() => { setBalanceCard(null); fetchCards(true); }}
        />
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Virtual Cards</h1>
          <p className="text-xs text-gray-400 mt-0.5">{summary.totalCards} cards total</p>
        </div>
        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          >
            {[
              { value: "", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "freeze", label: "Frozen" },
              { value: "terminated", label: "Terminated" },
              { value: "blocked", label: "Blocked" },
            ].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button
            onClick={() => fetchCards(true)}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-sm transition ${refreshing
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              }`}
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => <SummaryCard key={card.label} {...card} />)}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-sm text-gray-400">Loading cards…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-2xl">⚠️</p>
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button onClick={() => fetchCards()} className="mt-2 px-4 py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
              Try again
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-3xl">💳</p>
            <p className="text-sm font-medium text-gray-500">No cards found</p>
            <p className="text-xs text-gray-400">Try changing the status filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Card Holder", "Card Number", "Currency", "Balance", "Status", "Brand", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50/80 transition-colors group">

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                          {card.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">{card.name}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-gray-500 tracking-widest">
                      {card.masked}
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                        {card.currency}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-800">
                      {fmt(card.balance, card.currency)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={card.status} />
                    </td>

                    <td className="px-5 py-4 text-gray-500 capitalize text-xs">{card.brand}</td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <ActionDropdown card={card} onAction={handleAction} loading={refreshing} />

                        {/* ── Adjust Card Balance button ── */}
                        <button
                          onClick={() => setBalanceCard(card)}
                          disabled={String(card.status).toLowerCase() === "terminated"}
                          title="Credit or debit card balance"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          <Wallet size={11} />
                          Adjust Balance
                        </button>

                        <button
                          onClick={() => navigate(`/admin/virtual-cards/${card.id}`)}
                          className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition whitespace-nowrap"
                        >
                          View →
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}