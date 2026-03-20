import { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
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
function SummaryCard({ title, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

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
                <td className={`${tdCls} font-semibold`}>₦{Number(row.totalAmount).toLocaleString()}</td>
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

// ── Main component ────────────────────────────────────────────────────────────
export default function TransactionSummary() {
  const [graphData, setGraphData] = useState({});
  const [summary, setSummary]     = useState({});
  const [activeTab, setActiveTab] = useState("currentMonth");
  const [type, setType]           = useState("");
  const [loading, setLoading]     = useState(true);

  const [overallPage, setOverallPage] = useState(1);
  const [monthPage, setMonthPage]     = useState(1);
  const [dailyPage, setDailyPage]     = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const [graphRes, summaryRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_STAGE_API_URL}/superAdmin/get-transaction-graph${type ? `?type=${type}` : ""}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(
            `${import.meta.env.VITE_STAGE_API_URL}/superAdmin/get-transaction-summary`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);
        setGraphData(graphRes.data?.data || {});
        setSummary(summaryRes.data?.summary || {});
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-9 h-9 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
      <p className="text-sm text-gray-400">Loading dashboard…</p>
    </div>
  );

  const selectedGraph = graphData[activeTab] || [];
  const labels = activeTab === "currentYear"
    ? selectedGraph.map((d) => `Month ${d.month}`)
    : selectedGraph.map((d) => new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  const values = selectedGraph.map((d) => d.totalAmount || 0);

  const chartData = {
    labels,
    datasets: [{
      label: "Total Amount (₦)",
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
            return `  ₦${(item.totalAmount || 0).toLocaleString()} · ${item.count || 0} txns`;
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
        ticks: { color: "#9ca3af", font: { size: 11 }, callback: (v) => `₦${v.toLocaleString()}` },
        grid: { color: "#f3f4f6" },
        border: { display: false },
      },
    },
  };

  const summaryData = summary?.summary || {};
  const thisMonth   = summary?.thisMonth || {};
  const daily       = summary?.daily || [];

  // Flatten daily for table rows
  const dailyRows = daily.flatMap((d) =>
    (d.breakdown || []).map((b) => ({ ...b, date: d.date }))
  );

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

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard
          title="This Month Transactions"
          value={(thisMonth.totalTransactions || 0).toLocaleString()}
          sub="Total transaction count"
        />
        <SummaryCard
          title="This Month Value"
          value={`₦${Number(thisMonth.totalValue || 0).toLocaleString()}`}
          sub="Total volume"
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
          rows={summaryData.breakdown}
          page={overallPage}
          setPage={setOverallPage}
        />
        <div className="h-px bg-gray-100" />
        <BreakdownTable
          title="This Month Breakdown"
          rows={thisMonth.breakdown}
          page={monthPage}
          setPage={setMonthPage}
        />
      </div>

      {/* ── Daily breakdown ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <BreakdownTable
          title="Overall Daily Breakdown"
          rows={dailyRows}
          page={dailyPage}
          setPage={setDailyPage}
          showDate
        />
      </div>
    </div>
  );
}