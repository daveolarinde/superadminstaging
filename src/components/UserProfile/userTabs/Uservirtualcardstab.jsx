import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { RefreshCw, CreditCard, CheckCircle, Snowflake, XCircle, ShieldOff } from "lucide-react";

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    active:     { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    freeze:     { cls: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",          dot: "bg-blue-500"    },
    terminated: { cls: "bg-red-50 text-red-600 ring-1 ring-red-200",             dot: "bg-red-500"     },
    blocked:    { cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",          dot: "bg-gray-400"    },
  };
  const s = String(status || "").toLowerCase();
  const style = map[s] || map.blocked;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {s || "unknown"}
    </span>
  );
};

// ── Summary Card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, icon, bgColor, textColor }) => (
  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 ${bgColor}`}>
      <span className={textColor}>{icon}</span>
    </div>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{(value ?? 0).toLocaleString()}</p>
  </div>
);

// ── Action Dropdown ───────────────────────────────────────────────────────────
const ActionDropdown = ({ card, onAction, loading }) => {
  const s = String(card.status || "").toLowerCase();
  const options = [
    s === "active" && { value: "freeze",    label: "❄️ Freeze"    },
    s === "freeze" && { value: "unfreeze",  label: "▶️ Unfreeze"  },
    s !== "terminated" && { value: "terminate", label: "🚫 Terminate" },
  ].filter(Boolean);

  if (options.length === 0) return <span className="text-xs text-gray-300">—</span>;

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

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserVirtualCardsTab({ userId, baseURL, authHeader }) {
  const navigate = useNavigate();

  const [cards, setCards]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [refreshing, setRefreshing]     = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCards = async (showRefresh = false) => {
    if (!userId) return;
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const params = { userId, ...(statusFilter ? { status: statusFilter } : {}) };
      const res = await axios.get(`${baseURL}/superAdmin/cards`, {
        headers: authHeader,
        params,
      });
      setCards(res.data?.data || []);
    } catch (err) {
      console.error("Fetch user cards error:", err);
      setError("Failed to fetch cards. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [userId, statusFilter]);

  const summary = useMemo(() => ({
    total:      cards.length,
    active:     cards.filter((c) => String(c.status).toLowerCase() === "active").length,
    frozen:     cards.filter((c) => String(c.status).toLowerCase() === "freeze").length,
    terminated: cards.filter((c) => String(c.status).toLowerCase() === "terminated").length,
    blocked:    cards.filter((c) => String(c.status).toLowerCase() === "blocked").length,
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
      await axios.post(
        `${baseURL}${endpointMap[action]}`,
        { cardId: card.id },
        { headers: { ...authHeader, "Content-Type": "application/json" } }
      );
      fetchCards(true);
    } catch (err) {
      console.error(`Failed to ${action} card:`, err);
      alert(`Failed to ${action} card`);
    } finally {
      setRefreshing(false);
    }
  };

 

  const filterOptions = [
    { value: "",           label: "All Status"  },
    { value: "active",     label: "Active"      },
    { value: "freeze",     label: "Frozen"      },
    { value: "terminated", label: "Terminated"  },
    { value: "blocked",    label: "Blocked"     },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Virtual Cards</h3>
          <p className="text-xs text-gray-400 mt-0.5">{summary.total} card{summary.total !== 1 ? "s" : ""} found</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          >
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => fetchCards(true)}
            disabled={refreshing}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border shadow-sm transition ${
              refreshing
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
            }`}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      

      {/* ── Table ── */}
      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-sm text-gray-400">Loading cards…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-2xl">⚠️</p>
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button
              onClick={() => fetchCards()}
              className="mt-1 px-4 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              Try again
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-3xl">💳</p>
            <p className="text-sm font-medium text-gray-500">No cards found</p>
            <p className="text-xs text-gray-400">
              {statusFilter ? "Try a different status filter" : "This user has no virtual cards"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Card Holder", "Card Number", "Currency", "Balance", "Status", "Brand", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-blue-50/20 transition-colors group">

                    {/* Card Holder */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                          {card.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-semibold text-gray-800">{card.name || "—"}</span>
                      </div>
                    </td>

                    {/* Card Number */}
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500 tracking-widest">
                      {card.masked || "•••• •••• ••••"}
                    </td>

                    {/* Currency */}
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                        {card.currency || "—"}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="px-4 py-3.5 font-semibold text-gray-800">
                      {card.currency === "USD" ? "$" : "₦"}
                      {parseFloat(card.balance || 0).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={card.status} />
                    </td>

                    {/* Brand */}
                    <td className="px-4 py-3.5 text-gray-500 capitalize text-xs">
                      {card.brand || "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <ActionDropdown card={card} onAction={handleAction} loading={refreshing} />
                        <button
                          onClick={() => navigate(`/admin/virtual-cards/${card.id}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
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