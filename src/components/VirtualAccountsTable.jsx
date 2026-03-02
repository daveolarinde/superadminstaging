import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    active: { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    pending: { cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-400" },
    inactive: { cls: "bg-gray-100 text-gray-500 ring-1 ring-gray-200", dot: "bg-gray-400" },
  };
  const s = String(status || "").toLowerCase();
  const style = map[s] || map.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {s || "N/A"}
    </span>
  );
};

// ── Page numbers ─────────────────────────────────────────────────────────────
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

export default function VirtualAccountsTable({
  accounts,
  totalAccounts,
  limit,
  offset,
  onPageChange,
  loading,
  error,
  onRetry,
  onRowClick,
}) {
  const totalPages = Math.max(1, Math.ceil(totalAccounts / limit));
  const currentPage = Math.floor(offset / limit) + 1;
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const startItem = totalAccounts === 0 ? 0 : offset + 1;
  const endItem = Math.min(offset + limit, totalAccounts);

  const thCls = "px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap";
  const tdCls = "px-5 py-4 text-sm text-gray-700";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-sm text-gray-400">Loading accounts…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <p className="text-2xl">⚠️</p>
          <p className="text-sm font-medium text-red-500">{error}</p>
          <button onClick={onRetry} className="mt-2 px-4 py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
            Try again
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <p className="text-3xl">🏦</p>
          <p className="text-sm font-medium text-gray-500">No accounts found</p>
          <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className={thCls}>Account Name</th>
                <th className={thCls}>Account Number</th>
                <th className={thCls}>Bank</th>
                <th className={thCls}>Currency</th>
                <th className={thCls}>User</th>
                <th className={thCls}>Email</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {accounts.map((va) => (
                <tr
                  key={va.id}
                  onClick={() => onRowClick?.(va)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                >
                  <td className={`${tdCls} font-semibold text-gray-900`}>{va.accountName || "N/A"}</td>
                  <td className={`${tdCls} font-mono text-xs tracking-wider text-gray-500`}>{va.accountNumber || "—"}</td>
                  <td className={tdCls}>{va.bank || "—"}</td>
                  <td className={tdCls}>
                    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                      {va.currency || "—"}
                    </span>
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                        {va.user?.firstname?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="text-gray-800 font-medium">
                        {va.user?.firstname ? `${va.user.firstname} ${va.user.lastname || ""}` : "—"}
                      </span>
                    </div>
                  </td>
                  <td className={`${tdCls} text-gray-500 text-xs`}>{va.user?.email || "—"}</td>
                  <td className={tdCls}>
                    <StatusBadge status={va.status} />
                  </td>
                  <td className={`${tdCls} text-xs text-gray-400 whitespace-nowrap`}>
                    {va.createdAt ? new Date(va.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalAccounts > limit && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-xs text-gray-400 shrink-0">
            Showing <span className="font-semibold text-gray-600">{startItem}–{endItem}</span> of{" "}
            <span className="font-semibold text-gray-600">{totalAccounts}</span> accounts
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(offset - limit)}
              disabled={offset === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={15} />
            </button>

            {pageNumbers.map((p, idx) =>
              p === "..." ? (
                <span key={`e${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange((p - 1) * limit)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition ${
                    p === currentPage ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => onPageChange(offset + limit)}
              disabled={offset + limit >= totalAccounts}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}