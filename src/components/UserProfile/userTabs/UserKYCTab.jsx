import React, { useState } from "react";
import { X, MoreVertical } from "lucide-react";
import axios from "axios";

export default function UserKYCTab({ kycRecords = [], baseURL, authHeader, fetchKycRecords, fetchSummary }) {
  const [updatingId, setUpdatingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectSubject, setRejectSubject] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionOpenId, setActionOpenId] = useState(null);

  // Call API
  const updateKycStatus = async (kycId, payload) => {
    await axios.patch(`${baseURL}/superAdmin/kyc/${kycId}/status`, payload, authHeader);
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
      fetchKycRecords();
      fetchSummary();
    } catch {
      alert("Failed to update KYC status");
    } finally {
      setUpdatingId(null);
      setActionOpenId(null);
    }
  };

  if (!kycRecords.length)
    return (
      <div className="text-gray-500 text-center py-6">
        No KYC records found.
      </div>
    );

  const statusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
      case "approved":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "failed":
      case "rejected":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
      <table className="min-w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Issued</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {kycRecords.map((k) => (
            <tr key={k.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 capitalize">{k.type}</td>
              <td className="px-4 py-3">{k.typeValue || "-"}</td>
              <td className="px-4 py-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(k.status)}`}>
                  {k.status}
                </span>
              </td>
              <td className="px-4 py-3">{k.issuedDate ? new Date(k.issuedDate).toLocaleDateString() : "-"}</td>
              <td className="px-4 py-3 relative">
                <button
                  onClick={() => setActionOpenId(actionOpenId === k.id ? null : k.id)}
                  className="p-2 border rounded-lg hover:bg-gray-100"
                >
                  <MoreVertical size={16} />
                </button>

                {actionOpenId === k.id && (
                  <div className="absolute right-0 mt-2 w-36 bg-white border rounded-xl shadow-lg z-20">
                    <button
                      disabled={updatingId === k.id}
                      onClick={() => handleStatusChange(k, "approved")}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-50 text-green-600"
                    >
                      Approve
                    </button>
                    <button
                      disabled={updatingId === k.id}
                      onClick={() => handleStatusChange(k, "pending")}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-50 text-yellow-600"
                    >
                      Pending
                    </button>
                    <button
                      disabled={updatingId === k.id}
                      onClick={() => handleStatusChange(k, "rejected")}
                      className="block w-full px-4 py-2 text-left hover:bg-red-50 text-red-600"
                    >
                      Reject
                    </button>
                    {k.documentUrl || k.selfieUrl ? (
                      <a
                        href={k.documentUrl || k.selfieUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block px-4 py-2 text-left hover:bg-blue-50 text-blue-600"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">Reject KYC</h3>
              <button onClick={() => setRejectModal(null)}>
                <X size={18} />
              </button>
            </div>

            <input
              placeholder="Subject"
              value={rejectSubject}
              onChange={(e) => setRejectSubject(e.target.value)}
              className="w-full border rounded-lg p-2 mb-3"
            />

            <textarea
              placeholder="Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border rounded-lg p-2 mb-4"
            />

            <button
              disabled={!rejectSubject || !rejectReason}
              onClick={async () => {
                setUpdatingId(rejectModal.id);
                try {
                  await updateKycStatus(rejectModal.id, {
                    status: "rejected",
                    subject: rejectSubject,
                    reason: rejectReason,
                  });
                  fetchKycRecords();
                  fetchSummary();
                  setRejectModal(null);
                  setRejectSubject("");
                  setRejectReason("");
                } catch {
                  alert("Failed to reject KYC");
                } finally {
                  setUpdatingId(null);
                }
              }}
              className="w-full bg-red-600 text-white py-2 rounded-lg disabled:opacity-50"
            >
              Reject KYC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
