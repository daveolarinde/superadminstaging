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

  // Pagination states
  const [overallPage, setOverallPage] = useState(1);
  const [monthPage, setMonthPage] = useState(1);
  const [dailyPage, setDailyPage] = useState(1);

  const rowsPerPage = window.innerWidth < 640 ? 5 : 10; // Mobile vs Desktop

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

        setGraphData(graphRes.data?.data || {});
        setSummary(summaryRes.data?.summary || {});
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
        pointRadius: 3,
        pointHoverRadius: 5,
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
        ticks: { color: "#6b7280", font: { size: 11 } },
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

  // Helper function to paginate arrays
  const paginate = (data, page) => {
    const start = (page - 1) * rowsPerPage;
    return data?.slice(start, start + rowsPerPage) || [];
  };

  const overallPages = Math.ceil(summaryData.breakdown?.length / rowsPerPage) || 1;
  const monthPages = Math.ceil(thisMonth.breakdown?.length / rowsPerPage) || 1;
  const dailyPages = Math.ceil(daily.length / rowsPerPage) || 1;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* GRAPH CARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-lg font-semibold text-gray-800 text-center sm:text-left">
            Transaction Trend —{" "}
            {activeTab === "currentMonth"
              ? "This Month"
              : activeTab === "lastMonth"
              ? "Last Month"
              : "This Year"}
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-4">
          {["currentMonth", "lastMonth", "currentYear"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
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
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-6">
          {["", "credit", "debit"].map((t) => (
            <button
              key={t || "all"}
              onClick={() => setType(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                type === t
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Responsive & Scrollable Chart */}
        <div className="overflow-x-auto">
          <div className="h-64 sm:h-80 min-w-[600px]">
            <Line data={chartData} options={options} />
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          title="This Month Transactions"
          value={(thisMonth.totalTransactions || 0).toLocaleString()}
        />
        <SummaryCard
          title="This Month Value"
          value={`₦${Number(thisMonth.totalValue || 0).toLocaleString()}`}
        />
      </div>

      {/* OVERALL & MONTHLY BREAKDOWN */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-8">
        {/* Overall Breakdown */}
        <div className="overflow-x-auto">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Overall Breakdown
          </h3>
          <table className="min-w-full text-sm text-left border-collapse border-none">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-600">
                  Currency
                </th>
                <th className="px-6 py-4 font-medium text-gray-600">Type</th>
                <th className="px-6 py-4 font-medium text-gray-600">Amount</th>
                <th className="px-6 py-4 font-medium text-gray-600">Count</th>
              </tr>
            </thead>
            <tbody>
              {paginate(summaryData.breakdown, overallPage).map((b, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4 sm:px-4 ">{b.currency}</td>
                  <td className=" sm:px-4 px-6 py-4 capitalize">{b.type}</td>
                  <td className=" sm:px-4 px-6 py-4 font-semibold">
                    ₦{Number(b.totalAmount).toLocaleString()}
                  </td>
                  <td className="sm:px-4 px-6 py-4">{b.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={overallPage}
            totalPages={overallPages}
            setPage={setOverallPage}
          />
        </div>

        {/* This Month Breakdown */}
        <div className="overflow-x-auto">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            This Month Breakdown
          </h3>
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 py-3 font-medium text-gray-600">
                  Currency
                </th>
                <th className="px-3 sm:px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-3 sm:px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="px-3 sm:px-4 py-3 font-medium text-gray-600">Count</th>
              </tr>
            </thead>
            <tbody>
              {paginate(thisMonth.breakdown, monthPage).map((b, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 transition">
                  <td className="px-3 sm:px-4 py-3">{b.currency}</td>
                  <td className="px-3 sm:px-4 py-3 capitalize">{b.type}</td>
                  <td className="px-3 sm:px-4 py-3 font-semibold">
                    ₦{Number(b.totalAmount).toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-4 py-3">{b.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            currentPage={monthPage}
            totalPages={monthPages}
            setPage={setMonthPage}
          />
        </div>
      </div>

      {/* DAILY BREAKDOWN */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Daily Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="px-3 sm:px-4 py-3 font-medium text-gray-600">Currency</th>
                <th className="px-3 sm:px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-3 sm:px-4 py-3 font-medium text-gray-600">Amount</th>
                <th className="px-3 sm:px-4 py-3 font-medium text-gray-600">Count</th>
              </tr>
            </thead>
            <tbody>
              {paginate(daily, dailyPage).map((d, idx) =>
                d.breakdown?.map((b, j) => (
                  <tr
                    key={`${idx}-${j}`}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-3 sm:px-4 py-3">
                      {new Date(d.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-3 sm:px-4 py-3">{b.currency}</td>
                    <td className="px-3 sm:px-4 py-3 capitalize">{b.type}</td>
                    <td className="px-3 sm:px-4 py-3 font-semibold">
                      ₦{Number(b.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3">{b.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={dailyPage}
            totalPages={dailyPages}
            setPage={setDailyPage}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow text-center border border-gray-100">
      <p className="text-xs sm:text-sm text-gray-500">{title.toUpperCase()}</p>
      <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

// Simple Pagination Component
function Pagination({ currentPage, totalPages, setPage }) {
  return (
    <div className="flex items-center justify-center mt-2 gap-2 text-sm">
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={currentPage === 1}
        className="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        Prev
      </button>
      <span>
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
