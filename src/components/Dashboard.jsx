import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import WalletCurrency from "./WalletCurrency";

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

import { Users, Ticket, BadgeCheck, CreditCard } from "lucide-react";

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
  const [period, setPeriod] = useState("currentMonth");
  const [graphData, setGraphData] = useState({
    currentMonth: [],
    lastMonth: [],
    currentYear: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/superAdmin/get-transaction-graph`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const { currentMonth, lastMonth, currentYear } = res.data.data;

        setGraphData({
          currentMonth: currentMonth.map(item => ({
            date: item.date,
            value: item.totalAmount,
          })),
          lastMonth: lastMonth.map(item => ({
            date: item.date,
            value: item.totalAmount,
          })),
          currentYear: currentYear.map(item => ({
            date: item.month,
            value: item.totalAmount,
          })),
        });

        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to fetch graph data:", err);
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  const labels =
    graphData[period]?.length > 0
      ? graphData[period].map((item, idx) =>
          period === "currentYear" ? `Month ${item.date}` : `Day ${idx + 1}`
        )
      : [];

  const data = {
    labels,
    datasets: [
      {
        label: "Deposit",
        data: graphData[period]?.map(item => item.value) || [],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.08)",
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e2a47",
        titleFont: { weight: "bold" },
        titleColor: "#d1d5db",
        bodyColor: "#f9fafb",
        callbacks: {
          title: (context) => {
            const label = context[0].label || "";
            return `${label}`;
          },
          label: (context) => {
            const value = context.raw || 0;
            return `$${value.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: "#6b7280" }, grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { color: "#6b7280", callback: (val) => val.toLocaleString() },
        grid: { color: "#e5e7eb" },
      },
    },
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ================= Chart Section ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Transaction
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: "currentMonth", label: "This Month" },
                { id: "lastMonth", label: "Last Month" },
                { id: "currentYear", label: "This Year" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  className={`px-3 py-1 rounded-md text-sm border whitespace-nowrap transition ${
                    period === btn.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                  onClick={() => setPeriod(btn.id)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mb-2 text-sm font-medium text-gray-600">
            DEPOSIT:{" "}
            <span className="font-bold text-gray-900">
              {loading
                ? "Loading..."
                : `${graphData[period]
                    ?.reduce((a, b) => a + b.value, 0)
                    .toLocaleString()} USD`}
            </span>
          </p>

          <div className="h-64 sm:h-80">
            {loading ? (
              <p className="text-gray-500 text-center mt-20">
                Loading chart...
              </p>
            ) : (
              <Line data={data} options={options} />
            )}
          </div>
        </div>

        {/* Right: Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Total Users"
            value="294"
            change="0%"
            sparkline={[200, 220, 250, 294]}
            icon={<Users className="w-5 h-5" />}
            color="#3b82f6"
          />
          <StatCard
            label="Pending Tickets"
            value="8"
            change="↓ from 25"
            sparkline={[25, 20, 15, 8]}
            icon={<Ticket className="w-5 h-5" />}
            color="#ef4444"
          />
          <StatCard
            label="Pending KYC"
            value="1"
            change="↓ from 6"
            sparkline={[6, 5, 2, 1]}
            icon={<BadgeCheck className="w-5 h-5" />}
            color="#f59e0b"
          />
          <StatCard
            label="This Month Transactions"
            value="9"
            change="from 9"
            sparkline={[3, 5, 7, 9]}
            icon={<CreditCard className="w-5 h-5" />}
            color="#10b981"
          />
        </div>
      </div>

      {/* ================= Wallet Currency Section ================= */}
      <div className="bg-white rounded-xl shadow p-5">
        <WalletCurrency />
      </div>
    </div>
  );
}

function StatCard({ label, value, change, sparkline, icon, color }) {
  const sparkData = {
    labels: sparkline.map((_, i) => `Point ${i + 1}`),
    datasets: [
      {
        data: sparkline,
        borderColor: color,
        borderWidth: 2,
        fill: false,
        tension: 0.35,
        pointRadius: 0,
      },
    ],
  };

  const sparkOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e2a47",
        bodyColor: "#f9fafb",
        callbacks: {
          title: () => "",
          label: (ctx) => `$${ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: { x: { display: false }, y: { display: false } },
  };

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
      <p className="text-xs text-gray-500 mb-3">{change}</p>

      <div className="h-10 sm:h-12">
        <Line data={sparkData} options={sparkOptions} />
      </div>
    </div>
  );
}
