// components/tabs/UserKYCTab.jsx
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MoreVertical,
  FileText,
  Eye,
  CheckCircle2,
  Clock3,
  XCircle,
  Pencil,
  Rocket,
  User as UserIcon,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import KycUpdateModal from "../../KycUpdateModal";

// Types for which Approve should never be shown (case/whitespace-insensitive)
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

// ── Pagination helper: generates page numbers with ellipsis ──────────────────
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

// ── Status Badge ──────────────────────────────────────────────────────────────
// `failedReason` (when present) is rendered directly beneath the badge, not
// hidden behind a hover/tooltip — admins need to see it at a glance.
const StatusBadge = ({ status, failedReason }) => {
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
    <div className="flex flex-col gap-1 max-w-[220px]">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize w-fit ${cls}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {status}
      </span>
      {failedReason && (
        <p className="text-[11px] leading-snug text-red-500/90 break-words">
          {failedReason}
        </p>
      )}
    </div>
  );
};

// ── Action Menu (PORTAL + fixed positioning so it never gets clipped) ─────────
const ActionMenu = ({
  open,
  anchorRef,
  onClose,
  onApprove,
  onPending,
  onReject,
  onUpdateKyc,
  onSubmitWeWire,
  onBackdate,
  wewireLoading,
  wewireSubmitted,
  viewUrl,
  hideApprove,
  hidePending,
  disabled,
}) => {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, ready: false });

  const updatePosition = () => {
    const btnEl = anchorRef?.current;
    if (!btnEl) return;

    const rect = btnEl.getBoundingClientRect();
    const MENU_W = 224; // ~ w-56
    const GAP = 8;

    // Default: align menu right edge to button right edge
    let left = rect.right - MENU_W;
    let top = rect.bottom + GAP;

    // Clamp to viewport with small padding
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    left = Math.max(pad, Math.min(left, vw - MENU_W - pad));

    // If near bottom, flip upward (once we know menu height)
    const menuH = menuRef.current?.offsetHeight || 300;
    if (top + menuH > vh - pad) {
      const flippedTop = rect.top - GAP - menuH;
      if (flippedTop >= pad) top = flippedTop;
    }

    setPos({ top, left, ready: true });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const onPointerDown = (e) => {
      const menuEl = menuRef.current;
      const btnEl = anchorRef?.current;
      const target = e.target;

      if (
        menuEl &&
        !menuEl.contains(target) &&
        btnEl &&
        !btnEl.contains(target)
      ) {
        onClose();
      }
    };

    const onAnyScrollOrResize = () => {
      // keep it open but reposition while user scrolls any container
      updatePosition();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);

    // IMPORTANT: scroll doesn't bubble, but capture=true on window catches it from any scroll container
    window.addEventListener("scroll", onAnyScrollOrResize, true);
    window.addEventListener("resize", onAnyScrollOrResize);

    // focus first item
    const t = setTimeout(() => {
      const first = menuRef.current?.querySelector('[data-menuitem="true"]');
      first?.focus();
    }, 0);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", onAnyScrollOrResize, true);
      window.removeEventListener("resize", onAnyScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label="Row actions"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: 224,
        zIndex: 9999,
        visibility: pos.ready ? "visible" : "hidden",
      }}
      className="
        rounded-2xl border border-gray-100 bg-white shadow-xl
        overflow-hidden origin-top-right
        animate-[fadeIn_120ms_ease-out]
      "
    >
      <div className="py-1">
        {/* Approve: hidden for bvn, nin, and utility_bill types */}
        {!hideApprove && (
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
        )}

        {/* Set Pending: hidden for utility_bill — status is set to pending
            automatically when the record is submitted to Graph instead */}
        {!hidePending && (
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
        )}

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

        <button
          type="button"
          role="menuitem"
          data-menuitem="true"
          disabled={wewireLoading || wewireSubmitted}
          onClick={onSubmitWeWire}
          title={wewireSubmitted ? "Already submitted — update this KYC to submit again" : undefined}
          className="
            w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold
            text-purple-600 hover:bg-purple-50
            focus:outline-none focus:bg-purple-50
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {wewireLoading ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
              Submitting…
            </>
          ) : wewireSubmitted ? (
            <>
              <CheckCircle2 size={14} className="text-purple-600" />
              Already Submitted to Graph
            </>
          ) : (
            <>
              <Rocket size={14} className="text-purple-600" />
              Submit KYC to Graph
            </>
          )}
        </button>

        <button
          type="button"
          role="menuitem"
          data-menuitem="true"
          onClick={onBackdate}
          className="
            w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold
            text-orange-600 hover:bg-orange-50
            focus:outline-none focus:bg-orange-50
          "
        >
          <History size={14} className="text-orange-600" />
          Back-date / Reset KYC
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

      <div className="px-4 py-2 text-[10px] text-gray-400 bg-gray-50/60 border-t border-gray-100">
        Tip: press <span className="font-semibold text-gray-500">Esc</span> to close
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
};

