import React from "react";

export default function UserKYCTab({ kycRecords = [] }) {
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
                    {kycRecords && kycRecords.length > 0 ? (
                      kycRecords.map((k) => (
                        <tr key={k.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 capitalize">{k.type}</td>
                          <td className="px-4 py-3">{k.typeValue || "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              k.status === "success" ? "bg-green-100 text-green-600" :
                              k.status === "pending" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"
                            }`}>
                              {k.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">{k.issuedDate ? new Date(k.issuedDate).toLocaleDateString() : "-"}</td>
                          <td className="px-4 py-3">
                            {k.documentUrl || k.selfieUrl ? (
                              <a href={k.documentUrl || k.selfieUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="text-center py-6 text-gray-500">No KYC records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

  );
}
