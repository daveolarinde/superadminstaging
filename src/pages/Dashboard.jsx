import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import WalletCurrency from "../components/WalletCurrency";
import RecentTransactions from "../components/RecentTransactionTable";
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
import { Users, Clock, CheckCircle, XCircle, TrendingUp, ShieldCheck } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, bgColor, textColor, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
        <span className={textColor}>{icon}</span>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        {loading ? (
          <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-gray-900">{Number(value).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const baseURL = import.meta.env.VITE_API_URL;
  const token   = localStorage.getItem("token");

  const [kycStats, setKycStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [summary, setSummary]   = useState(null);
  const [graphData, setGraphData] = useState({});
  const [activeTab, setActiveTab] = useState("currentMonth");
  const [type, setType]           = useState("");
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [graphRes, summaryRes, kycRes] = await Promise.all([
          axios.get(
            `${baseURL}/superAdmin/get-transaction-graph${type ? `?type=${type}` : ""}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(`${baseURL}/superAdmin/get-user-summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${baseURL}/superAdmin/kyc`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setGraphData(graphRes.data?.data || {});
        if (summaryRes.data.success) setSummary(summaryRes.data.data);
        if (kycRes.data?.status === "success") {
          const list = kycRes.data.data || [];
          setKycStats({
            total:    list.length,
            pending:  list.filter((k) => k.status?.toLowerCase() === "pending").length,
            approved: list.filter((k) => k.status?.toLowerCase() === "success").length,
            rejected: list.filter((k) => ["failed", "rejected"].includes(k.status?.toLowerCase())).length,
          });
        }
      } catch (err) {
        console.error("❌ Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseURL, token, type]);

  // ── Chart ──────────────────────────────────────────────────────────────────
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
      backgroundColor: "rgba(59,130,246,0.07)",
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: "#3b82f6",
      pointHoverRadius: 6,
      borderWidth: 2,
    }],
  };

  const chartOptions = {
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

  const tabs = [
    { key: "currentMonth", label: "This Month" },
    { key: "lastMonth",    label: "Last Month" },
    { key: "currentYear",  label: "This Year"  },
  ];

  const typeFilters = [
    { value: "",       label: "All"    },
    { value: "credit", label: "Credit" },
    { value: "debit",  label: "Debit"  },
  ];

  const statCards = [
    { label: "Total Users",   value: summary?.totalUsers ?? 0, icon: <Users size={18} />,        bgColor: "bg-blue-50",   textColor: "text-blue-600"   },
    { label: "Pending KYC",   value: kycStats.pending,          icon: <Clock size={18} />,         bgColor: "bg-amber-50",  textColor: "text-amber-600"  },
    { label: "Approved KYC",  value: kycStats.approved,         icon: <CheckCircle size={18} />,   bgColor: "bg-emerald-50",textColor: "text-emerald-600"},
    { label: "Rejected KYC",  value: kycStats.rejected,         icon: <XCircle size={18} />,       bgColor: "bg-red-50",    textColor: "text-red-500"    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* ── Stat cards row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* ── Chart + KYC summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
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

          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            {/* Period tabs — segmented control */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
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
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 sm:h-72">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                <p className="text-xs text-gray-400">Loading chart…</p>
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* KYC quick overview panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <ShieldCheck size={16} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">KYC Overview</h2>
              <p className="text-xs text-gray-400">All-time totals</p>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {[
              { label: "Total Submissions", value: kycStats.total,    bar: "bg-blue-500",    pct: 100 },
              { label: "Pending",           value: kycStats.pending,  bar: "bg-amber-400",   pct: kycStats.total ? Math.round((kycStats.pending  / kycStats.total) * 100) : 0 },
              { label: "Approved",          value: kycStats.approved, bar: "bg-emerald-500", pct: kycStats.total ? Math.round((kycStats.approved / kycStats.total) * 100) : 0 },
              { label: "Rejected",          value: kycStats.rejected, bar: "bg-red-400",     pct: kycStats.total ? Math.round((kycStats.rejected / kycStats.total) * 100) : 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-xs font-bold text-gray-800">{loading ? "—" : item.value}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.bar} transition-all duration-700`}
                    style={{ width: loading ? "0%" : `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Wallet currencies ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <WalletCurrency />
      </div>

      {/* ── Recent transactions ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <RecentTransactions />
      </div>
    </div>
  );
}