// components/tabs/UserKYCTab.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, MoreVertical, FileText, Eye, CheckCircle2, Clock3, XCircle, Pencil } from "lucide-react";
import axios from "axios";
import KycUpdateModal from "../../KycUpdateModal";

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = String(status || "").toLowerCase();

  const map = {
    approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    rejected: "bg-red-50 text-red-600 ring-1 ring-red-200",
    failed: "bg-red-50 text-red-600 ring-1 ring-red-200",
  };

  const dotMap = {
    approved: "bg-emerald-500",
    success: "bg-emerald-500",
    pending: "bg-amber-400",
    rejected: "bg-red-500",
    failed: "bg-red-500",
  };

  const cls = map[s] || "bg-gray-100 text-gray-500 ring-1 ring-gray-200";
  const dot = dotMap[s] || "bg-gray-400";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
};

// ── Improved Action Menu (better UX: click-outside, Esc, focus, animation, aria) ──
const ActionMenu = ({
  open,
  anchorRef,
  onClose,
  onApprove,
  onPending,
  onReject,
  onUpdateKyc,
  viewUrl,
  disabled,
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const onPointerDown = (e) => {
      const menuEl = menuRef.current;
      const btnEl = anchorRef?.current;
      const target = e.target;

      // close if click is outside menu + outside button
      if (menuEl && !menuEl.contains(target) && btnEl && !btnEl.contains(target)) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);

    // focus first item for keyboard users
    const t = setTimeout(() => {
      const first = menuRef.current?.querySelector('[data-menuitem="true"]');
      first?.focus();
    }, 0);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Row actions"
      className="
        absolute right-0 mt-2 w-56 z-30
        rounded-2xl border border-gray-100 bg-white shadow-xl
        overflow-hidden
        origin-top-right
        animate-[fadeIn_120ms_ease-out]
      "
    >
      {/* Section: status */}
      <div className="py-1">
        <button
          type="button"
          role="menuitem"
          data-menuitem="true"
          disabled={disabled}
          onClick={onApprove}
          className="
            w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold
            text-emerald-700 hover:bg-emerald-50
            focus:outline-none focus:bg-emerald-50
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <CheckCircle2 size={14} className="text-emerald-600" />
          Approve
        </button>

        <button
          type="button"
          role="menuitem"
          data-menuitem="true"
          disabled={disabled}
          onClick={onPending}
          className="
            w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold
            text-amber-700 hover:bg-amber-50
            focus:outline-none focus:bg-amber-50
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <Clock3 size={14} className="text-amber-600" />
          Set Pending
        </button>

        <button
          type="button"
          role="menuitem"
          data-menuitem="true"
          disabled={disabled}
          onClick={onReject}
          className="
            w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold
            text-red-600 hover:bg-red-50
            focus:outline-none focus:bg-red-50
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <XCircle size={14} className="text-red-500" />
          Reject
        </button>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Section: other */}
      <div className="py-1">
        <button
          type="button"
          role="menuitem"
          data-menuitem="true"
          onClick={onUpdateKyc}
          className="
            w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold
            text-blue-600 hover:bg-blue-50
            focus:outline-none focus:bg-blue-50
          "
        >
          <Pencil size={14} className="text-blue-600" />
          Update KYC
        </button>

        {viewUrl && (
          <a
            role="menuitem"
            data-menuitem="true"
            href={viewUrl}
            target="_blank"
            rel="noreferrer"
            className="
              w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold
              text-gray-700 hover:bg-gray-50
              focus:outline-none focus:bg-gray-50
            "
          >
            <Eye size={14} className="text-gray-600" />
            View Document
          </a>
        )}
      </div>

      {/* tiny tip row */}
      <div className="px-4 py-2 text-[10px] text-gray-400 bg-gray-50/60 border-t border-gray-100">
        Tip: press <span className="font-semibold text-gray-500">Esc</span> to close
      </div>

      {/* keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function UserKYCTab({
  kycRecords = [],
  baseURL,
  fetchKycRecords,
  fetchSummary,
  token,
}) {
  const [updatingId, setUpdatingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectSubject, setRejectSubject] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionOpenId, setActionOpenId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const safeBaseURL = baseURL || import.meta.env.VITE_API_URL;

  const authConfig = useMemo(() => {
    const t = token || localStorage.getItem("token");
    return { headers: { Authorization: t ? `Bearer ${t}` : "" } };
  }, [token]);

  const updateKycStatus = async (kycId, payload) => {
    if (!safeBaseURL) throw new Error("Missing baseURL / VITE_API_URL");
    if (!authConfig.headers.Authorization) throw new Error("Missing auth token");
    return axios.patch(`${safeBaseURL}/superAdmin/kyc/${kycId}/status`, payload, authConfig);
  };

  const handleStatusChange = async (record, status) => {
    if (status === "rejected") {
      setRejectModal(record);
      setActionOpenId(null);
      return;
    }

    try {
      setUpdatingId(record.id);
      await updateKycStatus(record.id, { status });
      await Promise.allSettled([fetchKycRecords?.(), fetchSummary?.()]);
    } catch (err) {
      const code = err?.response?.status;
      alert(code === 401 ? "Unauthorized (401). Your session expired—login again." : "Failed to update KYC status");
    } finally {
      setUpdatingId(null);
      setActionOpenId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal?.id) return;

    setUpdatingId(rejectModal.id);
    try {
      await updateKycStatus(rejectModal.id, {
        status: "rejected",
        subject: rejectSubject,
        reason: rejectReason,
      });

      await Promise.allSettled([fetchKycRecords?.(), fetchSummary?.()]);
      setRejectModal(null);
      setRejectSubject("");
      setRejectReason("");
    } catch (err) {
      const code = err?.response?.status;
      alert(code === 401 ? "Unauthorized (401). Your session expired—login again." : "Failed to reject KYC");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!kycRecords.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <FileText size={36} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">No KYC records found</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Type", "Value", "Status", "Issued", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {kycRecords.map((k) => {
                const isOpen = actionOpenId === k.id;
                const isBusy = updatingId === k.id;
                const btnRef = useRef(null); // per-row ref (ok inside map for stable list in React)

                return (
                  <tr key={k.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium capitalize">
                        {k.type}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-700 font-mono text-xs">
                      {k.typeValue || <span className="text-gray-300">—</span>}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={k.status} />
                    </td>

                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {k.issuedDate ? (
                        new Date(k.issuedDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 relative">
                      <button
                        ref={btnRef}
                        type="button"
                        onClick={() => setActionOpenId(isOpen ? null : k.id)}
                        aria-haspopup="menu"
                        aria-expanded={isOpen}
                        className={`
                          inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold
                          border transition
                          ${isOpen ? "bg-gray-200 border-gray-200 text-gray-700" : "bg-gray-100 border-gray-100 text-gray-600 hover:bg-gray-200"}
                        `}
                      >
                        {isBusy ? (
                          <>
                            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                            Working…
                          </>
                        ) : (
                          <>
                            Action <MoreVertical size={14} />
                          </>
                        )}
                      </button>

                      <ActionMenu
                        open={isOpen}
                        anchorRef={btnRef}
                        onClose={() => setActionOpenId(null)}
                        disabled={isBusy}
                        onApprove={() => handleStatusChange(k, "approved")}
                        onPending={() => handleStatusChange(k, "pending")}
                        onReject={() => handleStatusChange(k, "rejected")}
                        onUpdateKyc={() => {
                          setSelectedUser(k.user || k);
                          setActionOpenId(null);
                        }}
                        viewUrl={k.documentUrl || k.selfieUrl || null}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-800">Reject KYC</h3>
                <p className="text-xs text-gray-400 mt-0.5">Provide a reason for rejection</p>
              </div>
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectSubject("");
                  setRejectReason("");
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Subject
                </label>
                <input
                  placeholder="e.g. Document unclear"
                  value={rejectSubject}
                  onChange={(e) => setRejectSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Reason
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain why this KYC is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition"
                />
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectSubject("");
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                disabled={!rejectSubject || !rejectReason || updatingId === rejectModal?.id}
                onClick={handleRejectSubmit}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {updatingId === rejectModal?.id ? "Rejecting…" : "Reject KYC"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Update Modal */}
      <KycUpdateModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        baseURL={safeBaseURL}
        token={token || localStorage.getItem("token")}
        onSuccess={() => {
          fetchKycRecords?.();
          fetchSummary?.();
          setSelectedUser(null);
        }}
      />
    </>
  );
}