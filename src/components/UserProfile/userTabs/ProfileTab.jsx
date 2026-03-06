import React from "react";

export default function ProfileTab({ user, parsedAddress }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left - Personal Info */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded-full inline-block"></span>
          Personal Info
        </h3>
        <div className="space-y-4 text-sm text-gray-700">
          {[
            { label: "Full Name", value: `${user.firstname} ${user.lastname}` },
            { label: "Username / Tag", value: `@${user.tag || user.firstname?.toLowerCase()}` },
            { label: "Email", value: user.email },
            { label: "Phone", value: user.phoneNumber || "N/A" },
            { label: "Address", value: parsedAddress || "N/A" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Status</span>
            <span
              className={`inline-flex items-center gap-1.5 w-fit text-xs font-semibold px-2.5 py-1 rounded-full ${
                user.status === "active"
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-yellow-50 text-yellow-600 border border-yellow-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-yellow-500"}`}></span>
              {user.status}
            </span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="space-y-5">
        {/* Balances */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block"></span>
            Balances
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(user.accounts || []).map((acc) => (
              <div
                key={acc.id}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-100"
              >
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{acc.currency}</div>
                <div className="text-xl font-bold text-gray-900">
                  {Number(acc.balance || 0).toLocaleString()}
                </div>
              </div>
            ))}
            {(!user.accounts || user.accounts.length === 0) && (
              <div className="text-sm text-gray-400 col-span-2 py-4 text-center">No accounts found</div>
            )}
          </div>
        </div>

        {/* Verification */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full inline-block"></span>
            Verification
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Account Verified", value: user.isVerified },
              { label: "Email Verified", value: user.email_verified },
              { label: "Phone Verified", value: user.phone_verified },
              { label: "KYC Records", value: (user.kycRecords || []).length, isBadge: true },
            ].map(({ label, value, isBadge }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-xs text-gray-400 mb-1">{label}</div>
                {isBadge ? (
                  <span className="text-lg font-bold text-gray-800">{value}</span>
                ) : (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      value ? "bg-green-100 text-green-600" : "bg-red-50 text-red-500"
                    }`}
                  >
                    {value ? "Yes" : "No"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}