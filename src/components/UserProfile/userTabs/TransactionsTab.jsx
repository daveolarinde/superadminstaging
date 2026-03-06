import React from "react";
import { useNavigate } from "react-router-dom";

const STATUS_STYLES = {
  success: "bg-green-50 text-green-600 border-green-200",
  completed: "bg-green-50 text-green-600 border-green-200",
  pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
  failed: "bg-red-50 text-red-500 border-red-200",
  reversed: "bg-gray-100 text-gray-500 border-gray-200",
};

const TYPE_ICONS = {
  credit: "↑",
  debit: "↓",
  transfer: "⇄",
  deposit: "↑",
  withdrawal: "↓",
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status?.toLowerCase()] || "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${style}`}>
      {status}
    </span>
  );
}

function BalanceCell({ value, currency }) {
  if (value == null || value === undefined || value === "") {
    return <span className="text-gray-300">—</span>;
  }
  return (
    <span className="font-mono text-gray-700">
      {Number(value).toLocaleString()}
      {currency && <span className="text-xs text-gray-400 ml-1">{currency}</span>}
    </span>
  );
}

export default function TransactionsTab({
  txns,
  txnsLoading,
  txnsCount,
  txnsPage,
  txnsPagesTotal,
  setTxnsPage,
}) {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Transactions</h3>
          {txnsCount !== null && (
            <p className="text-xs text-gray-400 mt-0.5">{txnsCount} total records</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Txn ID",
                  "Type",
                  "Amount",
                  "Currency",
                  "Old Balance",
                  "New Balance",
                  "Status",
                  "Date",
                  "",
                ].map((h) => (
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
              {txnsLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : txns.length > 0 ? (
                txns.map((t) => {
                  const typeKey = (t.type || t.class || "").toLowerCase();
                  const typeIcon = TYPE_ICONS[typeKey] || "·";
                  const isCredit = ["credit", "deposit"].includes(typeKey);

                  return (
                    <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Txn ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {String(t.transaction_id || t.reference_id || t.id).slice(-12)}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            isCredit
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-500"
                          }`}
                        >
                          <span>{typeIcon}</span>
                          {t.type || t.class || "—"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            isCredit ? "text-emerald-600" : "text-rose-500"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {Number(t.amount || t.total_amount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Currency */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          {t.currency || "—"}
                        </span>
                      </td>

                      {/* Old Balance */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <BalanceCell
                          value={t.old_balance ?? t.previousBalance ?? t.balance_before}
                          currency={t.currency}
                        />
                      </td>

                      {/* New Balance */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <BalanceCell
                          value={t.new_balance ?? t.newBalance ?? t.balance_after}
                          currency={t.currency}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                        {new Date(t.createdAt || t.created_at || Date.now()).toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() =>
                            navigate(`/admin/transactions/${t.id}`, {
                              state: { transaction: t },
                            })
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-16">
                    <div className="text-4xl mb-2">📭</div>
                    <div className="text-gray-400 text-sm">No transactions found</div>
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
          {txnsCount !== null ? (
            <span>
              Page <strong>{txnsPage + 1}</strong> of <strong>{txnsPagesTotal ?? "?"}</strong> —{" "}
              {txnsCount} total
            </span>
          ) : (
            <span>Page {txnsPage + 1}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTxnsPage((p) => Math.max(0, p - 1))}
            disabled={txnsPage === 0}
            className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-40 text-sm hover:bg-gray-50 transition"
          >
            ← Prev
          </button>
          <button
            onClick={() => setTxnsPage((p) => p + 1)}
            disabled={txnsPagesTotal !== null && txnsPage + 1 >= txnsPagesTotal}
            className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-40 text-sm hover:bg-gray-50 transition"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}