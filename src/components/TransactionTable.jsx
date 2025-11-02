import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

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

  const pageSize = 10;
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_API_URL;

  // ✅ Currency passed from WalletCurrency.jsx
  const selectedCurrency = location.state?.currency || "";

  // ✅ Fetch Transactions
  const fetchTransactions = useCallback(
    async (currencyFilter = "") => {
      setLoading(true);
      try {
        const params = {};
        if (filterStartDate) params.startDate = filterStartDate;
        if (filterEndDate) params.endDate = filterEndDate;
        if (filterType) params.type = filterType;

        // ✅ Only apply currency filter automatically when coming from WalletCurrency
        if (currencyFilter) {
          params.currency = currencyFilter;
        } else if (filterCurrency) {
          params.currency = filterCurrency;
        }

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
        console.error("❌ Error fetching transactions:", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    },
    [filterStartDate, filterEndDate, filterCurrency, filterType, token, baseUrl]
  );

  // ✅ Fetch when mounted
  useEffect(() => {
    if (selectedCurrency) {
      // Auto-filter only once if navigated with a currency
      fetchTransactions(selectedCurrency);
    } else {
      // Fetch all normally
      fetchTransactions();
    }
  }, [fetchTransactions, selectedCurrency]);

  // ✅ Filter logic for search + ID
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
  const currentTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  // ✅ Clear filters
  const handleClearFilters = () => {
    setFilterTransactionId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterCurrency("");
    setFilterType("");
    setCurrentPage(1);
    // When user clears, show all again (ignore selectedCurrency)
    fetchTransactions();
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6 md:p-8 relative">
      {/* ✅ Back Button */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 transition"
        >
          <FiArrowLeft className="text-gray-600" /> Back
        </button>
        {selectedCurrency && (
          <span className="text-sm text-gray-600">
            Viewing transactions in{" "}
            <span className="font-semibold">{selectedCurrency}</span>
          </span>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-3">
        <input
          type="text"
          placeholder="Search transaction"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-3 text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilter(true)}
            className="border border-gray-200 px-6 py-3 rounded-lg text-sm bg-gray-50 hover:bg-gray-100 transition"
          >
            ⚙️ Filter
          </button>
          <button
            onClick={handleClearFilters}
            className="border border-gray-200 px-6 py-3 rounded-lg text-sm bg-gray-50 hover:bg-gray-100 transition"
          >
            ❌ Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg">
        {loading ? (
          <div className="py-10 text-center text-gray-500">
            Loading transactions...
          </div>
        ) : currentTransactions.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No transactions found
          </div>
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
                  <th
                    key={header}
                    className="px-3 sm:px-6 py-3 font-medium text-gray-600"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((tx, index) => (
                <tr
                  key={tx.transactionId}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-3 sm:px-6 py-3">{startIndex + index + 1}</td>
                  <td className="px-3 sm:px-6 py-3 break-words">
                    {tx.transactionId}
                  </td>
                  <td className="px-3 sm:px-6 py-3 flex items-center gap-2 min-w-[150px]">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                      👤
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-xs sm:text-sm">
                        {tx.user.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        {tx.user.username}
                      </div>
                    </div>
                  </td>
                  <td
                    className={`px-3 sm:px-6 py-3 font-semibold ${
                      tx.amount.startsWith("+")
                        ? "text-green-600"
                        : "text-red-600"
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
      {filteredTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-600 gap-3">
          <span>
            Showing {startIndex + 1}–
            {Math.min(startIndex + pageSize, filteredTransactions.length)} of{" "}
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
                currentPage === totalPages
                  ? "text-gray-400"
                  : "hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md space-y-4">
            <h3 className="text-lg font-medium">Filter Transactions</h3>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={filterCurrency || selectedCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                disabled={!!selectedCurrency}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm col-span-2 bg-gray-50"
              >
                <option value="">All Currencies</option>
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm col-span-2"
              >
                <option value="">All Types</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            <div className="flex justify-between items-center gap-3 pt-4">
              <button
                onClick={() => setShowFilter(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setShowFilter(false);
                    fetchTransactions();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
