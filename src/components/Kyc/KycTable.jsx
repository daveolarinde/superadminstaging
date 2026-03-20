// components/KycTable.jsx
import { useState } from "react";
import { MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import KycUpdateModal from "../../components/KycUpdateModal";

// ── Pagination helper: generates page numbers with ellipsis ──────────────────
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    success:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    pending:  "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    rejected: "bg-red-50 text-red-600 ring-1 ring-red-200",
    failed:   "bg-red-50 text-red-600 ring-1 ring-red-200",
  };
  const cls = map[status] || "bg-gray-100 text-gray-500 ring-1 ring-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === "approved" || status === "success" ? "bg-emerald-500" :
        status === "pending" ? "bg-amber-500" : "bg-red-500"
      }`} />
      {status}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const KycTable = ({
  data,
  currentPage,
  totalCount,
  rowsPerPage,
  tableLoading,
  actionOpenId,
  setActionOpenId,
  onStatusChange,
  onPageChange,
}) => {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);

  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalCount);

  return (
    <>
      {tableLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <span className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
          Updating results…
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["No.", "User", "Type", "Status", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 text-sm">
                    No KYC records found
                  </td>
                </tr>
              ) : data.map((record, i) => (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  {/* No. */}
                  <td className="px-5 py-4 text-gray-400 text-xs font-mono">
                    {String((currentPage - 1) * rowsPerPage + i + 1).padStart(2, "0")}
                  </td>

                  {/* User */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={record.documentUrl || record.selfieUrl}
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${record.user?.firstname}+${record.user?.lastname}&background=e0e7ff&color=4f46e5&size=64`; }}
                          className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover"
                          alt="avatar"
                        />
                        {/* online dot placeholder */}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm leading-tight">
                          {record.user?.firstname} {record.user?.lastname}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">@{record.user?.tag}</p>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium capitalize">
                      {record.type}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge status={record.status} />
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4 relative">
                    <button
                      onClick={() => setActionOpenId(actionOpenId === record.id ? null : record.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                    >
                      Action <MoreVertical size={13} />
                    </button>

                    {actionOpenId === record.id && (
                      <>
                        {/* Backdrop to close */}
                        <div className="fixed inset-0 z-10" onClick={() => setActionOpenId(null)} />
                        <div className="absolute right-4 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                          <button onClick={() => onStatusChange(record, "approved")} className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-emerald-50 text-emerald-700 transition">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Approve
                          </button>
                          <button onClick={() => onStatusChange(record, "pending")} className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-amber-50 text-amber-700 transition">
                            <span className="w-2 h-2 rounded-full bg-amber-400" /> Set Pending
                          </button>
                          <button onClick={() => onStatusChange(record, "rejected")} className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-red-50 text-red-600 transition">
                            <span className="w-2 h-2 rounded-full bg-red-500" /> Reject
                          </button>
                          <div className="h-px bg-gray-100 my-1" />
                          <button onClick={() => { navigate(`/admin/all-users/${record.user.id}`); setActionOpenId(null); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-gray-50 text-gray-700 transition">
                            👤 View Profile
                          </button>
                          <button
                            onClick={() => { setSelectedUser(record.user); setActionOpenId(null); }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-blue-50 text-blue-600 transition"
                          >
                            ✏️ Update KYC
                          </button>
                          {(record.documentUrl || record.selfieUrl) && (
                            <a
                              href={record.documentUrl || record.selfieUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-blue-50 text-blue-600 transition"
                            >
                              🔍 View Document
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalCount > rowsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 bg-gray-50/60">

            {/* Count info */}
            <p className="text-xs text-gray-400 shrink-0">
              Showing <span className="font-semibold text-gray-600">{startItem}–{endItem}</span> of{" "}
              <span className="font-semibold text-gray-600">{totalCount}</span> records
            </p>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition ${
                  currentPage === 1
                    ? "border-gray-100 text-gray-300 cursor-not-allowed bg-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"
                }`}
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page numbers */}
              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition ${
                      p === currentPage
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition ${
                  currentPage === totalPages
                    ? "border-gray-100 text-gray-300 cursor-not-allowed bg-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"
                }`}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── KYC Update Modal ── */}
      <KycUpdateModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        baseURL={import.meta.env.VITE_STAGE_API_URL}
        token={localStorage.getItem("token")}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
};

export default KycTable;