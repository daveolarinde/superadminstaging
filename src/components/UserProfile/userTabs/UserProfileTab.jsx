import React from "react";

export default function UserProfileTab({ user }) {
  if (!user)
    return (
      <div className="text-gray-500 text-center py-6">
        No user data available.
      </div>
    );

  const infoRows = [
    { label: "Full Name", value: `${user.firstname} ${user.lastname}` },
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone || "N/A" },
    { label: "Country", value: user.country || "N/A" },
    { label: "Date Joined", value: new Date(user.createdAt).toLocaleString() },
    { label: "User ID", value: user._id || user.id || "N/A" },
    { label: "Status", value: user.status || "N/A" },
    { label: "Verification", value: user.isVerified ? "Verified" : "Unverified" },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-5 grid md:grid-cols-2 gap-4">
        {infoRows.map((row, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-xs text-gray-500">{row.label}</span>
            <span className="text-sm font-medium text-gray-800">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Optional Account Details */}
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
        <h3 className="text-gray-800 font-semibold mb-3">Account Overview</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-500">Wallet Balance</p>
            <p className="text-lg font-bold text-gray-800">
              {user.walletBalance ?? "₦0.00"}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-500">Referral Count</p>
            <p className="text-lg font-bold text-gray-800">
              {user.referrals?.length ?? 0}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-lg font-bold text-gray-800">
              {user.transactionsCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Verification Info */}
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-5">
        <h3 className="text-gray-800 font-semibold mb-3">Verification Details</h3>
        {user.kycRecords && user.kycRecords.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {user.kycRecords.map((kyc, i) => (
              <li key={i} className="py-2">
                <p className="text-sm font-medium text-gray-800">
                  {kyc.documentType}
                </p>
                <p className="text-xs text-gray-500">
                  Status:{" "}
                  <span
                    className={`${
                      kyc.status === "approved"
                        ? "text-green-600"
                        : kyc.status === "pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                    } font-medium`}
                  >
                    {kyc.status}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No KYC records found.</p>
        )}
      </div>
    </div>
  );
}
