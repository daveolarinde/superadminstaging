import { useState } from "react";

const transactionsData = [
  { id: 1, transactionId: "PAJEGZGM3C98", user: { name: "Michael Damalie", username: "@demouser" }, amount: "+66.67 USD", charge: "0.53 USD", remarks: "Deposit Via RazorPay", dateTime: "06.10.2025" },
  { id: 2, transactionId: "YSABGA7D1X9R", user: { name: "Michael Damalie", username: "@demouser" }, amount: "+111.11 USD", charge: "0 USD", remarks: "Converted Money From EUR wallet", dateTime: "23.09.2025" },
  { id: 3, transactionId: "GJYSDMHXGT8F", user: { name: "Michael Damalie", username: "@demouser" }, amount: "-111.11 USD", charge: "0 USD", remarks: "Converted Money to BDT wallet", dateTime: "23.09.2025" },
  { id: 4, transactionId: "3P55NBORSCR", user: { name: "Michael Damalie", username: "@demouser" }, amount: "-100 USD", charge: "0 USD", remarks: "Transferred Money Via Stripe", dateTime: "19.09.2025" },
  { id: 5, transactionId: "OKSD5GSSBUYD", user: { name: "Michael Damalie", username: "@demouser" }, amount: "+200 USD", charge: "0 USD", remarks: "Converted Money From USD wallet", dateTime: "16.09.2025" },
  { id: 6, transactionId: "HKXYCX8YD2TJ", user: { name: "Michael Damalie", username: "@demouser" }, amount: "-200 USD", charge: "0 USD", remarks: "Converted Money to BDT wallet", dateTime: "16.09.2025" },
];

export default function TransactionTable() {
  const [transactions] = useState(transactionsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterTransactionId, setFilterTransactionId] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Filtering logic
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilterId = filterTransactionId
      ? tx.transactionId.toLowerCase().includes(filterTransactionId.toLowerCase())
      : true;

    const matchesDate = filterDateRange
      ? tx.dateTime.includes(filterDateRange) // simple check for now
      : true;

    return matchesSearch && matchesFilterId && matchesDate;
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
        <div className="absolute top-24 right-10 bg-white shadow-lg rounded-xl p-4 w-72 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filter</h3>
            <button onClick={() => setShowFilter(false)} className="text-gray-500">✕</button>
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Transaction ID</label>
            <input
              type="text"
              value={filterTransactionId}
              onChange={(e) => setFilterTransactionId(e.target.value)}
              className="border rounded-lg w-full px-3 py-2 text-sm"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Date Range</label>
            <input
              type="text"
              placeholder="YYYY-MM-DD"
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="border rounded-lg w-full px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-between mt-4">
            <button
              onClick={() => {
                setFilterTransactionId("");
                setFilterDateRange("");
              }}
              className="border px-4 py-2 rounded-lg text-sm"
            >
              Clear Filters
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
            <tr key={tx.id} className="border-b last:border-0">
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
              <td className={`px-4 py-2 font-semibold ${tx.amount.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                {tx.amount}
              </td>
              <td className="px-4 py-2 text-red-500">{tx.charge}</td>
              <td className="px-4 py-2">{tx.remarks}</td>
              <td className="px-4 py-2">{tx.dateTime}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Footer */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span>
          Showing {startIndex + 1}–
          {Math.min(startIndex + pageSize, filteredTransactions.length)} of {filteredTransactions.length}
        </span>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className={`px-3 py-1 border rounded ${currentPage === 1 ? "text-gray-400" : "hover:bg-gray-100"}`}
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className={`px-3 py-1 border rounded ${currentPage === totalPages ? "text-gray-400" : "hover:bg-gray-100"}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
