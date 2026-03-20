import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_STAGE_API_URL;

const ViewVirtualAccount = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [retryLoadingId, setRetryLoadingId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchVirtualAccounts = async () => {
    if (!userId) {
      setError("No userId provided in route.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(
        `${API_BASE_URL}/superadmin/virtual-accounts?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        }
      );

      if (res.data?.success && Array.isArray(res.data?.data)) {
        if (res.data.data.length > 0) setAccounts(res.data.data);
        else setError("No virtual accounts found for this user.");
      } else {
        setError("No virtual accounts found for this user.");
      }
    } catch (err) {
      console.error("Error fetching virtual accounts:", err);
      setError("Failed to fetch virtual accounts.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (account) => {
    if (!userId) return;

    setRetryLoadingId(account.id);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/superAdmin/users/${userId}/retry-account`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
        }
      );

      if (res.data?.success) {
        // ✅ Backend sets status to "pending" (your sample proves it)
        // Update UI immediately so button disappears right away
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === account.id
              ? { ...a, status: "pending", updatedAt: new Date().toISOString() }
              : a
          )
        );

        alert("Retry triggered successfully.");
        fetchVirtualAccounts(); // sync with backend
      } else {
        alert(res.data?.message || "Retry failed. Please try again.");
      }
    } catch (err) {
      console.error("Retry failed:", err);
      alert("Retry failed. Please try again.");
    } finally {
      setRetryLoadingId(null);
    }
  };

  useEffect(() => {
    fetchVirtualAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="p-4 sm:p-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition"
      >
        <FiArrowLeft className="text-lg" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <h1 className="text-2xl font-semibold text-gray-800 mb-2">
        Virtual Accounts
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Viewing all virtual accounts for{" "}
        <span className="font-medium break-all">{userId}</span>
      </p>

      {/* Loading */}
      {loading && (
        <div className="text-gray-500 text-center py-10">
          Loading virtual accounts...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-red-500 text-center py-10">{error}</div>
      )}

      {/* Accounts */}
      {!loading && !error && accounts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const isUsd = String(account.currency || "").toUpperCase() === "USD";
            const status = String(account.status || "").toLowerCase();

            // ✅ button should show ONLY when truly failed
            // (pending means retry is already processing)
            const isRetryBlocked =
              status === "active" || status === "success" || status === "pending";

            const showRetryButton = isUsd && !isRetryBlocked;

            return (
              <div
                key={account.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {account.accountName || "Unnamed Account"}
                </h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-700">Bank:</span>{" "}
                    {account.bank || "N/A"}
                  </p>

                  <p>
                    <span className="font-medium text-gray-700">
                      Account Number:
                    </span>{" "}
                    {account.accountNumber || "N/A"}
                  </p>

                  <p>
                    <span className="font-medium text-gray-700">
                      Account Type:
                    </span>{" "}
                    {account.accountType || "N/A"}
                  </p>

                  <p>
                    <span className="font-medium text-gray-700">Currency:</span>{" "}
                    {account.currency || "N/A"}
                  </p>

                  <p>
                    <span className="font-medium text-gray-700">Service:</span>{" "}
                    {account.service || "N/A"}
                  </p>

                  <p>
                    <span className="font-medium text-gray-700">Status:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        status === "active" || status === "success"
                          ? "bg-green-100 text-green-700"
                          : status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {account.status || "N/A"}
                    </span>
                  </p>

                  <p>
                    <span className="font-medium text-gray-700">Created:</span>{" "}
                    {account.createdAt
                      ? new Date(account.createdAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>

                {/* Retry Button */}
                {showRetryButton && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleRetry(account)}
                      disabled={retryLoadingId === account.id}
                      className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {retryLoadingId === account.id
                        ? "Retrying..."
                        : "Retry USD Account Creation"}
                    </button>
                  </div>
                )}

                {/* Optional: small hint when pending (nice UX) */}
                {isUsd && status === "pending" && (
                  <p className="mt-3 text-xs text-gray-400">
                    Retry is processing… this will update once the account is created.
                  </p>
                )}

                {/* User Info */}
                {account.user && (
                  <div className="mt-4 border-t pt-3 text-sm text-gray-500">
                    <p>
                      <span className="font-medium text-gray-700">User:</span>{" "}
                      {account.user.firstname} {account.user.lastname}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Email:</span>{" "}
                      {account.user.email}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Label:</span>{" "}
                      {account.label}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewVirtualAccount;