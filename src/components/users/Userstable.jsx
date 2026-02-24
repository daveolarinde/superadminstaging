// components/UsersTable.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    active:      { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    inactive:    { cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400"   },
    blocked:     { cls: "bg-red-50 text-red-600 ring-1 ring-red-200",             dot: "bg-red-500"     },
    deactivated: { cls: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",          dot: "bg-gray-400"    },
    deactivate:  { cls: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",          dot: "bg-gray-400"    },
  };
  const s     = String(status || "").toLowerCase();
  const style = map[s] || { cls: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {s || "N/A"}
    </span>
  );
};

// ── Page number generator ─────────────────────────────────────────────────────
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

// ── Main Component ────────────────────────────────────────────────────────────
const UsersTable = ({
  users,
  totalUsers,
  limit,
  offset,
  onPageChange,
  onStatusChange,
  statusUpdating,
}) => {
  const navigate    = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const totalPages  = Math.ceil(totalUsers / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const startItem   = offset + 1;
  const endItem     = Math.min(offset + limit, totalUsers);

  const statusOptions = ["active", "inactive", "blocked", "deactivated"];

  const thCls = "px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider";
  const tdCls = "px-5 py-4";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-3xl">👥</p>
            <p className="text-sm font-medium text-gray-500">No users found</p>
            <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className={thCls}>User</th>
                <th className={thCls}>Email / Phone</th>
                <th className={thCls}>Country</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Last Login</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/70 transition-colors group">

                  {/* User */}
                  <td className={tdCls}>
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/admin/all-users/${user.id}`)}
                    >
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0 uppercase">
                        {user.firstname?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition text-sm leading-tight">
                          {user.firstname} {user.lastname}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          @{user.tag || user.firstname?.toLowerCase() || "user"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email / Phone */}
                  <td className={tdCls}>
                    <p className="text-gray-700 text-sm">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{user.phoneNumber || "—"}</p>
                  </td>

                  {/* Country */}
                  <td className={`${tdCls} text-gray-600 text-sm`}>
                    {user.country || "—"}
                  </td>

                  {/* Status */}
                  <td className={tdCls}>
                    <StatusBadge status={user.status} />
                  </td>

                  {/* Last Login */}
                  <td className={`${tdCls} text-xs text-gray-400 whitespace-nowrap`}>
                    {user.lastLogin
                      ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
                      : "Never"}
                  </td>

                  {/* Actions */}
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      {/* View profile */}
                      <button
                        onClick={() => navigate(`/admin/all-users/${user.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                      >
                        <ExternalLink size={11} /> View
                      </button>

                      {/* Status dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition text-gray-500"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {openMenu === user.id && (
                          <>
                            {/* backdrop */}
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                              <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Set Status</p>
                              {statusOptions.map((s) => {
                                const colorMap = {
                                  active:      "text-emerald-700 hover:bg-emerald-50",
                                  inactive:    "text-amber-700 hover:bg-amber-50",
                                  blocked:     "text-red-600 hover:bg-red-50",
                                  deactivated: "text-gray-600 hover:bg-gray-50",
                                };
                                return (
                                  <button
                                    key={s}
                                    disabled={statusUpdating === user.id || user.status === s}
                                    onClick={() => { onStatusChange(user.id, s); setOpenMenu(null); }}
                                    className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium capitalize transition disabled:opacity-40 disabled:cursor-not-allowed ${colorMap[s]}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      s === "active" ? "bg-emerald-500" :
                                      s === "inactive" ? "bg-amber-400" :
                                      s === "blocked" ? "bg-red-500" : "bg-gray-400"
                                    }`} />
                                    {statusUpdating === user.id ? "Updating…" : s}
                                    {user.status === s && " ✓"}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalUsers > limit && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-xs text-gray-400 shrink-0">
            Showing <span className="font-semibold text-gray-600">{startItem}–{endItem}</span> of{" "}
            <span className="font-semibold text-gray-600">{totalUsers}</span> users
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
                    p === currentPage
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => onPageChange(offset + limit)}
              disabled={offset + limit >= totalUsers}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;