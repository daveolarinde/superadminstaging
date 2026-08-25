import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, SlidersHorizontal, X, Landmark, DollarSign, Activity, WifiOff } from "lucide-react";
import VirtualAccountsTable from "../components/VirtualAccountsTable";

const API_BASE_URL = import.meta.env.VITE_STAGE_URL;

const SummaryCard = ({ label, value, icon, bgColor, textColor }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bgColor}`}>
      <span className={textColor}>{icon}</span>
    </div>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value ?? 0}</p>
  </div>
);

export default function VirtualAccounts() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const limit = 10;
  const [offset, setOffset] = useState(0);

  const authHeaders = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const fetchAllAccounts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/superadmin/virtual-accounts`, {
        headers: authHeaders,
        params: {
          limit: 5000,
          offset: 0,
          ...(currencyFilter && { currency: currencyFilter }),
          ...(statusFilter && { status: statusFilter }),
        },
      });

      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setAccounts(data);

      const c = typeof res.data?.count === "number" ? res.data.count : data.length;
      setTotalCount(c);
    } catch (e) {
      setError("Failed to fetch virtual accounts.");
      setAccounts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchAllAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyFilter, statusFilter]);

  // ── Pull unique currencies straight from the fetched data ────────────────
  // We fetch with limit:5000 and no currency filter on first load, so this
  // reflects whatever the backend actually has. When a currency filter is
  // active we still show all options (derived from the unfiltered snapshot
  // stored in `accounts` before the filter was applied).
  const availableCurrencies = useMemo(() => {
    return [...new Set(accounts.map((a) => a.currency).filter(Boolean))].sort();
  }, [accounts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const term = search.toLowerCase();
    return accounts.filter(
      (va) =>
        va.accountName?.toLowerCase().includes(term) ||
        va.accountNumber?.toLowerCase().includes(term) ||
        va.bank?.toLowerCase().includes(term) ||
        va.user?.firstname?.toLowerCase().includes(term) ||
        va.user?.lastname?.toLowerCase().includes(term) ||
        va.user?.email?.toLowerCase().includes(term)
    );
  }, [accounts, search]);

  useEffect(() => {
    if (offset >= filtered.length && filtered.length > 0) setOffset(0);
    if (filtered.length === 0) setOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length]);

  const pagedAccounts = useMemo(() => filtered.slice(offset, offset + limit), [filtered, offset]);

  const summary = useMemo(() => {
    const src = accounts;
    return {
      total: totalCount || src.length,
      active: src.filter((v) => String(v.status || "").toLowerCase() === "active").length,
      inactive: src.filter((v) => String(v.status || "").toLowerCase() === "inactive").length,
      // Per-currency counts built dynamically too
      byCurrency: availableCurrencies.reduce((acc, cur) => {
        acc[cur] = src.filter((v) => v.currency === cur).length;
        return acc;
      }, {}),
    };
  }, [accounts, totalCount, availableCurrencies]);

  const hasActiveFilters = currencyFilter || statusFilter;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Virtual Accounts</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Showing{" "}
            <span className="font-semibold text-gray-600">
              {filtered.length === 0 ? 0 : offset + 1}
            </span>
            –
            <span className="font-semibold text-gray-600">
              {Math.min(offset + limit, filtered.length)}
            </span>{" "}
            of <span className="font-semibold text-gray-600">{filtered.length}</span>
            {search.trim() && <span className="text-gray-400"> (filtered by search)</span>}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => { setCurrencyFilter(""); setStatusFilter(""); setOffset(0); }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition"
            >
              <X size={13} /> Clear
            </button>
          )}

          <button
            onClick={() => setFilterOpen((p) => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-sm transition ${hasActiveFilters
                ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
          >
            <SlidersHorizontal size={15} /> Filter
          </button>
        </div>
      </div>

      {/* Summary cards — total + active/inactive + one card per currency */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard label="Total Accounts" value={summary.total} icon={<Landmark size={17} />} bgColor="bg-indigo-50" textColor="text-indigo-600" />

        {/* Dynamic per-currency cards */}
        {availableCurrencies.map((cur) => (
          <SummaryCard
            key={cur}
            label={`${cur} Accounts`}
            value={summary.byCurrency[cur]}
            icon={<DollarSign size={17} />}
            bgColor="bg-blue-50"
            textColor="text-blue-600"
          />
        ))}

        <SummaryCard label="Active" value={summary.active} icon={<Activity size={17} />} bgColor="bg-emerald-50" textColor="text-emerald-600" />
        <SummaryCard label="Inactive" value={summary.inactive} icon={<WifiOff size={17} />} bgColor="bg-gray-100" textColor="text-gray-500" />
      </div>

      {/* Filters panel */}
      {filterOpen && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Filters</p>
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Currency — options come from the backend data */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Currency</label>
              <select
                value={currencyFilter}
                onChange={(e) => { setCurrencyFilter(e.target.value); setOffset(0); }}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">All Currencies</option>
                {availableCurrencies.map((cur) => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
              <div className="flex gap-2">
                {[{ v: "", l: "All" }, { v: "active", l: "Active" }, { v: "inactive", l: "Inactive" }].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => { setStatusFilter(o.v); setOffset(0); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition ${statusFilter === o.v
                        ? o.v === "active"
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : o.v === "inactive"
                            ? "bg-gray-600 border-gray-600 text-white"
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

      {/* Table */}
      <VirtualAccountsTable
        accounts={pagedAccounts}
        totalAccounts={filtered.length}
        limit={limit}
        offset={offset}
        onPageChange={(nextOffset) =>
          setOffset(Math.max(0, Math.min(nextOffset, Math.max(0, filtered.length - limit))))
        }
        loading={loading}
        error={error}
        onRetry={fetchAllAccounts}
        onRowClick={(va) => {
          if (!va?.userId) return;
          navigate(`/admin/virtual-accounts/${va.userId}`, { state: { accountId: va.id, account: va } });
        }}
      />
    </div>
  );
}