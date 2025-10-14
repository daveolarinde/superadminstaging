import { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

// ✅ Register everything we use (Filler is needed for `fill`)
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function TransactionSummary() {
  const [summary, setSummary] = useState(null);
  const [thisMonth, setThisMonth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/superAdmin/get-transaction-summary`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("📦 API response:", res.data);

        // ✅ Pull fields directly from the documented response
        setSummary(res.data.summary || {});
        setThisMonth(res.data.thisMonth || {});
      } catch (err) {
        console.error("❌ Error fetching transaction summary:", err.response || err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <p className="text-gray-500 text-center">Loading summary...</p>;
  if (!summary || !Object.keys(summary).length)
    return <p className="text-red-500 text-center">No data available</p>;

  // ✅ Prepare chart data from thisMonth (fake daily points if backend doesn't provide dates)
  const labels = (thisMonth.breakdown || []).map(
    (b, i) => `${b.currency}-${b.type}-${i + 1}`
  );
  const values = (thisMonth.breakdown || []).map(b => Number(b.totalAmount) || 0);

  const data = {
    labels,
    datasets: [
      {
        label: "Monthly Transactions",
        data: values,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e2a47",
        bodyColor: "#f9fafb",
        callbacks: {
          label: (ctx) =>
            `$${(ctx.raw || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: "#6b7280" }, grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { color: "#6b7280", callback: v => v.toLocaleString() },
        grid: { color: "#e5e7eb" },
      },
    },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Chart */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Transaction Graph</h2>
        </div>
        <p className="mb-2 text-sm font-medium text-gray-600">
          Total Transactions:{" "}
          <span className="font-bold text-gray-900">
            {(summary.totalTransactions || 0).toLocaleString()}
          </span>
          {" | "}
          Total Value:{" "}
          <span className="font-bold text-gray-900">
            ${(summary.totalValue || 0).toLocaleString()}
          </span>
        </p>
        <div className="h-80">
          <Line data={data} options={options} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Transactions"
          value={(summary.totalTransactions || 0).toLocaleString()}
        />
        <SummaryCard
          title="Total Value"
          value={`$${(summary.totalValue || 0).toLocaleString()}`}
        />
        <SummaryCard
          title="This Month Transactions"
          value={(thisMonth.totalTransactions || 0).toLocaleString()}
        />
        <SummaryCard
          title="This Month Value"
          value={`$${(thisMonth.totalValue || 0).toLocaleString()}`}
        />
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow text-center">
      <p className="text-sm text-gray-500">{title.toUpperCase()}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