// ── Row component ─────────────────────────────────────────────────────────────
const KycRow = ({
  k,
  isOpen,
  isBusy,
  wewireLoading,
  wewireSubmitted,
  onToggle,
  onClose,
  onApprove,
  onPending,
  onReject,
  onUpdateKyc,
  onSubmitWeWire,
  onBackdate,
  viewUrl,
}) => {
  const btnRef = useRef(null);

  return (
    <tr className="hover:bg-gray-50/80 transition-colors">
      <td className="px-5 py-4">
        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium capitalize">
          {k.type}
        </span>
      </td>

      <td className="px-5 py-4 text-gray-700 font-mono text-xs">
        {k.typeValue || <span className="text-gray-300">—</span>}
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={k.status} failedReason={k.failedReason} />
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

      <td className="px-5 py-4">
        <button
          ref={btnRef}
          type="button"
          onClick={onToggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold
            border transition
            ${isOpen
              ? "bg-gray-200 border-gray-200 text-gray-700"
              : "bg-gray-100 border-gray-100 text-gray-600 hover:bg-gray-200"
            }
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
          onClose={onClose}
          disabled={isBusy}
          hideApprove={isNoApproveType(k.type)}
          hidePending={isNoPendingType(k.type)}
          wewireLoading={wewireLoading}
          wewireSubmitted={wewireSubmitted}
          onApprove={onApprove}
          onPending={onPending}
          onReject={onReject}
          onUpdateKyc={onUpdateKyc}
          onSubmitWeWire={onSubmitWeWire}
          onBackdate={onBackdate}
          viewUrl={viewUrl}
        />
      </td>
    </tr>
  );
};

const ROWS_PER_PAGE = 10;

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
  const [wewireLoadingId, setWewireLoadingId] = useState(null);
  const [wewireToast, setWewireToast] = useState(null);

  // Forces re-render after marking/clearing a submitted flag (since the flag
  // itself lives in localStorage, not React state).
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);

  // Back-date / Reset KYC modal state
  const [resetTarget, setResetTarget] = useState(null); // { record, user }
  const [resetKycType, setResetKycType] = useState("identity");
  const [resetReason, setResetReason] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetToast, setResetToast] = useState(null);

  // ── Pagination state ──────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = ROWS_PER_PAGE;

  const totalCount = kycRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));

  // Clamp current page if the underlying list shrinks (e.g. after a refetch)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return kycRecords.slice(start, start + rowsPerPage);
  }, [kycRecords, currentPage, rowsPerPage]);

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalCount);

  const safeBaseURL = baseURL || import.meta.env.VITE_STAGE_URL;

  const authConfig = useMemo(() => {
    const t = token || localStorage.getItem("token");
    return { headers: { Authorization: t ? `Bearer ${t}` : "" } };
  }, [token]);

  const updateKycStatus = async (kycId, payload) => {
    if (!safeBaseURL) throw new Error("Missing baseURL / VITE_STAGE_URL");
    if (!authConfig.headers.Authorization) throw new Error("Missing auth token");
    return axios.patch(
      `${safeBaseURL}/superAdmin/kyc/${kycId}/status`,
      payload,
      authConfig
    );
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
      // Clear the "submitted once" lock for this record since an admin
      // update was just made — they can submit to Graph again if needed.
      clearGraphSubmitted(record.id);
      await Promise.allSettled([fetchKycRecords?.(), fetchSummary?.()]);
    } catch (err) {
      const code = err?.response?.status;
      alert(
        code === 401
          ? "Unauthorized (401). Your session expired—login again."
          : "Failed to update KYC status"
      );
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

      // Clear the submitted lock for this record since it was just updated.
      clearGraphSubmitted(rejectModal.id);

      await Promise.allSettled([fetchKycRecords?.(), fetchSummary?.()]);
      setRejectModal(null);
      setRejectSubject("");
      setRejectReason("");
    } catch (err) {
      const code = err?.response?.status;
      alert(
        code === 401
          ? "Unauthorized (401). Your session expired—login again."
          : "Failed to reject KYC"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Submit KYC to Graph ─────────────────────────────────────────────────────
  // No longer calls the separate submit-wewire-kyc endpoint. Submitting to
  // Graph is now just a status update — PATCH the record's status to
  // "pending" via the same endpoint/helper used by Approve/Set Pending/Reject.
  const handleSubmitToWeWire = async (record) => {
    if (isGraphSubmitted(record.id)) {
      // Already locked — ignore stray clicks.
      return;
    }

    setWewireLoadingId(record.id);
    setWewireToast(null);
    setActionOpenId(null);

    try {
      await updateKycStatus(record.id, { status: "pending" });

      // Lock this record's submit button until it's next updated
      // (status change, Update KYC, or Back-date/Reset KYC).
      markGraphSubmitted(record.id);
      bump();

      setWewireToast({ type: "success", message: "KYC submitted to Graph successfully." });
      await Promise.allSettled([fetchKycRecords?.(), fetchSummary?.()]);
    } catch (err) {
      const code = err?.response?.status;
      setWewireToast({
        type: "error",
        message:
          code === 401
            ? "Unauthorized (401). Your session expired—login again."
            : err?.response?.data?.message || "Failed to submit KYC to Graph.",
      });
    } finally {
      setWewireLoadingId(null);
      setTimeout(() => setWewireToast(null), 4000);
    }
  };

  // ── Back-date / Reset KYC ──────────────────────────────────────────────────
  const handleSubmitReset = async () => {
    if (!resetTarget?.user?.id) return;
    setResetLoading(true);
    setResetToast(null);
    try {
      const t = token || localStorage.getItem("token");
      const res = await fetch(`${safeBaseURL}/superAdmin/users/${resetTarget.user.id}/reset-kyc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          kycType: resetKycType,
          reason: resetReason,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok || body.success === false) {
        throw new Error(body?.message || `Request failed (${res.status})`);
      }

      // Clear the submitted lock for all this user's KYC records since
      // they've just been reset and will need re-submission after re-approval.
      kycRecords
        .filter((r) => (r.user?.id || r.userId) === resetTarget.user.id)
        .forEach((r) => clearGraphSubmitted(r.id));

      setResetToast({ type: "success", message: body.message || "User KYC has been reset successfully." });
      setResetTarget(null);
      setResetReason("");
      setResetKycType("identity");

      await Promise.allSettled([fetchKycRecords?.(), fetchSummary?.()]);
    } catch (err) {
      setResetToast({ type: "error", message: err.message || "Failed to reset user KYC." });
    } finally {
      setResetLoading(false);
      setTimeout(() => setResetToast(null), 4000);
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
      {/* ── Graph submit toast notification ── */}
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

      {/* ── Reset KYC toast notification ── */}
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
              {paginatedRecords.map((k) => (
                <KycRow
                  key={k.id}
                  k={k}
                  isOpen={actionOpenId === k.id}
                  isBusy={updatingId === k.id}
                  wewireLoading={wewireLoadingId === k.id}
                  wewireSubmitted={isGraphSubmitted(k.id)}
                  onToggle={() =>
                    setActionOpenId((prev) => (prev === k.id ? null : k.id))
                  }
                  onClose={() => setActionOpenId(null)}
                  onApprove={() => handleStatusChange(k, "approved")}
                  onPending={() => handleStatusChange(k, "pending")}
                  onReject={() => handleStatusChange(k, "rejected")}
                  onUpdateKyc={() => {
                    setSelectedUser(k.user || k);
                    setActionOpenId(null);
                  }}
                  onSubmitWeWire={() => handleSubmitToWeWire(k)}
                  onBackdate={() => {
                    const u = k.user || { id: k.userId };
                    setResetTarget({ record: k, user: u });
                    setResetKycType(isNoApproveType(k.type) ? k.type : "identity");
                    setActionOpenId(null);
                  }}
                  viewUrl={k.documentUrl || k.selfieUrl || null}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination controls ── */}
        {totalCount > rowsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
            <p className="text-xs text-gray-400 shrink-0">
              Showing <span className="font-semibold text-gray-600">{startItem}–{endItem}</span> of{" "}
              <span className="font-semibold text-gray-600">{totalCount}</span> records
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  setActionOpenId(null);
                }}
                disabled={currentPage === 1}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition ${currentPage === 1
                    ? "border-gray-100 text-gray-300 cursor-not-allowed bg-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"
                  }`}
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
                    onClick={() => {
                      setCurrentPage(p);
                      setActionOpenId(null);
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition ${p === currentPage
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"
                      }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  setActionOpenId(null);
                }}
                disabled={currentPage === totalPages}
                className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition ${currentPage === totalPages
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

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-800">Reject KYC</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Provide a reason for rejection
                </p>
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
                disabled={
                  !rejectSubject ||
                  !rejectReason ||
                  updatingId === rejectModal?.id
                }
                onClick={handleRejectSubmit}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {updatingId === rejectModal?.id ? "Rejecting…" : "Reject KYC"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back-date / Reset KYC Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Reset KYC (Back-date)</h3>
            <p className="text-xs text-gray-400 mb-4">
              {resetTarget.user?.firstname} {resetTarget.user?.lastname} will be asked to re-submit this document.
            </p>

            <label className="block text-xs font-semibold text-gray-500 mb-1">KYC Type</label>
            <select
              value={resetKycType}
              onChange={(e) => setResetKycType(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="identity">Identity</option>
              <option value="utility">Utility</option>
              <option value="bvn">BVN</option>
              <option value="nin">NIN</option>
            </select>

            <label className="block text-xs font-semibold text-gray-500 mb-1">Reason</label>
            <textarea
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              rows={3}
              placeholder="e.g. Document blurry, please re-upload."
              className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setResetTarget(null);
                  setResetReason("");
                }}
                className="px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReset}
                disabled={resetLoading || !resetReason.trim()}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? "Resetting…" : "Confirm Reset"}
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
          // Clear the "submitted once" lock for all of this user's KYC
          // records since an update was just made — admin can submit again.
          if (selectedUser) {
            const uid = selectedUser.id || selectedUser.userId;
            kycRecords
              .filter((r) => (r.user?.id || r.userId) === uid)
              .forEach((r) => clearGraphSubmitted(r.id));
          }
          fetchKycRecords?.();
          fetchSummary?.();
          setSelectedUser(null);
        }}
      />
    </>
  );
}