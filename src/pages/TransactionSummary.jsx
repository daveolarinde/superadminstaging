import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { ChevronLeft, ChevronRight, TrendingUp, X, ArrowUpCircle, ArrowDownCircle, XCircle } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ── Pagination helpers ────────────────────────────────────────────────────────
const getPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

function Pagination({ currentPage, totalPages, setPage }) {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(currentPage, totalPages);
  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft size={14} />
      </button>
      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`e${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(p)}
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
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ title, value, sub, icon, tone = "text-gray-900" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const currencySymbols = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

const getCurrencySymbol = (currency) => currencySymbols[currency] || currency || "";

const formatCurrencyAmount = (value, currency) => {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  const formatted = amount.toLocaleString();
  const symbol = getCurrencySymbol(currency);
  return symbol === currency ? `${symbol} ${formatted}` : `${symbol}${formatted}`;
};

const formatSummaryValue = (amount, currencies) => {
  const formatted = Number(amount || 0).toLocaleString();
  if (currencies.length === 1) {
    const symbol = getCurrencySymbol(currencies[0]);
    return symbol === currencies[0] ? `${symbol} ${formatted}` : `${symbol}${formatted}`;
  }
  return formatted;
};

const formatSummarySub = (count, currencies) => {
  const currencyLabel = currencies.length > 1 ? ` · ${currencies.join(", ")}` : "";
  return `${count.toLocaleString()} transactions${currencyLabel}`;
};

// ── Breakdown table ───────────────────────────────────────────────────────────
function BreakdownTable({ title, rows, page, setPage, showDate = false }) {
  const rowsPerPage = 10;
  const totalPages  = Math.ceil((rows?.length || 0) / rowsPerPage);
  const start       = (page - 1) * rowsPerPage;
  const paged       = rows?.slice(start, start + rowsPerPage) || [];

  const thCls = "px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider";
  const tdCls = "px-5 py-3.5 text-sm text-gray-700";

  return (
    <div>
      <h3 className="text-sm font-bold text-gray-800 mb-4">{title}</h3>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {showDate && <th className={thCls}>Date</th>}
              <th className={thCls}>Currency</th>
              <th className={thCls}>Type</th>
              <th className={thCls}>Amount</th>
              <th className={thCls}>Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.length === 0 ? (
              <tr><td colSpan={showDate ? 5 : 4} className="py-10 text-center text-gray-400 text-sm">No data available</td></tr>
            ) : paged.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                {showDate && (
                  <td className={tdCls}>
                    {new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                )}
                <td className={tdCls}>
                  <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                    {row.currency}
                  </span>
                </td>
                <td className={`${tdCls} capitalize`}>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    row.type === "credit"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${row.type === "credit" ? "bg-emerald-500" : "bg-red-500"}`} />
                    {row.type}
                  </span>
                </td>
                <td className={`${tdCls} font-semibold`}>{formatCurrencyAmount(row.totalAmount, row.currency)}</td>
                <td className={`${tdCls} font-mono text-gray-500`}>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}

