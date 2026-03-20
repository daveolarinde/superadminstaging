import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { RefreshCw, CreditCard, CheckCircle, Snowflake, XCircle, ShieldOff } from "lucide-react";

const baseURL = import.meta.env.VITE_STAGE_API_URL;

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    active:     { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    freeze:     { cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",          dot: "bg-blue-500"    },
    terminated: { cls: "bg-red-50 text-red-600 ring-1 ring-red-200",             dot: "bg-red-500"     },
    blocked:    { cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",          dot: "bg-gray-400"    },
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

// ── Action dropdown ───────────────────────────────────────────────────────────
const ActionDropdown = ({ card, onAction, loading }) => {
  const s = String(card.status).toLowerCase();
  const options = [
    s === "active"  && { value: "freeze",    label: "❄️ Freeze"    },
    s === "freeze"  && { value: "unfreeze",  label: "▶️ Unfreeze"  },
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function VirtualCards() {
  const [cards, setCards]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
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
    totalCards:      cards.length,
    activeCards:     cards.filter((c) => String(c.status).toLowerCase() === "active").length,
    freezeCards:     cards.filter((c) => String(c.status).toLowerCase() === "freeze").length,
    terminatedCards: cards.filter((c) => String(c.status).toLowerCase() === "terminated").length,
    blockedCards:    cards.filter((c) => String(c.status).toLowerCase() === "blocked").length,
  }), [cards]);

  const handleAction = async (action, card) => {
    if (!card?.id) return alert("Invalid card selected");
    const endpointMap = {
      freeze:    "/superAdmin/card/freeze",
      unfreeze:  "/superAdmin/card/unfreeze",
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
    { label: "Total Cards",      value: summary.totalCards,      icon: <CreditCard size={17} />,  bgColor: "bg-indigo-50",  textColor: "text-indigo-600"  },
    { label: "Active",           value: summary.activeCards,     icon: <CheckCircle size={17} />, bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
    { label: "Frozen",           value: summary.freezeCards,     icon: <Snowflake size={17} />,   bgColor: "bg-blue-50",    textColor: "text-blue-600"    },
    { label: "Terminated",       value: summary.terminatedCards, icon: <XCircle size={17} />,     bgColor: "bg-red-50",     textColor: "text-red-500"     },
    { label: "Blocked",          value: summary.blockedCards,    icon: <ShieldOff size={17} />,   bgColor: "bg-gray-100",   textColor: "text-gray-500"    },
  ];

  const filterOptions = [
    { value: "",           label: "All Status"  },
    { value: "active",     label: "Active"      },
    { value: "freeze",     label: "Frozen"      },
    { value: "terminated", label: "Terminated"  },
    { value: "blocked",    label: "Blocked"     },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Virtual Cards</h1>
          <p className="text-xs text-gray-400 mt-0.5">{summary.totalCards} cards total</p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          >
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={() => fetchCards(true)}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-sm transition ${
              refreshing
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
            }`}
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
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

                    {/* Card holder */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                          {card.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">{card.name}</span>
                      </div>
                    </td>

                    {/* Card number */}
                    <td className="px-5 py-4 font-mono text-xs text-gray-500 tracking-widest">
                      {card.masked}
                    </td>

                    {/* Currency */}
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                        {card.currency}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="px-5 py-4 font-semibold text-gray-800">
                      {card.currency === "USD" ? "$" : "₦"}
                      {parseFloat(card.balance || 0).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={card.status} />
                    </td>

                    {/* Brand */}
                    <td className="px-5 py-4 text-gray-500 capitalize text-xs">{card.brand}</td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <ActionDropdown card={card} onAction={handleAction} loading={refreshing} />
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