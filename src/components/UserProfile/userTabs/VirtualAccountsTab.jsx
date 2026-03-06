import React from "react";

export default function VirtualAccountsTab({
  virtualAccounts,
  virtualAccountsLoading,
  virtualAccountsError,
  virtualAccountsCount,
  virtualAccountsPage,
  virtualAccountsPagesTotal,
  setVirtualAccountsPage,
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Virtual Accounts</h3>
          <p className="text-xs text-gray-400 mt-0.5">All virtual accounts linked to this user</p>
        </div>
        {virtualAccountsCount !== null && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium border border-blue-100 w-fit">
            {virtualAccountsCount} total
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Account Name", "Account Number", "Bank", "Currency", "Status", "Created At"].map((h) => (
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
              {virtualAccountsLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Loading accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : virtualAccountsError ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-red-400">
                    <div className="text-2xl mb-2">⚠️</div>
                    {virtualAccountsError}
                  </td>
                </tr>
              ) : virtualAccounts.length > 0 ? (
                virtualAccounts.map((va) => (
                  <tr key={va.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-gray-800">
                      {va.accountName || "N/A"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-gray-600">{va.accountNumber || "—"}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">{va.bank || "—"}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        {va.currency || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          va.status === "active"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : va.status === "pending"
                            ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                            : "bg-red-50 text-red-500 border-red-200"
                        }`}
                      >
                        {va.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-500">
                      {new Date(va.createdAt || Date.now()).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <div className="text-4xl mb-2">🏦</div>
                    <div className="text-gray-400 text-sm">No virtual accounts found</div>
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
          {virtualAccountsCount !== null ? (
            <span>
              Page <strong>{virtualAccountsPage + 1}</strong> of{" "}
              <strong>{virtualAccountsPagesTotal ?? "?"}</strong> — {virtualAccountsCount} total
            </span>
          ) : (
            <span>Page {virtualAccountsPage + 1}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVirtualAccountsPage((p) => Math.max(0, p - 1))}
            disabled={virtualAccountsPage === 0}
            className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-40 text-sm hover:bg-gray-50 transition"
          >
            ← Prev
          </button>
          <button
            onClick={() => setVirtualAccountsPage((p) => p + 1)}
            disabled={
              virtualAccountsPagesTotal !== null &&
              virtualAccountsPage + 1 >= virtualAccountsPagesTotal
            }
            className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-40 text-sm hover:bg-gray-50 transition"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}