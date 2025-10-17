import { useState, useEffect } from "react";
import axios from "axios";

export default function TransactionTable() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterTransactionId, setFilterTransactionId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_API_URL;

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterCurrency) params.currency = filterCurrency;
      if (filterType) params.type = filterType;

      const res = await axios.get(`${baseUrl}/superAdmin/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data.success && Array.isArray(res.data.data)) {
        const formatted = res.data.data.map((tx, idx) => ({
          id: idx + 1,
          transactionId: tx.id,
          user: {
            name: `${tx.user?.firstname || "Unknown"} ${tx.user?.lastname || ""}`.trim(),
            username: tx.user?.tag ? `@${tx.user.tag}` : tx.user?.email || "",
          },
          amount: `${tx.type === "credit" ? "+" : "-"}${tx.amount} ${tx.currency}`,
          charge: "0 USD",
          remarks: tx.type ? tx.type.charAt(0).toUpperCase() + tx.type.slice(1) : "-",
          dateTime: new Date(tx.createdAt || Date.now()).toLocaleString(),
        }));

        setTransactions(formatted);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterStartDate, filterEndDate, filterCurrency, filterType]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilterId = filterTransactionId
      ? tx.transactionId.toLowerCase().includes(filterTransactionId.toLowerCase())
      : true;

    return matchesSearch && matchesFilterId;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + pageSize
  );

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6 md:p-8 relative">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-3">
        <input
          type="text"
          placeholder="Search transaction"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-3 text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          onClick={() => setShowFilter(true)}
          className="border border-gray-200 px-6 py-3 rounded-lg text-sm bg-gray-50 hover:bg-gray-100 transition w-full sm:w-auto"
        >
          ⚙️ Filter
        </button>
      </div>

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-lg rounded-xl p-5 w-full max-w-sm relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Filter Transactions</h3>
              <button
                onClick={() => setShowFilter(false)}
                className="text-gray-500 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Transaction ID</label>
              <input
                type="text"
                value={filterTransactionId}
                onChange={(e) => setFilterTransactionId(e.target.value)}
                className="border border-gray-200 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="border border-gray-200 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Currency</label>
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="border border-gray-200 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All</option>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Transaction Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-200 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">All</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4">
              <button
                onClick={() => {
                  setFilterTransactionId("");
                  setFilterStartDate("");
                  setFilterEndDate("");
                  setFilterCurrency("");
                  setFilterType("");
                }}
                className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 w-full sm:w-auto"
              >
                Clear
              </button>
              <button
                onClick={() => setShowFilter(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 w-full sm:w-auto"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading transactions...</div>
        ) : currentTransactions.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No transactions found</div>
        ) : (
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {["NO.", "TRANSACTION ID", "USER", "AMOUNT", "CHARGE", "REMARKS", "DATE-TIME"].map(
                  (header) => (
                    <th key={header} className="px-3 sm:px-6 py-3 font-medium text-gray-600">
                      {header}
                    </th>
                  )
                )}
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
                    className={`px-3 sm:px-6 py-3 font-semibold ${
                      tx.amount.startsWith("+") ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount}
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-red-500">{tx.charge}</td>
                  <td className="px-3 sm:px-6 py-3">{tx.remarks}</td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm">{tx.dateTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-600 gap-3">
        <span>
          Showing {startIndex + 1}–{Math.min(startIndex + pageSize, filteredTransactions.length)} of{" "}
          {filteredTransactions.length}
        </span>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className={`px-4 py-2 rounded-lg border border-gray-200 ${
              currentPage === 1 ? "text-gray-400" : "hover:bg-gray-50"
            }`}
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className={`px-4 py-2 rounded-lg border border-gray-200 ${
              currentPage === totalPages ? "text-gray-400" : "hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