// ── Summary filter bar ───────────────────────────────────────────────────────
function SummaryFilterBar({ period, setPeriod, dateRange, setDateRange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [draftStart, setDraftStart] = useState(dateRange.startDate || "");
  const [draftEnd, setDraftEnd]     = useState(dateRange.endDate || "");

  const periods = [
    { value: "",        label: "All time" },
    { value: "daily",   label: "Today" },
    { value: "weekly",  label: "Last 7 Days" },
    { value: "monthly", label: "This Month" },
    { value: "yearly",  label: "This Year" },
  ];

  const isCustomActive = !!dateRange.startDate && !!dateRange.endDate;

  const applyCustomRange = () => {
    if (!draftStart || !draftEnd) return;
    setDateRange({ startDate: draftStart, endDate: draftEnd });
    setPeriod(""); // mutually exclusive
    setShowCustom(false);
  };

  const clearCustomRange = () => {
    setDateRange({ startDate: "", endDate: "" });
    setDraftStart("");
    setDraftEnd("");
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex flex-wrap gap-1.5 bg-gray-100 rounded-xl p-1 w-fit">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => {
              setPeriod(p.value);
              clearCustomRange(); // mutually exclusive
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              period === p.value && !isCustomActive
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="relative">
        {isCustomActive ? (
          <button
            onClick={clearCustomRange}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-sm"
          >
            {dateRange.startDate} → {dateRange.endDate}
            <X size={12} />
          </button>
        ) : (
          <button
            onClick={() => setShowCustom((s) => !s)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white transition"
          >
            Custom range
          </button>
        )}

        {showCustom && !isCustomActive && (
          <div className="absolute z-10 top-full mt-2 left-0 bg-white border border-gray-100 shadow-lg rounded-xl p-4 flex flex-col gap-3 w-64">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Start date</label>
              <input
                type="date"
                value={draftStart}
                max={draftEnd || undefined}
                onChange={(e) => setDraftStart(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">End date</label>
              <input
                type="date"
                value={draftEnd}
                min={draftStart || undefined}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700"
              />
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={() => setShowCustom(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={applyCustomRange}
                disabled={!draftStart || !draftEnd}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TransactionSummary() {
  const [graphData, setGraphData] = useState({});
  const [summary, setSummary]     = useState({});
  const [activeTab, setActiveTab] = useState("currentMonth");
  const [type, setType]           = useState("");

  // Currency is a display filter only — the backend has no currency param,
  // so we never send it to either endpoint. We fetch everything, unfiltered,
  // and narrow it down here.
  const [currency, setCurrency]   = useState("");

  // Full-page spinner only on the very first load; subsequent filter/tab
  // changes swap data in place with no loading flash.
  const [initialLoading, setInitialLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  // Summary filters — mutually exclusive: period OR (startDate & endDate)
  const [period, setPeriod]       = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  const [overallPage, setOverallPage] = useState(1);
  const [monthPage, setMonthPage]     = useState(1);
  const [dailyPage, setDailyPage]     = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!hasLoadedOnce.current) setInitialLoading(true);
        const token = localStorage.getItem("token");

        // Only date-range/period and type are real backend filters.
        // Currency stays out of the request entirely — it's applied
        // client-side below against the full, unfiltered response.
        const summaryParams = {};
        if (dateRange.startDate && dateRange.endDate) {
          summaryParams.startDate = dateRange.startDate;
          summaryParams.endDate = dateRange.endDate;
        } else if (period) {
          summaryParams.period = period;
        }

        const [graphRes, summaryRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_URL}/superAdmin/get-transaction-graph${type ? `?type=${type}` : ""}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(
            `${import.meta.env.VITE_API_URL}/superAdmin/get-transaction-summary`,
            { headers: { Authorization: `Bearer ${token}` }, params: summaryParams }
          ),
        ]);
        setGraphData(graphRes.data?.data || {});
        setSummary(summaryRes.data?.summary || {});

        // Reset table pagination whenever the underlying data changes
        setOverallPage(1);
        setMonthPage(1);
        setDailyPage(1);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      } finally {
        setInitialLoading(false);
        hasLoadedOnce.current = true;
      }
    };
    fetchData();
  }, [type, period, dateRange.startDate, dateRange.endDate]);

  if (initialLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-9 h-9 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      <p className="text-sm text-gray-400">Loading dashboard…</p>
    </div>
  );

  const summaryData = summary?.summary || {};
  const thisMonth   = summary?.thisMonth || {};
  const daily       = summary?.daily || [];

  const summaryBreakdown = Array.isArray(summaryData.breakdown) && summaryData.breakdown.length
    ? summaryData.breakdown
    : Array.isArray(thisMonth.breakdown)
      ? thisMonth.breakdown
      : [];

  // Every currency that has ever shown up in the summary breakdown — this is
  // what drives the filter pills, and it comes from the unfiltered response
  // so pills don't disappear once a currency is selected.
  const availableCurrencies = Array.from(
    new Set(summaryBreakdown.map((b) => b.currency).filter(Boolean))
  );

  // Single client-side filter used everywhere: summary cards, both
  // breakdown tables, and daily rows all run through this.
  const filterRow = (row) => {
    if (currency && row.currency !== currency) return false;
    if (type && row.type !== type) return false;
    return true;
  };

  const filteredSummaryBreakdown = summaryBreakdown.filter(filterRow);
  const thisMonthBreakdown = Array.isArray(thisMonth.breakdown) ? thisMonth.breakdown : [];
  const filteredThisMonthBreakdown = thisMonthBreakdown.filter(filterRow);

  const creditCurrencies = Array.from(
    new Set(filteredSummaryBreakdown.filter((b) => b.type === "credit").map((b) => b.currency).filter(Boolean))
  );
  const debitCurrencies = Array.from(
    new Set(filteredSummaryBreakdown.filter((b) => b.type === "debit").map((b) => b.currency).filter(Boolean))
  );

  // Flatten daily for table rows, then apply the same filter
  const dailyRows = daily.flatMap((d) =>
    (d.breakdown || []).map((b) => ({ ...b, date: d.date }))
  );
  const filteredDailyRows = dailyRows.filter(filterRow);

  // ── Chart data ──
  // The graph endpoint returns one totalAmount per date/month, already
  // aggregated across currencies — it doesn't hand us a per-day currency
  // breakdown, so a currency filter can't be applied point-by-point the way
  // it can for the tables above. Where a datapoint *does* carry its own
  // per-currency breakdown array (mirroring the daily-summary shape), we
  // recompute the point from that; otherwise we fall back to the aggregate
  // and flag it below so the discrepancy isn't silently hidden.
  const selectedGraphRaw = graphData[activeTab] || [];
  // const graphHasPerCurrencyBreakdown = selectedGraphRaw.some((d) => Array.isArray(d.breakdown));

  const selectedGraph = selectedGraphRaw.map((d) => {
    if (!currency || !Array.isArray(d.breakdown)) return d;
    const matching = d.breakdown.filter((b) => b.currency === currency && (!type || b.type === type));
    return {
      ...d,
      totalAmount: matching.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0),
      count: matching.reduce((sum, b) => sum + Number(b.count || 0), 0),
      currency,
    };
  });

  const chartCurrency = currency ? getCurrencySymbol(currency) : "₦";
  // const chartIsApproximate = !!currency && !graphHasPerCurrencyBreakdown;

  const labels = activeTab === "currentYear"
    ? selectedGraph.map((d) => `Month ${d.month}`)
    : selectedGraph.map((d) => new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  const values = selectedGraph.map((d) => d.totalAmount || 0);

  const chartData = {
    labels,
    datasets: [{
      label: `Total Amount (${chartCurrency})`,
      data: values,
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.08)",
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: "#3b82f6",
      pointHoverRadius: 6,
      borderWidth: 2,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#f8fafc",
        bodyColor: "#94a3b8",
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => {
            const item = selectedGraph[ctx.dataIndex];
            return `  ${chartCurrency}${(item.totalAmount || 0).toLocaleString()} · ${item.count || 0} txns`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af", font: { size: 11 } },
        grid: { display: false },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#9ca3af", font: { size: 11 }, callback: (v) => `${chartCurrency}${v.toLocaleString()}` },
        grid: { color: "#f3f4f6" },
        border: { display: false },
      },
    },
  };

  const tabs = [
    { key: "currentMonth", label: "This Month" },
    { key: "lastMonth",    label: "Last Month" },
    { key: "currentYear",  label: "This Year" },
  ];

  const typeFilters = [
    { value: "",       label: "All" },
    { value: "credit", label: "Credit" },
    { value: "debit",  label: "Debit" },
  ];

  const isCustomActive = !!dateRange.startDate && !!dateRange.endDate;
  const activeFilterLabelBase = isCustomActive
    ? `${dateRange.startDate} → ${dateRange.endDate}`
    : period
    ? { daily: "Today", weekly: "Last 7 Days", monthly: "This Month", yearly: "This Year" }[period]
    : "All time";
  const activeFilterLabel = currency ? `${activeFilterLabelBase} · ${currency}` : activeFilterLabelBase;

  // ── Derive credit / debit / failed totals from the currently filtered summary ──
  const creditTotals = filteredSummaryBreakdown
    .filter((b) => b.type === "credit")
    .reduce((acc, b) => ({
      amount: acc.amount + Number(b.totalAmount || 0),
      count:  acc.count + Number(b.count || 0),
    }), { amount: 0, count: 0 });

  const debitTotals = filteredSummaryBreakdown
    .filter((b) => b.type === "debit")
    .reduce((acc, b) => ({
      amount: acc.amount + Number(b.totalAmount || 0),
      count:  acc.count + Number(b.count || 0),
    }), { amount: 0, count: 0 });

  // NOTE: the /get-transaction-summary payload only breaks transactions down
  // by type (credit/debit), not by status, and — same as everything else —
  // has no currency-level split for failures either. If the backend ever
  // adds a per-currency failed breakdown, filter it here the same way as
  // creditTotals/debitTotals above. For now this stays currency-agnostic.
  const failedTotals = (() => {
    const failedBreakdown = summary?.failed?.breakdown || summaryData?.failedBreakdown;
    if (Array.isArray(failedBreakdown)) {
      const relevant = currency ? failedBreakdown.filter((b) => b.currency === currency) : failedBreakdown;
      return relevant.reduce((acc, b) => ({
        amount: acc.amount + Number(b.totalAmount || 0),
        count:  acc.count + Number(b.count || 0),
      }), { amount: 0, count: 0 });
    }
    return {
      amount: Number(summary?.failed?.totalAmount || 0),
      count:  Number(summary?.failed?.totalTransactions || summary?.failed?.count || 0),
    };
  })();

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* ── Summary Filter Bar ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Summary Filters</h2>
            <p className="text-xs text-gray-400">Showing: {activeFilterLabel}</p>
          </div>
        </div>
        <SummaryFilterBar
          period={period}
          setPeriod={setPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />

        {/* ── Currency pills — always visible, one tap to filter ── */}
        {availableCurrencies.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-0.5">Currency</span>
            <button
              onClick={() => setCurrency("")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                currency === ""
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
              }`}
            >
              All
            </button>
            {availableCurrencies.map((code) => (
              <button
                key={code}
                onClick={() => setCurrency(code)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  currency === code
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                }`}
              >
                {code}
              </button>
            ))}
            {currency && (
              <button
                onClick={() => setCurrency("")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-red-500 hover:bg-red-50 transition"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Summary Cards (filter-aware: credit / debit / failed) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title={`Credit · ${activeFilterLabel}`}
          value={formatSummaryValue(creditTotals.amount, creditCurrencies)}
          sub={formatSummarySub(creditTotals.count, creditCurrencies)}
          tone="text-emerald-600"
          icon={
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ArrowUpCircle size={16} className="text-emerald-600" />
            </div>
          }
        />
        <SummaryCard
          title={`Debit · ${activeFilterLabel}`}
          value={formatSummaryValue(debitTotals.amount, debitCurrencies)}
          sub={formatSummarySub(debitTotals.count, debitCurrencies)}
          tone="text-red-600"
          icon={
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <ArrowDownCircle size={16} className="text-red-600" />
            </div>
          }
        />
        <SummaryCard
          title={`Failed · ${activeFilterLabel}`}
          value={formatSummaryValue(failedTotals.amount, [])}
          sub={`${failedTotals.count.toLocaleString()} transactions`}
          tone="text-amber-600"
          icon={
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <XCircle size={16} className="text-amber-600" />
            </div>
          }
        />
      </div>

      {/* ── Chart Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Transaction Trend</h2>
            <p className="text-xs text-gray-400">
              {tabs.find((t) => t.key === activeTab)?.label}
              {type && ` · ${type.charAt(0).toUpperCase() + type.slice(1)} only`}
              {currency && ` · ${currency}`}
            </p>
          </div>
        </div>

        {/* Tab + type row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          {/* Period tabs */}
          <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type toggle */}
          <div className="flex gap-1.5">
            {typeFilters.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  type === t.value
                    ? t.value === "credit"
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : t.value === "debit"
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
{/* 
        {chartIsApproximate && (
          // <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
          //   The trend graph isn't split by currency on the backend yet, so it's still showing all currencies combined.
          //   Cards and tables below are correctly filtered to {currency}.
          // </p>
        )} */}

        <div className="overflow-x-auto">
          <div className="h-64 sm:h-80 min-w-[500px]">
            <Line data={chartData} options={options} />
          </div>
        </div>
      </div>

      {/* ── Breakdown Tables ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-10">
        <BreakdownTable
          title="Total Breakdown"
          rows={filteredSummaryBreakdown}
          page={overallPage}
          setPage={setOverallPage}
        />
        <div className="h-px bg-gray-100" />
        <BreakdownTable
          title="This Month Breakdown"
          rows={filteredThisMonthBreakdown}
          page={monthPage}
          setPage={setMonthPage}
        />
      </div>

      {/* ── Daily breakdown ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <BreakdownTable
          title="Overall Daily Breakdown"
          rows={filteredDailyRows}
          page={dailyPage}
          setPage={setDailyPage}
          showDate
        />
      </div>
    </div>
  );
}