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
          charge: "0 USD", // backend doesn’t provide charge yet
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

  // Filtering logic (frontend search + transactionId)
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilterId = filterTransactionId
      ? tx.transactionId.toLowerCase().includes(filterTransactionId.toLowerCase())
      : true;

    return matchesSearch && matchesFilterId;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white rounded-xl shadow p-5 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search transaction"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm w-60"
        />

        <button
          onClick={() => setShowFilter(true)}
          className="border px-4 py-2 rounded-lg text-sm bg-gray-50 hover:bg-gray-100"
        >
          ⚙️ Filter
        </button>
      </div>

      {/* Filter Modal */}
      {showFilter && (
        <div className="absolute top-24 right-10 bg-white shadow-lg rounded-xl p-4 w-80 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filter Transactions</h3>
            <button onClick={() => setShowFilter(false)} className="text-gray-500">
              ✕
            </button>
          </div>

          {/* Transaction ID */}
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Transaction ID</label>
            <input
              type="text"
              value={filterTransactionId}
              onChange={(e) => setFilterTransactionId(e.target.value)}
              className="border rounded-lg w-full px-3 py-2 text-sm"
            />
          </div>

          {/* Date Range */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="border rounded-lg w-full px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border rounded-lg w-full px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Currency */}
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Currency</label>
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="border rounded-lg w-full px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
            </select>
          </div>

          {/* Type */}
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Transaction Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded-lg w-full px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => {
                setFilterTransactionId("");
                setFilterStartDate("");
                setFilterEndDate("");
                setFilterCurrency("");
                setFilterType("");
              }}
              className="border px-4 py-2 rounded-lg text-sm"
            >
              Clear
            </button>
            <button
              onClick={() => setShowFilter(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-10 text-center text-gray-500">Loading transactions...</div>
      ) : currentTransactions.length === 0 ? (
        <div className="py-10 text-center text-gray-500">No transactions found</div>
      ) : (
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 font-medium text-gray-600">NO.</th>
              <th className="px-4 py-2 font-medium text-gray-600">TRANSACTION ID</th>
              <th className="px-4 py-2 font-medium text-gray-600">USER</th>
              <th className="px-4 py-2 font-medium text-gray-600">AMOUNT</th>
              <th className="px-4 py-2 font-medium text-gray-600">CHARGE</th>
              <th className="px-4 py-2 font-medium text-gray-600">REMARKS</th>
              <th className="px-4 py-2 font-medium text-gray-600">DATE-TIME</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((tx, index) => (
              <tr key={tx.transactionId} className="border-b last:border-0">
                <td className="px-4 py-2">{startIndex + index + 1}</td>
                <td className="px-4 py-2">{tx.transactionId}</td>
                <td className="px-4 py-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                    👤
                  </div>
                  <div>
                    <div className="font-medium">{tx.user.name}</div>
                    <div className="text-xs text-gray-500">{tx.user.username}</div>
                  </div>
                </td>
                <td
                  className={`px-4 py-2 font-semibold ${
                    tx.amount.startsWith("+") ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.amount}
                </td>
                <td className="px-4 py-2 text-red-500">{tx.charge}</td>
                <td className="px-4 py-2">{tx.remarks}</td>
                <td className="px-4 py-2">{tx.dateTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span>
          Showing {startIndex + 1}–
          {Math.min(startIndex + pageSize, filteredTransactions.length)} of{" "}
          {filteredTransactions.length}
        </span>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className={`px-3 py-1 border rounded ${
              currentPage === 1 ? "text-gray-400" : "hover:bg-gray-100"
            }`}
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className={`px-3 py-1 border rounded ${
              currentPage === totalPages ? "text-gray-400" : "hover:bg-gray-100"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
