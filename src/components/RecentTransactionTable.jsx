import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
export default function RecentTransactionTable() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_STAGE_URL;


  const fetchRecentTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/superAdmin/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && Array.isArray(res.data.data)) {
        const now = dayjs();
        const recent = res.data.data.filter((tx) => {
          const createdAt = dayjs(tx.createdAt);
          return now.diff(createdAt, "minute") <= 30;
        });

        const sorted = recent.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const formatted = sorted.map((tx, idx) => ({
          id: idx + 1,
          transactionId: tx.id,
          user: {
            name: `${tx.user?.firstname || "Unknown"} ${tx.user?.lastname || ""}`.trim(),
            username: tx.user?.tag ? `@${tx.user.tag}` : tx.user?.email || "",
          },
          amount: `${tx.type === "credit" ? "+" : "-"}${tx.amount} ${tx.currency}`,
          charge: tx.fee ? `${tx.fee} ${tx.currency}` : "0.00",
          remarks: tx.info || tx.type || "-",
          dateTime: new Date(tx.createdAt || Date.now()).toLocaleString(),
          raw: tx,
        }));

        setTransactions(formatted);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("❌ Error fetching recent transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl]);


  useEffect(() => {
    fetchRecentTransactions();
    const interval = setInterval(fetchRecentTransactions, 30000);
    return () => clearInterval(interval);
  }, [fetchRecentTransactions]);

  const totalPages = Math.ceil(transactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentTransactions = transactions.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6 md:p-8 relative">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">

        <span className="text-sm text-gray-600 font-medium">
          Recent Transactions (Last 30 mins, auto-updating)
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading recent transactions...</div>
        ) : currentTransactions.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No recent transactions in the last 30 minutes</div>
        ) : (
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "NO.",
                  "TRANSACTION ID",
                  "USER",
                  "AMOUNT",
                  "CHARGE",
                  "REMARKS",
                  "DATE-TIME",
                  "ACTION",
                ].map((header) => (
                  <th key={header} className="px-3 sm:px-6 py-3 font-medium text-gray-600">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((tx, index) => (
                <tr key={tx.transactionId} className="hover:bg-gray-50 transition">
                  <td className="px-3 sm:px-6 py-3">{startIndex + index + 1}</td>
                  <td className="px-3 sm:px-6 py-3 break-words">{tx.transactionId}</td>
                  <td className="px-3 sm:px-6 py-3 flex items-center gap-2 min-w-[150px]">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                      👤
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-xs sm:text-sm">{tx.user.name}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">{tx.user.username}</div>
                    </div>
                  </td>
                  <td
                    className={`px-3 sm:px-6 py-3 font-semibold ${tx.amount.startsWith("+") ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {tx.amount}
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-red-500">{tx.charge}</td>
                  <td className="px-3 sm:px-6 py-3">{tx.remarks}</td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm">
                    {tx.dateTime}
                  </td>
                  <td className="px-3 sm:px-6 py-3">
                    <button
                      onClick={() =>
                        navigate(`/admin/transactions/view`, {
                          state: { transaction: tx.raw },
                        })
                      }
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-600 gap-3">
          <span>
            Showing {startIndex + 1}–
            {Math.min(startIndex + pageSize, transactions.length)} of{" "}
            {transactions.length}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={`px-4 py-2 rounded-lg border border-gray-200 ${currentPage === 1 ? "text-gray-400" : "hover:bg-gray-50"
                }`}
            >
              Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`px-4 py-2 rounded-lg border border-gray-200 ${currentPage === totalPages ? "text-gray-400" : "hover:bg-gray-50"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
