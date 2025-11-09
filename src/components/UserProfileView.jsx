import React, { useEffect, useState } from "react";
import { FiArrowLeft, FiEdit2 } from "react-icons/fi";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function UserProfileView({ onClose }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  // general
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState("");

  // tabs
  const tabs = [
    "Profile",
    "Wallets",
    "Transactions",
    "Profit History",
    "KYC Verification",
    "Virtual Accounts",
  ];
  const [activeTab, setActiveTab] = useState("Profile");
const [virtualAccounts, setVirtualAccounts] = useState([]);
const [virtualAccountsLoading, setVirtualAccountsLoading] = useState(false);
const [virtualAccountsError, setVirtualAccountsError] = useState("");
const [virtualAccountsPage, setVirtualAccountsPage] = useState(0);
const [virtualAccountsLimit] = useState(10);
const [virtualAccountsCount, setVirtualAccountsCount] = useState(null);
  // transactions
  const [txns, setTxns] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [txnsError, setTxnsError] = useState("");
  const [txnsPage, setTxnsPage] = useState(0);
  const [txnsLimit] = useState(10);
  const [txnsCount, setTxnsCount] = useState(null);

  // profits
  const [profits, setProfits] = useState([]);
  const [profitsLoading, setProfitsLoading] = useState(false);
  const [profitsError, setProfitsError] = useState("");
  const [profitsPage, setProfitsPage] = useState(0);
  const [profitsLimit] = useState(10);
  const [profitsCount, setProfitsCount] = useState(null);
  const [profitSummary, setProfitSummary] = useState(null);

  // KYC
  const [kycRecords, setKycRecords] = useState([]);

  // auth
  const token = localStorage.getItem("token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // --- Fetch user ---
  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      setLoadingUser(true);
      setErrorUser("");
      try {
        const res = await axios.get(`${API_BASE_URL}/superAdmin/users`, {
          headers: { ...authHeaders, Accept: "application/json" },
        });
        const all = Array.isArray(res.data?.data) ? res.data.data : [];
        const found = all.find((u) =>
          [u?.id, u?._id, u?.userId].some(
            (v) => String(v).trim() === String(userId).trim()
          )
        );
        if (!found) {
          setErrorUser("User not found");
          setUser(null);
        } else {
          setUser(found);
          setKycRecords(Array.isArray(found.kycRecords) ? found.kycRecords : []);
        }
      } catch (err) {
        console.error("Fetch user error:", err);
        setErrorUser("Failed to fetch user");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [userId]);

  // -- fetch virtual account
  const fetchVirtualAccounts = async (page = 0) => {
  if (!userId) return;
  setVirtualAccountsLoading(true);
  setVirtualAccountsError("");
  try {
    const offset = page * virtualAccountsLimit;
    const res = await axios.get(`${API_BASE_URL}/superadmin/virtual-accounts`, {
      headers: authHeaders,
      params: { userId, limit: virtualAccountsLimit, offset },
    });
    const data = res.data?.data || [];
    setVirtualAccounts(Array.isArray(data) ? data : []);
    if (typeof res.data?.count === "number") setVirtualAccountsCount(res.data.count);
  } catch (err) {
    console.error("Fetch virtual accounts error:", err);
    setVirtualAccountsError("Failed to fetch virtual accounts");
  } finally {
    setVirtualAccountsLoading(false);
  }
};

// --- Trigger fetch when tab is active ---
useEffect(() => {
  if (activeTab === "Virtual Accounts") {
    fetchVirtualAccounts(virtualAccountsPage);
  }
}, [activeTab, virtualAccountsPage, userId]);

// --- Pagination total ---
const virtualAccountsPagesTotal = virtualAccountsCount
  ? Math.ceil(virtualAccountsCount / virtualAccountsLimit)
  : null;

  // --- Fetch Transactions ---
  const fetchTransactions = async (page = 0) => {
    if (!userId) return;
    setTxnsLoading(true);
    setTxnsError("");
    try {
      const offset = page * txnsLimit;
      const res = await axios.get(`${API_BASE_URL}/superAdmin/transactions`, {
        headers: authHeaders,
        params: { userId, limit: txnsLimit, offset },
      });
      const data = res.data?.data || [];
      setTxns(Array.isArray(data) ? data : []);
      if (typeof res.data?.count === "number") setTxnsCount(res.data.count);
      if (typeof res.data?.total === "number") setTxnsCount(res.data.total);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setTxnsError("Failed to fetch transactions");
    } finally {
      setTxnsLoading(false);
    }
  };

  // --- Fetch Profits ---
  const fetchProfits = async (page = 0) => {
    if (!userId) return;
    setProfitsLoading(true);
    setProfitsError("");
    try {
      const offset = page * profitsLimit;
      const res = await axios.get(`${API_BASE_URL}/superAdmin/profits`, {
        headers: authHeaders,
        params: { userId, limit: profitsLimit, offset },
      });
      const data = res.data?.data || [];
      setProfits(Array.isArray(data) ? data : []);
      if (typeof res.data?.count === "number") setProfitsCount(res.data.count);
      if (typeof res.data?.totalProfit === "number") {
        setProfitSummary((prev) => ({
          ...(prev || {}),
          totalProfit: res.data.totalProfit,
        }));
      }
    } catch (err) {
      console.error("Fetch profits error:", err);
      setProfitsError("Failed to fetch profits");
    } finally {
      setProfitsLoading(false);
    }
  };

  // --- Profit summary ---
  const fetchProfitSummary = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/superAdmin/profits/summary`, {
        headers: authHeaders,
      });
      setProfitSummary(res.data?.data || null);
    } catch (err) {
      console.warn("Profit summary fetch error:", err);
    }
  };

  // --- Tab switching ---
  useEffect(() => {
    if (activeTab === "Transactions") {
      fetchTransactions(txnsPage);
    } else if (activeTab === "Profit History") {
      fetchProfits(profitsPage);
      fetchProfitSummary();
    } else if (activeTab === "KYC Verification") {
      if (!Array.isArray(user?.kycRecords) || user.kycRecords.length === 0) {
        (async () => {
          try {
            const res = await axios.get(`${API_BASE_URL}/superAdmin/kyc`, {
              headers: authHeaders,
              params: { userId, limit: 100, offset: 0 },
            });
            setKycRecords(Array.isArray(res.data?.data) ? res.data.data : []);
          } catch (err) {
            console.warn("KYC fetch error:", err);
          }
        })();
      } else {
        setKycRecords(user.kycRecords);
      }
    }
  }, [activeTab, txnsPage, profitsPage, userId, user]);

  // helpers
  const parsedAddress = (() => {
    try {
      if (!user?.address) return null;
      if (typeof user.address === "string" && user.address.startsWith("{")) {
        const addr = JSON.parse(user.address);
        return `${addr.street || ""}${addr.city ? ", " + addr.city : ""}${
          addr.state ? ", " + addr.state : ""
        }${addr.postalCode ? ", " + addr.postalCode : ""}${
          addr.country ? ", " + addr.country : ""
        }`;
      }
      return user?.address || "N/A";
    } catch {
      return user?.address || "N/A";
    }
  })();

  const txnsPagesTotal = txnsCount ? Math.ceil(txnsCount / txnsLimit) : null;
  const profitsPagesTotal = profitsCount
    ? Math.ceil(profitsCount / profitsLimit)
    : null;

  // loading + error UI
  if (loadingUser)
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-gray-500">
        Loading user...
      </div>
    );

  if (errorUser || !user)
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-gray-500 text-center px-4">
        <p>{errorUser || "User not found"}</p>
        <button
          onClick={onClose || (() => navigate(-1))}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );

  // --- UI ---
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Banner */}
    <div className="bg-white rounded-xl overflow-hidden shadow-sm relative">
  {/* Gradient background */}
  <div className="absolute top-0 left-0 w-full h-16 sm:h-24 bg-[linear-gradient(90deg,#bfefff,white)] -z-10"></div>

  {/* Header content */}
  <div className="px-3 sm:px-6 pb-3 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-4 border-white flex items-center justify-center text-3xl sm:text-4xl font-bold text-gray-800 shadow">
        {user.firstname?.[0]?.toUpperCase() || "U"}
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          {user.firstname} {user.lastname}{" "}
          {user.isVerified && (
            <span className="ml-2 inline-block bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              ✓
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {user.country ? `${user.country}` : ""} • Joined{" "}
          {new Date(user.createdAt || Date.now()).toLocaleDateString()}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3 justify-end">
      <button
        onClick={onClose || (() => navigate(-1))}
        className="text-gray-500 px-3 py-2 rounded-md hover:bg-gray-50"
        title="Back"
      >
        <FiArrowLeft />
      </button>
    </div>
  </div>
</div>

{/* Tabs */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        {/* Scrollable Tab Buttons */}
        <div className="flex items-center gap-4 overflow-x-auto pb-3 border-b no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-shrink-0 text-sm pb-2 whitespace-nowrap ${
                t === activeTab
                  ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {/* PROFILE TAB */}
          {activeTab === "Profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Profile
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <div className="text-xs text-gray-400">Full name</div>
                    <div className="font-medium">
                      {user.firstname} {user.lastname}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Username / Tag</div>
                    <div className="font-medium">
                      @{user.tag || user.firstname?.toLowerCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Email</div>
                    <div className="font-medium">{user.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Phone</div>
                    <div className="font-medium">
                      {user.phoneNumber || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Address</div>
                    <div className="font-medium">{parsedAddress || "N/A"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Status</div>
                    <div
                      className={`font-medium ${
                        user.status === "active"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {user.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Balances
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(user.accounts || []).map((acc) => (
                      <div key={acc.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-400">
                          {acc.currency}
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {Number(acc.balance || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {(!user.accounts || user.accounts.length === 0) && (
                      <div className="text-sm text-gray-500">No accounts</div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Verification
                  </h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    <div>
                      Is Verified:{" "}
                      <span className="font-medium">
                        {user.isVerified ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      KYC Records:{" "}
                      <span className="font-medium">
                        {(user.kycRecords || []).length}
                      </span>
                    </div>
                    <div>
                      Email Verified:{" "}
                      <span className="font-medium">
                        {user.email_verified ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      Phone Verified:{" "}
                      <span className="font-medium">
                        {user.phone_verified ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- WALLETS ---------------- */}
          {activeTab === "Wallets" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(user.accounts || []).length > 0 ? (
                (user.accounts || []).map((acc) => (
                  <div key={acc.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-gray-400">Currency</div>
                        <div className="font-semibold text-gray-900">{acc.currency}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Balance</div>
                        <div className="text-lg sm:text-xl font-bold">
                          {Number(acc.balance || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-gray-500">No wallets available</div>
              )}
            </div>
          )}

          {/* ---------------- TRANSACTIONS ---------------- */}
          {activeTab === "Transactions" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-lg font-semibold text-gray-800">Transactions</h3>
                <div className="text-sm text-gray-500">Showing user transactions (paginated)</div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
                <table className="min-w-[720px] w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Txn ID</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Amount</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Currency</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txnsLoading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : txns.length > 0 ? (
                      txns.map((t) => (
                       <tr key={t.id} className="border-t hover:bg-gray-50">
  <td className="px-4 py-3 whitespace-nowrap">
    {t.transaction_id || t.reference_id || t.id}
  </td>
  <td className="px-4 py-3 whitespace-nowrap">{t.type || t.class}</td>
  <td className="px-4 py-3 font-medium whitespace-nowrap">
    {Number(t.amount || t.total_amount || 0).toLocaleString()}
  </td>
  <td className="px-4 py-3 whitespace-nowrap">{t.currency}</td>
  <td className="px-4 py-3 whitespace-nowrap">{t.status}</td>
  <td className="px-4 py-3 whitespace-nowrap">
    {new Date(t.createdAt || t.created_at || Date.now()).toLocaleString()}
  </td>
  <td className="px-4 py-3 whitespace-nowrap">
    <button
      onClick={() =>
        navigate(`/admin/transactions/${t.id}`, {
          state: { transaction: t },
        })
      }
      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
    >
      View
    </button>
  </td>
</tr>

                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-2">
                <div className="text-sm text-gray-500">
                  {txnsCount !== null ? (
                    <span>
                      Page {txnsPage + 1} of {txnsPagesTotal ?? "?"} — {txnsCount} total
                    </span>
                  ) : (
                    <span>Page {txnsPage + 1}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setTxnsPage((p) => Math.max(0, p - 1))}
                    disabled={txnsPage === 0}
                    className="px-3 py-1 bg-white border rounded-md disabled:opacity-50 text-sm"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setTxnsPage((p) => p + 1)}
                    disabled={txnsPagesTotal !== null && txnsPage + 1 >= txnsPagesTotal}
                    className="px-3 py-1 bg-white border rounded-md disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- PROFIT HISTORY ---------------- */}
          {activeTab === "Profit History" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-lg font-semibold text-gray-800">Profit History</h3>
                <div className="text-sm text-gray-500">Profits & summary for this user</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-white border rounded-2xl p-4 text-center">
                  <div className="text-xs text-gray-400">Total Profit</div>
                  <div className="text-xl font-bold text-gray-900">
                    {profitSummary?.totalProfit ? Number(profitSummary.totalProfit).toLocaleString() : "₦0"}
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-4 text-center">
                  <div className="text-xs text-gray-400">Monthly (sample)</div>
                  <div className="text-lg text-gray-900">
                    {Array.isArray(profitSummary?.monthlyProfit) && profitSummary.monthlyProfit.length > 0 ? (
                      `${profitSummary.monthlyProfit[0].month}: ${Number(profitSummary.monthlyProfit[0].amount).toLocaleString()}`
                    ) : (
                      "—"
                    )}
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-4 text-center">
                  <div className="text-xs text-gray-400">Records</div>
                  <div className="text-lg text-gray-900">{profitsCount ?? profits.length}</div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
                <table className="min-w-[720px] w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Profit ID</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Txn ID</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Amount</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Profit</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Currency</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitsLoading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : profits.length > 0 ? (
                      profits.map((p) => (
                        <tr key={p.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">{p.id}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{p.transactionId}</td>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{Number(p.transaction?.amount  || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{Number(p.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{p.currency || p.transaction?.currency || "NGN"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{new Date(p.createdAt || Date.now()).toLocaleString()}</td>
                         
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-gray-500">
                          No profit records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-2">
                <div className="text-sm text-gray-500">
                  {profitsCount !== null ? (
                    <span>
                      Page {profitsPage + 1} of {profitsPagesTotal ?? "?"} — {profitsCount} total
                    </span>
                  ) : (
                    <span>Page {profitsPage + 1}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setProfitsPage((p) => Math.max(0, p - 1))}
                    disabled={profitsPage === 0}
                    className="px-3 py-1 bg-white border rounded-md disabled:opacity-50 text-sm"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setProfitsPage((p) => p + 1)}
                    disabled={profitsPagesTotal !== null && profitsPage + 1 >= profitsPagesTotal}
                    className="px-3 py-1 bg-white border rounded-md disabled:opacity-50 text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- KYC VERIFICATION ---------------- */}
          {activeTab === "KYC Verification" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-lg font-semibold text-gray-800">KYC Records</h3>
                <div className="text-sm text-gray-500">All KYC entries for this user</div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
                <table className="min-w-[720px] w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Type</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Value</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Issued</th>
                      <th className="px-4 py-3 sm:sticky sm:top-0 sm:z-10 sm:bg-white whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kycRecords && kycRecords.length > 0 ? (
                      kycRecords.map((k) => (
                        <tr key={k.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 capitalize whitespace-nowrap">{k.type}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{k.typeValue || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                k.status === "success"
                                  ? "bg-green-100 text-green-600"
                                  : k.status === "pending"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {k.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {k.issuedDate ? new Date(k.issuedDate).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {k.documentUrl || k.selfieUrl ? (
                              <a href={k.documentUrl || k.selfieUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                View
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-6 text-gray-500">
                          No KYC records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------- VIRTUAL ACCOUNTS ---------------- */}
{activeTab === "Virtual Accounts" && (
  <div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
      <h3 className="text-lg font-semibold text-gray-800">Virtual Accounts</h3>
      <div className="text-sm text-gray-500">All virtual accounts linked to this user</div>
    </div>

    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
      <table className="min-w-[720px] w-full text-sm text-left text-gray-700">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 whitespace-nowrap">Account Name</th>
            <th className="px-4 py-3 whitespace-nowrap">Account Number</th>
            <th className="px-4 py-3 whitespace-nowrap">Bank</th>
            <th className="px-4 py-3 whitespace-nowrap">Currency</th>
            <th className="px-4 py-3 whitespace-nowrap">Status</th>
            <th className="px-4 py-3 whitespace-nowrap">Created At</th>
          </tr>
        </thead>
        <tbody>
          {virtualAccountsLoading ? (
            <tr>
              <td colSpan="6" className="text-center py-6 text-gray-500">
                Loading...
              </td>
            </tr>
          ) : virtualAccountsError ? (
            <tr>
              <td colSpan="6" className="text-center py-6 text-red-500">
                {virtualAccountsError}
              </td>
            </tr>
          ) : virtualAccounts.length > 0 ? (
            virtualAccounts.map((va) => (
              <tr key={va.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap font-medium">
                  {va.accountName || "N/A"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {va.accountNumber || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {va.bank || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {va.currency || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      va.status === "active"
                        ? "bg-green-100 text-green-600"
                        : va.status === "pending"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {va.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(va.createdAt || Date.now()).toLocaleString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-6 text-gray-500">
                No virtual accounts found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* pagination */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-2">
      <div className="text-sm text-gray-500">
        {virtualAccountsCount !== null ? (
          <span>
            Page {virtualAccountsPage + 1} of {virtualAccountsPagesTotal ?? "?"} —{" "}
            {virtualAccountsCount} total
          </span>
        ) : (
          <span>Page {virtualAccountsPage + 1}</span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setVirtualAccountsPage((p) => Math.max(0, p - 1))}
          disabled={virtualAccountsPage === 0}
          className="px-3 py-1 bg-white border rounded-md disabled:opacity-50 text-sm"
        >
          Prev
        </button>
        <button
          onClick={() => setVirtualAccountsPage((p) => p + 1)}
          disabled={
            virtualAccountsPagesTotal !== null &&
            virtualAccountsPage + 1 >= virtualAccountsPagesTotal
          }
          className="px-3 py-1 bg-white border rounded-md disabled:opacity-50 text-sm"
        >
          Next
        </button>
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
}
