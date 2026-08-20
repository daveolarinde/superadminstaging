import React, { useState } from "react";

const ALLOWED_FIELDS = ["firstname", "lastname", "middlename", "phoneNumber", "gender", "dob", "address"];

function EditBasicInfoModal({ user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    firstname: user.firstname || "",
    lastname: user.lastname || "",
    middlename: user.middlename || "",
    phoneNumber: user.phoneNumber || "",
    gender: user.gender || "",
    dob: user.dob ? user.dob.slice(0, 10) : "",
    address: {
      street: user.address?.street || "",
      city: user.address?.city || "",
      state: user.address?.state || "",
      country: user.address?.country || "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Only send allowed fields
    const payload = {};
    ALLOWED_FIELDS.forEach((key) => {
      if (form[key] !== undefined && form[key] !== "") {
        payload[key] = form[key];
      }
    });

    try {
      const baseUrl = import.meta.env.VITE_API_URL
      const res = await fetch(`${baseUrl}/superAdmin/users/${user.id}/basic-info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      onSuccess(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full inline-block"></span>
            Edit Basic Info
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            {["firstname", "lastname"].map((field) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide capitalize">
                  {field}
                </label>
                <input
                  type="text"
                  value={form[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                />
              </div>
            ))}
          </div>

          {/* Middlename */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Middle Name</label>
            <input
              type="text"
              value={form.middlename}
              onChange={(e) => handleChange("middlename", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Phone Number</label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              placeholder="+2348012345678"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
            />
          </div>

          {/* Gender + DOB */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition bg-white"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => handleChange("dob", e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
              />
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 uppercase tracking-wide">Address</label>
            <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
              {[
                { key: "street", placeholder: "Street" },
                { key: "city", placeholder: "City" },
                { key: "state", placeholder: "State" },
                { key: "country", placeholder: "Country (e.g. NG)" },
              ].map(({ key, placeholder }) => (
                <input
                  key={key}
                  type="text"
                  placeholder={placeholder}
                  value={form.address[key]}
                  onChange={(e) => handleAddressChange(key, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileTab({ user, parsedAddress, onUserUpdate }) {
  const [showEditModal, setShowEditModal] = useState(false);

  const handleSuccess = (updatedData) => {
    setShowEditModal(false);
    if (onUserUpdate) onUserUpdate(updatedData);
  };

  return (
    <>
      {showEditModal && (
        <EditBasicInfoModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Personal Info */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full inline-block"></span>
              Personal Info
            </h3>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-600 border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
              </svg>
              Edit
            </button>
          </div>
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
                className={`inline-flex items-center gap-1.5 w-fit text-xs font-semibold px-2.5 py-1 rounded-full ${user.status === "active"
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
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${value ? "bg-green-100 text-green-600" : "bg-red-50 text-red-500"
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
    </>
  );
}