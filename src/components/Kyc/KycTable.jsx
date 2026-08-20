// components/KycTable.jsx
import { useState } from "react";
import { MoreVertical, ChevronLeft, ChevronRight, User, Pencil, Rocket, CheckCircle2, Clock, XCircle, History, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import KycUpdateModal from "../../components/KycUpdateModal";

// ── Pagination helper: generates page numbers with ellipsis ──────────────────
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

// Types for which Approve should never be shown
const NO_APPROVE_TYPES = new Set(["bvn", "nin", "utility_bill"]);
const isNoApproveType = (type) =>
  NO_APPROVE_TYPES.has(String(type || "").trim().toLowerCase());

// Types for which the manual "Set Pending" option should never be shown.
// For utility bill records, status is instead set to pending automatically
// when the record is submitted to Graph (see handleSubmitToWeWire).
const NO_PENDING_TYPES = new Set(["utility_bill"]);
const isNoPendingType = (type) =>
  NO_PENDING_TYPES.has(String(type || "").trim().toLowerCase());

// ── Graph submission "once only" tracking helpers ─────────────────────────────
// Persist per-KYC-record submission state in localStorage so a refresh
// doesn't let an admin re-submit accidentally. The flag is cleared whenever
// that record is updated (status change or Update KYC modal) so it can be
// submitted again after an update.
const graphSubmitKey = (kycId) => "graphSubmitted_" + kycId;

const isGraphSubmitted = (kycId) => {
  try {
    return localStorage.getItem(graphSubmitKey(kycId)) === "1";
  } catch (e) {
    return false;
  }
};

const markGraphSubmitted = (kycId) => {
  try {
    localStorage.setItem(graphSubmitKey(kycId), "1");
  } catch (e) {
    /* no-op */
  }
};

const clearGraphSubmitted = (kycId) => {
  try {
    localStorage.removeItem(graphSubmitKey(kycId));
  } catch (e) {
    /* no-op */
  }
};

// ── Status badge (styled to match UsersTable's StatusBadge) ──────────────────
// `failedReason` (when present) is shown directly beneath the badge — not
// behind a tooltip — so admins see it without needing to hover.
const StatusBadge = ({ status, failedReason }) => {
  const map = {
    approved: { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    success: { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    pending: { cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", dot: "bg-amber-400" },
    rejected: { cls: "bg-red-50 text-red-600 ring-1 ring-red-200", dot: "bg-red-500" },
    failed: { cls: "bg-red-50 text-red-600 ring-1 ring-red-200", dot: "bg-red-500" },
  };
  const s = String(status || "").toLowerCase();
  const style = map[s] || { cls: "bg-gray-100 text-gray-500 ring-1 ring-gray-200", dot: "bg-gray-400" };
  return (
    <div className="flex flex-col gap-1 max-w-[220px]">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize w-fit ${style.cls}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {s || "N/A"}
      </span>
      {failedReason && (
        <p className="text-[11px] leading-snug text-red-500/90 break-words">
          {failedReason}
        </p>
      )}
    </div>
  );
};

// ── Avatar (styled to match UsersTable's UserAvatar, falls back to initials) ─
const RecordAvatar = ({ userObj, src }) => {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;
  return (
    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0 uppercase overflow-hidden">
      {showImage ? (
        <img
          src={src}
          alt={userObj.firstname}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        userObj.firstname?.[0] || "?"
      )}
    </div>
  );
};

// ── Dropdown menu item helper (matches UsersTable's action menu rows) ────────
const MenuItem = ({ onClick, disabled, colorClass, icon, children, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium capitalize transition disabled:opacity-40 disabled:cursor-not-allowed ${colorClass}`}
  >
    {icon}
    {children}
  </button>
);

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
  const [wewireLoading, setWewireLoading] = useState(null);
  const [wewireToast, setWewireToast] = useState(null);

  // Forces re-render after marking/clearing a submitted flag (since the flag
  // itself lives in localStorage, not React state).
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);

  const [resetTarget, setResetTarget] = useState(null);
  const [resetKycType, setResetKycType] = useState("identity");
  const [resetReason, setResetReason] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetToast, setResetToast] = useState(null);

  const displayedData = data;
  const safeTotalCount = totalCount ?? 0;
  const totalPages = Math.ceil(safeTotalCount / rowsPerPage);
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, safeTotalCount);
  const isSearchActive = false;

  const thCls = "px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider";
  const tdCls = "px-5 py-4";

  // ── Submit KYC to Graph ─────────────────────────────────────────────────────
  // No longer calls the separate submit-wewire-kyc endpoint. Submitting to
  // Graph is now just a status update — done via the parent's onStatusChange,
  // which PATCHes /superAdmin/kyc/{kycId}/status the same way Approve/Set
  // Pending/Reject do. We call onStatusChange directly (not
  // handleStatusChange) so we don't clear the graph-submitted lock we set
  // right after.
  const handleSubmitToWeWire = async (record) => {
    const userId = record.user?.id;
    const kycId = record.id;

    if (isGraphSubmitted(kycId)) {
      // Already locked — ignore stray clicks.
      return;
    }

    setWewireLoading(userId);
    setWewireToast(null);
    try {
      await onStatusChange(record, "pending");

      // Lock this record's submit button until it's next updated
      // (status change, Update KYC, or Back-date/Reset KYC).
      markGraphSubmitted(kycId);
      bump();

      setWewireToast({ type: "success", message: "KYC submitted to Graph successfully." });
    } catch (err) {
      setWewireToast({ type: "error", message: err?.response?.data?.message || err.message || "Failed to submit KYC to Graph." });
    } finally {
      setWewireLoading(null);
      setTimeout(() => setWewireToast(null), 4000);
    }
  };

  // Wrap the parent's onStatusChange so we clear the "submitted once" lock
  // for that record whenever an admin updates its status.
  const handleStatusChange = (record, status) => {
    clearGraphSubmitted(record.id);
    onStatusChange(record, status);
  };

  const handleSubmitReset = async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    setResetToast(null);
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem("token");
      const res = await fetch(baseURL + "/superAdmin/users/" + resetTarget.id + "/reset-kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          kycType: resetKycType,
          reason: resetReason,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok || body.success === false) {
        throw new Error((body && body.message) || ("Request failed (" + res.status + ")"));
      }

      // Clear submitted lock for all this user's KYC records since they've
      // just been reset and will need re-submission after re-approval.
      data
        .filter((r) => r.user && r.user.id === resetTarget.id)
        .forEach((r) => clearGraphSubmitted(r.id));

      setResetToast({ type: "success", message: (body && body.message) || "User KYC has been reset successfully." });
      setResetTarget(null);
      setResetReason("");
      setResetKycType("identity");
    } catch (err) {
      setResetToast({ type: "error", message: err.message || "Failed to reset user KYC." });
    } finally {
      setResetLoading(false);
      setTimeout(() => setResetToast(null), 4000);
    }
  };

  return (
    <>
      {wewireToast && (
        <div
          className={`flex items-center gap-3 mb-3 px-4 py-3 rounded-xl text-sm font-medium shadow-sm border transition-all ${wewireToast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
            }`}
        >
          <span>{wewireToast.type === "success" ? "✅" : "❌"}</span>
          {wewireToast.message}
          <button
            onClick={() => setWewireToast(null)}
            className="ml-auto text-xs opacity-50 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {resetToast && (
        <div
          className={`flex items-center gap-3 mb-3 px-4 py-3 rounded-xl text-sm font-medium shadow-sm border transition-all ${resetToast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
            }`}
        >
          <span>{resetToast.type === "success" ? "✅" : "❌"}</span>
          {resetToast.message}
          <button
            onClick={() => setResetToast(null)}
            className="ml-auto text-xs opacity-50 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {tableLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <span className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
          Updating results…
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* ── Toolbar (matches UsersTable's toolbar row) ── */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
          <p className="text-xs text-gray-400 shrink-0">
            <span className="font-semibold text-gray-600">{safeTotalCount.toLocaleString()}</span> KYC records
          </p>
        </div>

        <div className="overflow-x-auto">
          {displayedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-3xl">🪪</p>
              <p className="text-sm font-medium text-gray-500">No KYC records found</p>
              <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={thCls}>No.</th>
                  <th className={thCls}>User</th>
                  <th className={thCls}>Type</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedData.map((record, i) => {
                  const userObj = record.user || {};
                  const submitted = isGraphSubmitted(record.id);
                  const avatarSrc = record.documentUrl || record.selfieUrl;

                  return (
                    <tr key={record.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className={`${tdCls} text-gray-400 text-xs font-mono`}>
                        {isSearchActive
                          ? String(i + 1).padStart(2, "0")
                          : String((currentPage - 1) * rowsPerPage + i + 1).padStart(2, "0")}
                      </td>

                      <td className={tdCls}>
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => navigate("/admin/all-users/" + userObj.id)}
                        >
                          <RecordAvatar userObj={userObj} src={avatarSrc} />
                          <div>
                            <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition text-sm leading-tight">
                              {userObj.firstname} {userObj.lastname}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">@{userObj.tag || userObj.firstname?.toLowerCase() || "user"}</p>
                          </div>
                        </div>
                      </td>

                      <td className={tdCls}>
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium capitalize">
                          {record.type}
                        </span>
                      </td>

                      <td className={tdCls}>
                        <StatusBadge status={record.status} failedReason={record.failedReason} />
                      </td>

                      <td className={tdCls}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate("/admin/all-users/" + userObj.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          >
                            <User size={11} /> Profile
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setActionOpenId(actionOpenId === record.id ? null : record.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition text-gray-500"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {actionOpenId === record.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActionOpenId(null)} />
                                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                                  <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Set Status</p>

                                  {!isNoApproveType(record.type) && (
                                    <MenuItem
                                      onClick={() => handleStatusChange(record, "approved")}
                                      colorClass="text-emerald-700 hover:bg-emerald-50"
                                      icon={<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                    >
                                      Approve
                                    </MenuItem>
                                  )}

                                  {!isNoPendingType(record.type) && (
                                    <MenuItem
                                      onClick={() => handleStatusChange(record, "pending")}
                                      colorClass="text-amber-700 hover:bg-amber-50"
                                      icon={<span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                    >
                                      Set Pending
                                    </MenuItem>
                                  )}

                                  <MenuItem
                                    onClick={() => handleStatusChange(record, "rejected")}
                                    colorClass="text-red-600 hover:bg-red-50"
                                    icon={<span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                  >
                                    Reject
                                  </MenuItem>

                                  <div className="my-1 border-t border-gray-100" />

                                  <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manage</p>

                                  <MenuItem
                                    onClick={() => {
                                      navigate("/admin/all-users/" + userObj.id);
                                      setActionOpenId(null);
                                    }}
                                    colorClass="text-gray-700 hover:bg-gray-50"
                                    icon={<User size={12} />}
                                  >
                                    View Profile
                                  </MenuItem>

                                  <MenuItem
                                    onClick={() => {
                                      setSelectedUser(record.user);
                                      setActionOpenId(null);
                                    }}
                                    colorClass="text-blue-600 hover:bg-blue-50"
                                    icon={<Pencil size={12} />}
                                  >
                                    Update KYC
                                  </MenuItem>

                                  <MenuItem
                                    onClick={() => {
                                      if (submitted || wewireLoading === userObj.id) return;
                                      handleSubmitToWeWire(record);
                                      setActionOpenId(null);
                                    }}
                                    disabled={submitted || wewireLoading === userObj.id}
                                    title={submitted ? "Already submitted — update this KYC to submit again" : undefined}
                                    colorClass="text-purple-600 hover:bg-purple-50"
                                    icon={
                                      wewireLoading === userObj.id ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                      ) : submitted ? (
                                        <CheckCircle2 size={12} />
                                      ) : (
                                        <Rocket size={12} />
                                      )
                                    }
                                  >
                                    {wewireLoading === userObj.id
                                      ? "Submitting…"
                                      : submitted
                                        ? "Already Submitted to Graph"
                                        : "Submit KYC to Graph"}
                                  </MenuItem>

                                  <div className="my-1 border-t border-gray-100" />

                                  <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">KYC</p>

                                  <MenuItem
                                    onClick={() => {
                                      setResetTarget(record.user);
                                      setResetKycType(isNoApproveType(record.type) ? record.type : "identity");
                                      setActionOpenId(null);
                                    }}
                                    colorClass="text-orange-600 hover:bg-orange-50"
                                    icon={<History size={12} />}
                                  >
                                    Back-date / Reset KYC
                                  </MenuItem>

                                  {(record.documentUrl || record.selfieUrl) && (
                                    <a
                                      href={record.documentUrl || record.selfieUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                                    >
                                      <Eye size={12} /> View Document
                                    </a>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination (matches UsersTable's pagination) ── */}
        {!isSearchActive && safeTotalCount > rowsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
            <p className="text-xs text-gray-400 shrink-0">
              Showing <span className="font-semibold text-gray-600">{startItem}–{endItem}</span> of{" "}
              <span className="font-semibold text-gray-600">{safeTotalCount}</span> records
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={15} />
              </button>

              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <span key={"ellipsis-" + idx} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition ${p === currentPage
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <KycUpdateModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        baseURL={import.meta.env.VITE_API_URL}
        token={localStorage.getItem("token")}
        onSuccess={() => {
          // Clear the "submitted once" lock for all of this user's KYC
          // records since an update was just made — admin can submit again.
          if (selectedUser) {
            data
              .filter((r) => r.user && r.user.id === selectedUser.id)
              .forEach((r) => clearGraphSubmitted(r.id));
          }
          window.location.reload();
        }}
      />

      {/* ── Reset KYC modal (styled to match UsersTable's ResetKycModal) ── */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <History size={16} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 leading-tight">Reset KYC (Back-date)</h2>
                  <p className="text-xs text-gray-400">{resetTarget.firstname} {resetTarget.lastname}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setResetTarget(null);
                  setResetReason("");
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
                <Clock size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  {resetTarget.firstname} {resetTarget.lastname} will be asked to re-submit this document.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  KYC Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={resetKycType}
                  onChange={(e) => setResetKycType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition"
                >
                  <option value="identity">Identity</option>
                  <option value="utility">Utility</option>
                  <option value="bvn">BVN</option>
                  <option value="nin">NIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Document blurry, please re-upload."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
              <button
                onClick={() => {
                  setResetTarget(null);
                  setResetReason("");
                }}
                disabled={resetLoading}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReset}
                disabled={resetLoading || !resetReason.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {resetLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Resetting…
                  </>
                ) : (
                  <>
                    <History size={13} />
                    Confirm Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KycTable;