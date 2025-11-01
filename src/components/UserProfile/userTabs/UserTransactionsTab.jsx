import React from "react";

export default function UserTransactionsTab({ transactions = [] }) {
  if (!transactions.length)
    return (
      <div className="text-gray-500 text-center py-6">
        No transaction records found.
      </div>
    );

  const formatAmount = (amount, currency = "NGN") =>
    parseFloat(amount || 0).toLocaleString("en-NG", {
      style: "currency",
      currency,
    });

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-x-auto">
      <table className="min-w-full text-sm text-gray-700">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100">
          <tr>
            <th className="px-6 py-3 text-left">No.</th>
            <th className="px-6 py-3 text-left">Type</th>
            <th className="px-6 py-3 text-left">Currency</th>
            <th className="px-6 py-3 text-left">Amount</th>
            <th className="px-6 py-3 text-left">Reference</th>
            <th className="px-6 py-3 text-left">Date</th>
            <th className="px-6 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <tr
              key={tx.id || i}
              className="border-b border-gray-100 hover:bg-gray-50 transition"
            >
              <td className="px-6 py-3">{i + 1}</td>
              <td className="px-6 py-3 font-medium text-gray-800 capitalize">
                {tx.type || "N/A"}
              </td>
              <td className="px-6 py-3 uppercase">{tx.currency || "NGN"}</td>
              <td className="px-6 py-3 font-semibold text-gray-900">
                {formatAmount(tx.amount, tx.currency)}
              </td>
              <td className="px-6 py-3 text-gray-600">{tx.reference || "—"}</td>
              <td className="px-6 py-3 text-gray-600">
                {tx.createdAt
                  ? new Date(tx.createdAt).toLocaleString()
                  : "N/A"}
              </td>
              <td className="px-6 py-3">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium ${
                    tx.status === "success"
                      ? "bg-green-100 text-green-600"
                      : tx.status === "pending"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {tx.status || "Unknown"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
