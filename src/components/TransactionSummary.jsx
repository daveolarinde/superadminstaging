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
  Filler,
} from "chart.js";

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

export default function TransactionSummary() {
  const [graphData, setGraphData] = useState({});
  const [summary, setSummary] = useState({});
  const [activeTab, setActiveTab] = useState("currentMonth");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const [graphRes, summaryRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_URL}/superAdmin/get-transaction-graph${
              type ? `?type=${type}` : ""
            }`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(
            `${import.meta.env.VITE_API_URL}/superAdmin/get-transaction-summary`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);

       

       
        setGraphData(graphRes.data?.data || {}); // data.currentMonth, etc.
        setSummary(summaryRes.data?.summary || {}); // summary.summary, thisMonth, daily
      } catch (err) {
        console.error("❌ Error fetching data:", err.response || err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  if (loading)
    return <p className="text-gray-500 text-center">Loading dashboard...</p>;

  //  Graph logic
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

  const options = {
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


  const summaryData = summary?.summary || {};
  const thisMonth = summary?.thisMonth || {};
  const daily = summary?.daily || [];

  return (
    <div className="p-6 space-y-6">
      {/* GRAPH CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap justify-between items-center mb-4">
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

        {/* Filter Buttons */}
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

        <div className="h-80">
          <Line data={chartData} options={options} />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Transactions"
          value={(summaryData.totalTransactions || 0).toLocaleString()}
        />
        <SummaryCard
          title="Total Value"
          value={`₦${Number(summaryData.totalValue || 0).toLocaleString()}`}
        />
        <SummaryCard
          title="This Month Transactions"
          value={(thisMonth.totalTransactions || 0).toLocaleString()}
        />
        <SummaryCard
          title="This Month Value"
          value={`₦${Number(thisMonth.totalValue || 0).toLocaleString()}`}
        />
      </div>

      {/* DAILY BREAKDOWN */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Daily Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 font-medium text-gray-600">Currency</th>
                <th className="px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 font-medium text-gray-600">Count</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d, idx) =>
                d.breakdown?.map((b, j) => (
                  <tr
                    key={`${idx}-${j}`}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">
                      {new Date(d.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">{b.currency}</td>
                    <td className="px-4 py-3 capitalize">{b.type}</td>
                    <td className="px-4 py-3 font-semibold">
                      ₦{Number(b.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{b.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow text-center border border-gray-100">
      <p className="text-sm text-gray-500">{title.toUpperCase()}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
