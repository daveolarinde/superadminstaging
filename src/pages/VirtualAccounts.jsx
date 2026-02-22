import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Landmark, DollarSign, Activity, WifiOff } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    active:   { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    pending:  { cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400"   },
    inactive: { cls: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",          dot: "bg-gray-400"    },
  };
  const s = String(status || "").toLowerCase();
  const style = map[s] || map.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {s || "N/A"}
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
    <p className="text-3xl font-bold text-gray-900">{value ?? 0}</p>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const VirtualAccounts = () => {
  const [virtualAccounts, setVirtualAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [page, setPage]         = useState(0);
  const [count, setCount]       = useState(null);
  const [search, setSearch]     = useState("");
  const [filterOpen, setFilterOpen]       = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [statusFilter, setStatusFilter]     = useState("");

  const limit     = 10;
  const navigate  = useNavigate();
  const authHeaders = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const fetchVirtualAccounts = async (pg = 0) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/superadmin/virtual-accounts`, {
        headers: authHeaders,
        params: {
          limit,
          offset: pg * limit,
          ...(currencyFilter && { currency: currencyFilter }),
          ...(statusFilter   && { status:   statusFilter   }),
        },
      });
      const data = res.data?.data || [];
      setVirtualAccounts(Array.isArray(data) ? data : []);
      if (typeof res.data?.count === "number") setCount(res.data.count);
    } catch {
      setError("Failed to fetch virtual accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVirtualAccounts(page); }, [page, currencyFilter, statusFilter]);

  useEffect(() => {
    if (!search.trim()) { setFilteredAccounts(virtualAccounts); return; }
    const term = search.toLowerCase();
    setFilteredAccounts(virtualAccounts.filter((va) =>
      va.accountName?.toLowerCase().includes(term) ||
      va.accountNumber?.toLowerCase().includes(term) ||
      va.bank?.toLowerCase().includes(term) ||
      va.user?.firstname?.toLowerCase().includes(term) ||
      va.user?.lastname?.toLowerCase().includes(term) ||
      va.user?.email?.toLowerCase().includes(term)
    ));
  }, [search, virtualAccounts]);

  const summary = useMemo(() => ({
    total:  count || 0,
    usd:    virtualAccounts.filter((v) => v.currency === "USD").length,
    ngn:    virtualAccounts.filter((v) => v.currency === "NGN").length,
    active: virtualAccounts.filter((v) => v.status === "active").length,
    failed: virtualAccounts.filter((v) => v.status === "inactive").length,
  }), [virtualAccounts, count]);

  const pagesTotal  = count ? Math.ceil(count / limit) : 1;
  const currentPage = page + 1; // 1-based for display
  const pageNumbers = getPageNumbers(currentPage, pagesTotal);
  const hasActiveFilters = currencyFilter || statusFilter;

  const summaryCards = [
    { label: "Total Accounts", value: summary.total,  icon: <Landmark size={17} />,  bgColor: "bg-indigo-50",  textColor: "text-indigo-600"  },
    { label: "USD Accounts",   value: summary.usd,    icon: <DollarSign size={17} />, bgColor: "bg-blue-50",    textColor: "text-blue-600"    },
    { label: "NGN Accounts",   value: summary.ngn,    icon: <DollarSign size={17} />, bgColor: "bg-teal-50",    textColor: "text-teal-600"    },
    { label: "Active",         value: summary.active, icon: <Activity size={17} />,   bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
    { label: "Inactive",       value: summary.failed, icon: <WifiOff size={17} />,    bgColor: "bg-gray-100",   textColor: "text-gray-500"    },
  ];

  const thCls = "px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap";
  const tdCls = "px-5 py-4 text-sm text-gray-700";

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Virtual Accounts</h1>
          <p className="text-xs text-gray-400 mt-0.5">{summary.total} accounts total</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition"
            />
          </div>

          {/* Filter button */}
          {hasActiveFilters && (
            <button
              onClick={() => { setCurrencyFilter(""); setStatusFilter(""); setPage(0); }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition"
            >
              <X size={13} /> Clear
            </button>
          )}
          <button
            onClick={() => setFilterOpen((p) => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-sm transition ${
              hasActiveFilters
                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={15} /> Filter
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-white/30 text-white text-[10px] flex items-center justify-center font-bold">
                {[currencyFilter, statusFilter].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((c) => <SummaryCard key={c.label} {...c} />)}
      </div>

      {/* ── Filter panel ── */}
      {filterOpen && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Filters</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Currency</label>
              <select
                value={currencyFilter}
                onChange={(e) => { setPage(0); setCurrencyFilter(e.target.value); }}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Currencies</option>
                <option value="USD">USD</option>
                <option value="NGN">NGN</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
              <div className="flex gap-2">
                {[{ v: "", l: "All" }, { v: "active", l: "Active" }, { v: "inactive", l: "Inactive" }].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => { setPage(0); setStatusFilter(o.v); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition ${
                      statusFilter === o.v
                        ? o.v === "active" ? "bg-emerald-600 border-emerald-600 text-white"
                        : o.v === "inactive" ? "bg-gray-600 border-gray-600 text-white"
                        : "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-sm text-gray-400">Loading accounts…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-2xl">⚠️</p>
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button onClick={() => fetchVirtualAccounts(page)} className="mt-2 px-4 py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
              Try again
            </button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-3xl">🏦</p>
            <p className="text-sm font-medium text-gray-500">No accounts found</p>
            <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={thCls}>Account Name</th>
                  <th className={thCls}>Account Number</th>
                  <th className={thCls}>Bank</th>
                  <th className={thCls}>Currency</th>
                  <th className={thCls}>User</th>
                  <th className={thCls}>Email</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAccounts.map((va) => (
                  <tr
                    key={va.id}
                    onClick={() => {
                      if (!va.userId) return;
                      navigate(`/admin/virtual-accounts/${va.userId}`, {
                        state: { accountId: va.id, account: va },
                      });
                    }}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    {/* Account name */}
                    <td className={`${tdCls} font-semibold text-gray-900`}>
                      {va.accountName || "N/A"}
                    </td>

                    {/* Account number */}
                    <td className={`${tdCls} font-mono text-xs tracking-wider text-gray-500`}>
                      {va.accountNumber || "—"}
                    </td>

                    {/* Bank */}
                    <td className={tdCls}>{va.bank || "—"}</td>

                    {/* Currency */}
                    <td className={tdCls}>
                      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                        {va.currency || "—"}
                      </span>
                    </td>

                    {/* User */}
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                          {va.user?.firstname?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="text-gray-800 font-medium">
                          {va.user?.firstname ? `${va.user.firstname} ${va.user.lastname || ""}` : "—"}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className={`${tdCls} text-gray-500 text-xs`}>{va.user?.email || "—"}</td>

                    {/* Status */}
                    <td className={tdCls}>
                      <StatusBadge status={va.status} />
                    </td>

                    {/* Created */}
                    <td className={`${tdCls} text-xs text-gray-400 whitespace-nowrap`}>
                      {va.createdAt ? new Date(va.createdAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && filteredAccounts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
            <p className="text-xs text-gray-400 shrink-0">
              Page <span className="font-semibold text-gray-600">{currentPage}</span> of{" "}
              <span className="font-semibold text-gray-600">{pagesTotal}</span>
              {count && <> — <span className="font-semibold text-gray-600">{count}</span> total</>}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={15} />
              </button>

              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <span key={`e${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p - 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition ${
                      p === currentPage
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={currentPage >= pagesTotal}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualAccounts;