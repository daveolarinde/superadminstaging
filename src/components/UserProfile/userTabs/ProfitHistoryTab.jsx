import React from "react";

export default function ProfitHistoryTab({
  profits,
  profitsLoading,
  profitsCount,
  profitsPage,
  profitsPagesTotal,
  profitSummary,
  setProfitsPage,
}) {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Profit History</h3>
          <p className="text-xs text-gray-400 mt-0.5">Profits & summary for this user</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-100 rounded-2xl p-5">
          <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Total Profit</div>
          <div className="text-2xl font-bold text-emerald-700">
            {profitSummary?.totalProfit
              ? Number(profitSummary.totalProfit).toLocaleString()
              : "₦0"}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100 rounded-2xl p-5">
          <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Monthly (Latest)</div>
          <div className="text-lg font-semibold text-blue-700">
            {Array.isArray(profitSummary?.monthlyProfit) && profitSummary.monthlyProfit.length > 0
              ? `${profitSummary.monthlyProfit[0].month}: ${Number(
                  profitSummary.monthlyProfit[0].amount
                ).toLocaleString()}`
              : "—"}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 rounded-2xl p-5">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Records</div>
          <div className="text-2xl font-bold text-gray-800">{profitsCount ?? profits.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Profit ID", "Txn ID", "Txn Amount", "Profit", "Currency", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {profitsLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Loading profits...</span>
                    </div>
                  </td>
                </tr>
              ) : profits.length > 0 ? (
                profits.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {String(p.id).slice(-10)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-400">
                        {String(p.transactionId || "—").slice(-10)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-gray-700">
                      {Number(p.transaction?.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-emerald-600">
                        +{Number(p.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        {p.currency || p.transaction?.currency || "NGN"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                      {new Date(p.createdAt || Date.now()).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-gray-400 text-sm">No profit records found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-2">
        <div className="text-sm text-gray-500">
          {profitsCount !== null ? (
            <span>
              Page <strong>{profitsPage + 1}</strong> of <strong>{profitsPagesTotal ?? "?"}</strong>{" "}
              — {profitsCount} total
            </span>
          ) : (
            <span>Page {profitsPage + 1}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setProfitsPage((p) => Math.max(0, p - 1))}
            disabled={profitsPage === 0}
            className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-40 text-sm hover:bg-gray-50 transition"
          >
            ← Prev
          </button>
          <button
            onClick={() => setProfitsPage((p) => p + 1)}
            disabled={profitsPagesTotal !== null && profitsPage + 1 >= profitsPagesTotal}
            className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-40 text-sm hover:bg-gray-50 transition"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}