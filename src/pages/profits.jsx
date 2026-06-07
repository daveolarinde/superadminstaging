import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_STAGE_API_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS = { NGN: "₦", USD: "$", GHS: "₵", GBP: "£", EUR: "€" };

const fmt = (amount, currency = "NGN") =>
  `${CURRENCY_SYMBOLS[currency] ?? currency + " "}${parseFloat(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const initials = (first, last) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "??";

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];
const avatarColor = (id = "") =>
  AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

// ── Sub-components ────────────────────────────────────────────────────────────
const Badge = ({ value, map }) => {
  const cfg = map[value] ?? { color: "bg-gray-100 text-gray-600", label: value ?? "N/A" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const MARGIN_STATUS_MAP = {
  profit:     { color: "bg-emerald-100 text-emerald-700", label: "Profit"    },
  loss:       { color: "bg-red-100 text-red-600",         label: "Loss"      },
  break_even: { color: "bg-yellow-100 text-yellow-700",   label: "Break Even" },
};

const TXN_STATUS_MAP = {
  success: { color: "bg-green-100 text-green-700",   label: "Success" },
  failed:  { color: "bg-red-100 text-red-600",       label: "Failed"  },
  pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
};

// Currency summary block — groups all stats for one currency
const CurrencySummaryBlock = ({ currency, stats }) => {
  const metrics = [
    { label: "Net Earnings",    value: fmt(stats.netEarnings,   currency), highlight: true  },
    { label: "Monthly Profit",  value: fmt(stats.monthlyProfit, currency) },
    { label: "Weekly Profit",   value: fmt(stats.weeklyProfit,  currency) },
    { label: "Daily Profit",    value: fmt(stats.dailyProfit,   currency) },
    { label: "Total Loss",      value: fmt(stats.totalLoss,     currency), negative: stats.totalLoss > 0 },
    { label: "Transactions",    value: stats.totalTransactions             },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* currency header strip */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">{currency}</span>
        <span className="text-xs text-gray-400">
          {CURRENCY_SYMBOLS[currency] ?? ""}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-50">
        {metrics.map(({ label, value, highlight, negative }) => (
          <div key={label} className="px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p
              className={`text-sm font-semibold ${
                highlight
                  ? "text-emerald-600"
                  : negative
                  ? "text-red-500"
                  : "text-gray-800"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Profits = () => {
  const navigate = useNavigate();

  const [summary, setSummary]                 = useState(null);
  const [profits, setProfits]                 = useState([]);
  const [filteredProfits, setFilteredProfits] = useState([]);
  const [totalProfits, setTotalProfits]       = useState({});
  const [pagination, setPagination]           = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState("");
  const [searchTerm, setSearchTerm]           = useState("");
  const [showFilters, setShowFilters]         = useState(false);

  const [filters, setFilters] = useState({
    currency:  "",
    date:      "",
    startDate: "",
    endDate:   "",
    userId:    "",
  });

  const token = localStorage.getItem("token");

  // count active filters for the badge
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchProfits = useCallback(
    async (page = 1) => {
      if (!token) { setError("Missing authentication token"); setLoading(false); return; }
      setLoading(true);
      setError("");

      try {
        const qp = new URLSearchParams({ page, limit: pagination.limit });
        if (filters.currency)  qp.set("currency",  filters.currency);
        if (filters.date)      qp.set("date",       filters.date);
        if (filters.startDate) qp.set("startDate",  filters.startDate);
        if (filters.endDate)   qp.set("endDate",    filters.endDate);
        if (filters.userId)    qp.set("userId",     filters.userId);

        const headers = { Authorization: `Bearer ${token}` };

        const summaryUrl = filters.userId
          ? `${API_BASE_URL}/superAdmin/profits/summary?userId=${filters.userId}`
          : `${API_BASE_URL}/superAdmin/profits/summary`;

        const [summaryRes, profitsRes] = await Promise.all([
          axios.get(summaryUrl, { headers }),
          axios.get(`${API_BASE_URL}/superAdmin/profits?${qp.toString()}`, { headers }),
        ]);

        // Response shape: { success, message, data: { GBP: {...}, EUR: {...} } }
        setSummary(summaryRes.data?.data ?? {});

        const data = profitsRes.data?.data ?? [];
        setProfits(data);
        setFilteredProfits(data);
        setTotalProfits(profitsRes.data?.totalProfits ?? {});

        const total =
          profitsRes.data?.count ??
          profitsRes.data?.total ??
          profitsRes.data?.meta?.total ??
          0;
        setPagination((prev) => ({ ...prev, page, total }));
      } catch (err) {
        console.error("Error fetching profits:", err);
        setError("Failed to fetch profits. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, filters, pagination.limit]
  );

  useEffect(() => { fetchProfits(1); }, [filters]);

  // ── client-side search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredProfits(profits); return; }
    const term = searchTerm.toLowerCase();
    setFilteredProfits(
      profits.filter(
        (p) =>
          p.user?.firstName?.toLowerCase().includes(term) ||
          p.user?.lastName?.toLowerCase().includes(term)  ||
          p.user?.email?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, profits]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () =>
    setFilters({ currency: "", date: "", startDate: "", endDate: "", userId: "" });

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  // ── states ─────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-4 h-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading profits…
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500 gap-3">
        <p>{error}</p>
        <button
          onClick={() => fetchProfits(1)}
          className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          Retry
        </button>
      </div>
    );

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Profit & Loss</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Reseller margin analytics across all transaction types
          </p>
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className="relative flex items-center gap-2 text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Filters Panel ───────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Filter Records</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-600 transition"
              >
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
              <select
                value={filters.currency}
                onChange={(e) => handleFilterChange("currency", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">All Currencies</option>
                {["NGN", "USD", "GHS", "GBP", "EUR"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <select
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">User ID</label>
              <input
                type="text"
                placeholder="Paste user UUID…"
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Summary Blocks (one per currency) ───────────────────────────────── */}
      {summary && Object.keys(summary).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(summary).map(([ccy, stats]) => (
            <CurrencySummaryBlock key={ccy} currency={ccy} stats={stats} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-sm text-gray-400">
          No summary data available
        </div>
      )}

      {/* ── Total Profits Banner ─────────────────────────────────────────────── */}
      {Object.keys(totalProfits).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(totalProfits).map(([ccy, val]) => (
            <div
              key={ccy}
              className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-sm flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-gray-500">Total ({ccy}):</span>
              <span className="font-semibold text-emerald-700">{fmt(val, ccy)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative w-full sm:w-72">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.6-5.4A7.25 7.25 0 1110.25 4a7.25 7.25 0 018 8z" />
        </svg>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {[
                "User", "Email", "Service", "Currency",
                "Txn Amount", "Customer Fee", "Provider Fee",
                "Profit", "Fee Profit", "Margin Profit",
                "Margin", "Txn Status", "Date",
              ].map((h) => (
                <th key={h} className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProfits.length > 0 ? (
              filteredProfits.map((profit) => {
                const ccy      = profit.currency || profit.transaction?.currency || "NGN";
                const userId   = profit.userId || profit.user?.id;
                const fullName = `${profit.user?.firstName ?? ""} ${profit.user?.lastName ?? ""}`.trim() || "Unknown";

                return (
                  <tr key={profit.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* ── Clickable user cell ── */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => userId && navigate(`/admin/all-users/${userId}`)}
                        title={`View ${fullName}'s profile`}
                        className="flex items-center gap-2.5 group text-left"
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(userId)}`}
                        >
                          {initials(profit.user?.firstName, profit.user?.lastName)}
                        </span>
                        <span className="font-semibold text-gray-800 group-hover:text-emerald-600 group-hover:underline underline-offset-2 transition-colors">
                          {fullName}
                        </span>
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                      {profit.user?.email ?? "—"}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize">
                        {profit.serviceCategory ?? "—"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-medium">{ccy}</td>

                    <td className="px-5 py-3.5 font-semibold whitespace-nowrap">
                      {fmt(profit.transaction?.amount, ccy)}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {fmt(profit.customerFee, ccy)}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500">
                      {fmt(profit.providerFee, ccy)}
                    </td>

                    <td className="px-5 py-3.5 font-semibold whitespace-nowrap text-gray-800">
                      {fmt(profit.amount, ccy)}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {fmt(profit.feeProfit, ccy)}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {fmt(profit.marginProfit, ccy)}
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge value={profit.marginStatus} map={MARGIN_STATUS_MAP} />
                    </td>

                    <td className="px-5 py-3.5">
                      <Badge value={profit.transaction?.status} map={TXN_STATUS_MAP} />
                    </td>

                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap text-xs">
                      {new Date(profit.createdAt).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="13" className="text-center text-gray-400 py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  No profit records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-400">
          {filteredProfits.length} record{filteredProfits.length !== 1 ? "s" : ""} shown
          {pagination.total > 0 && ` · ${pagination.total} total`}
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={pagination.page === 1}
            onClick={() => fetchProfits(pagination.page - 1)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
              pagination.page === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            ← Prev
          </button>

          <span className="text-sm text-gray-500 px-2">
            {pagination.page} / {totalPages}
          </span>

          <button
            disabled={pagination.page >= totalPages}
            onClick={() => fetchProfits(pagination.page + 1)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
              pagination.page >= totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profits;