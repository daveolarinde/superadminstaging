import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import WalletCurrency from "./WalletCurrency";
import RecentTransactions from "./RecentTransactionTable"
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

import { Users, Clock, CreditCard } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const baseURL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  
  const [kycStats, setKycStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [summary, setSummary] = useState(null);
  // const [users, setUsers] = useState([]);
  const [rates, setRates] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);

  // === Chart State ===
  const [graphData, setGraphData] = useState({});
  const [activeTab, setActiveTab] = useState("currentMonth");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);

  // ================= Notification Permission =================
  

  // ================= Fetch Graph & Summary =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [graphRes, summaryRes, kycRes] = await Promise.all([
          axios.get(
            `${baseURL}/superAdmin/get-transaction-graph${
              type ? `?type=${type}` : ""
            }`,
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
          const total = list.length;
          const pending = list.filter(
            (k) => k.status?.toLowerCase() === "pending"
          ).length;
          const approved = list.filter(
            (k) => k.status?.toLowerCase() === "success"
          ).length;
          const rejected = list.filter((k) =>
            ["failed", "rejected"].includes(k.status?.toLowerCase())
          ).length;
          setKycStats({ total, pending, approved, rejected });
        }
      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseURL, token, type]);

  // ================= Fetch Exchange Rates =================
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await axios.get(`${baseURL}/superAdmin/rates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRates(res.data?.data?.rates || null);
      } catch (error) {
        console.error("❌ Failed to fetch rates:", error);
      } finally {
        setRateLoading(false);
      }
    };
    fetchRates();
  }, [baseURL, token]);

  //  GRAPH LOGIC
  const selectedGraph = graphData[activeTab] || [];

  const labels =
    activeTab === "currentYear"
      ? selectedGraph.map((d) => `Month ${d.month}`)
      : selectedGraph.map((d) =>
          new Date(d.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        );

  const values = selectedGraph.map((d) => d.totalAmount || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Total Amount (₦)",
        data: values,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f9fafb",
        bodyColor: "#f9fafb",
        callbacks: {
          title: (ctx) => ctx[0].label,
          label: (ctx) => {
            const item = selectedGraph[ctx.dataIndex];
            return `₦${(item.totalAmount || 0).toLocaleString()} • ${
              item.count || 0
            } Txns`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280" },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#6b7280",
          callback: (v) => `₦${v.toLocaleString()}`,
        },
        grid: { color: "#e5e7eb" },
      },
    },
  };

  return (
    <div className="p-4 md:p-6 space-y-6">


      {/* Chart + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Transaction Trend —{" "}
              {activeTab === "currentMonth"
                ? "This Month"
                : activeTab === "lastMonth"
                ? "Last Month"
                : "This Year"}
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {["currentMonth", "lastMonth", "currentYear"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab === "currentMonth"
                  ? "This Month"
                  : tab === "lastMonth"
                  ? "Last Month"
                  : "This Year"}
              </button>
            ))}
          </div>

          {/* Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {["", "credit", "debit"].map((t) => (
              <button
                key={t || "all"}
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  type === t
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="h-64 sm:h-80">
            {loading ? (
              <p className="text-gray-500 text-center mt-20">
                Loading chart...
              </p>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Total Users"
            value={summary?.totalUsers ?? 0}
            icon={<Users className="w-5 h-5" />}
            color="#3b82f6"
          />
          <StatCard
            label="Pending KYC"
            value={kycStats.pending}
            icon={<Clock className="w-5 h-5" />}
            color="#f59e0b"
          />
          <StatCard
            label="Approved KYC"
            value={kycStats.approved}
            icon={<Clock className="w-5 h-5" />}
            color="#10b981"
          />
          <StatCard
            label="Rejected KYC"
            value={kycStats.rejected}
            icon={<Clock className="w-5 h-5" />}
            color="#ef4444"
          />
        </div>
      </div>

      {/* Exchange Rates */}
      <div className="mt-4">
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          💱 Exchange Rates
        </h3>
        {rateLoading ? (
          <p className="text-gray-500 text-sm text-center">
            Loading exchange rates...
          </p>
        ) : rates && Object.keys(rates).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {Object.entries(rates)
              .filter(([pair]) =>
                ["NGN-USD", "USD-NGN"].includes(pair.toUpperCase())
              )
              .map(([pair, value]) => {
                const formattedValue = Number(value).toLocaleString(undefined, {
                  minimumFractionDigits: 6,
                  maximumFractionDigits: 8,
                });

                return (
                  <StatCard
                    key={pair}
                    label={`1 ${pair.replace("-", " = ")}`}
                    value={formattedValue}
                    icon={<CreditCard className="w-5 h-5" />}
                    color="#3b82f6"
                  />
                );
              })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center">
            No exchange rate data available.
          </p>
        )}
      </div>

      {/* Other Sections */}
      <div className="bg-white rounded-xl shadow p-5">
        <WalletCurrency />
      </div>
      <div className="bg-white rounded-xl shadow p-5">
        <RecentTransactions  />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow flex flex-col">
      <div
        className="w-10 h-10 flex items-center justify-center rounded-full mb-3"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
