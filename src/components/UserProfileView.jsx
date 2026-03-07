import React, { useEffect, useState, useMemo } from "react";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

import ProfileTab from "./UserProfile/userTabs/ProfileTab";
import WalletsTab from "./UserProfile/userTabs/WalletsTab";
import TransactionsTab from "./UserProfile/userTabs/TransactionsTab";
import ProfitHistoryTab from "./UserProfile/userTabs/ProfitHistoryTab";
import VirtualAccountsTab from "./UserProfile/userTabs/VirtualAccountsTab";
import UserKYCTab from "./UserProfile/userTabs/UserKYCTab";
import UserVirtualCardsTab from "./UserProfile/userTabs/Uservirtualcardstab";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const TABS = [
  "Profile",
  "Wallets",
  "Transactions",
  "Profit History",
  "KYC Verification",
  "Virtual Accounts",
  "Virtual Cards",
];

export default function UserProfileView({ onClose }) {
  const { userId } = useParams();
  const navigate = useNavigate();

  // ── User ──────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState("");

  // ── Tabs ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("Profile");

  // ── Virtual Accounts ──────────────────────────────────────
  const [virtualAccounts, setVirtualAccounts] = useState([]);
  const [virtualAccountsLoading, setVirtualAccountsLoading] = useState(false);
  const [virtualAccountsError, setVirtualAccountsError] = useState("");
  const [virtualAccountsPage, setVirtualAccountsPage] = useState(0);
  const [virtualAccountsCount, setVirtualAccountsCount] = useState(null);
  const virtualAccountsLimit = 10;

  // ── Transactions ──────────────────────────────────────────
  const [txns, setTxns] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [txnsPage, setTxnsPage] = useState(0);
  const [txnsCount, setTxnsCount] = useState(null);
  const txnsLimit = 10;

  // ── Profits ───────────────────────────────────────────────
  const [profits, setProfits] = useState([]);
  const [profitsLoading, setProfitsLoading] = useState(false);
  const [profitsPage, setProfitsPage] = useState(0);
  const [profitsCount, setProfitsCount] = useState(null);
  const [profitSummary, setProfitSummary] = useState(null);
  const profitsLimit = 10;

  // ── KYC ───────────────────────────────────────────────────
  const [kycRecords, setKycRecords] = useState([]);

  const token = localStorage.getItem("token");
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  // ── Helpers ───────────────────────────────────────────────
  const virtualAccountsPagesTotal = virtualAccountsCount
    ? Math.ceil(virtualAccountsCount / virtualAccountsLimit)
    : null;
  const txnsPagesTotal = txnsCount ? Math.ceil(txnsCount / txnsLimit) : null;
  const profitsPagesTotal = profitsCount ? Math.ceil(profitsCount / profitsLimit) : null;

  const parsedAddress = useMemo(() => {
    try {
      if (!user?.address) return null;
      if (typeof user.address === "string" && user.address.startsWith("{")) {
        const addr = JSON.parse(user.address);
        return [addr.street, addr.city, addr.state, addr.postalCode, addr.country]
          .filter(Boolean)
          .join(", ");
      }
      return user?.address || "N/A";
    } catch {
      return user?.address || "N/A";
    }
  }, [user?.address]);

  // ── Fetch: User ───────────────────────────────────────────
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
  }, [authHeaders, userId]);

  // ── Fetch: Virtual Accounts ───────────────────────────────
  const fetchVirtualAccounts = async (page = 0) => {
    if (!userId) return;
    setVirtualAccountsLoading(true);
    setVirtualAccountsError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/superadmin/virtual-accounts`, {
        headers: authHeaders,
        params: { userId, limit: virtualAccountsLimit, offset: page * virtualAccountsLimit },
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

  // ── Fetch: Transactions ───────────────────────────────────
  const fetchTransactions = async (page = 0) => {
    if (!userId) return;
    setTxnsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/superAdmin/transactions`, {
        headers: authHeaders,
        params: { userId, limit: txnsLimit, offset: page * txnsLimit },
      });
      const data = res.data?.data || [];
      setTxns(Array.isArray(data) ? data : []);
      const count = res.data?.count ?? res.data?.total;
      if (typeof count === "number") setTxnsCount(count);
    } catch (err) {
      console.error("Fetch transactions error:", err);
    } finally {
      setTxnsLoading(false);
    }
  };

  // ── Fetch: Profits ────────────────────────────────────────
  const fetchProfits = async (page = 0) => {
    if (!userId) return;
    setProfitsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/superAdmin/profits`, {
        headers: authHeaders,
        params: { userId, limit: profitsLimit, offset: page * profitsLimit },
      });
      const data = res.data?.data || [];
      setProfits(Array.isArray(data) ? data : []);
      if (typeof res.data?.count === "number") setProfitsCount(res.data.count);
      if (typeof res.data?.totalProfit === "number") {
        setProfitSummary((prev) => ({ ...(prev || {}), totalProfit: res.data.totalProfit }));
      }
    } catch (err) {
      console.error("Fetch profits error:", err);
    } finally {
      setProfitsLoading(false);
    }
  };

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

  const fetchKycRecords = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/superAdmin/kyc`, {
        headers: authHeaders,
        params: { userId, limit: 100, offset: 0 },
      });
      setKycRecords(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.warn("KYC fetch error:", err);
    }
  };

  // ── Tab switch effects ────────────────────────────────────
  useEffect(() => {
    if (activeTab === "Virtual Accounts") fetchVirtualAccounts(virtualAccountsPage);
  }, [activeTab, virtualAccountsPage, userId]);

  useEffect(() => {
    if (activeTab === "Transactions") fetchTransactions(txnsPage);
  }, [activeTab, txnsPage, userId]);

  useEffect(() => {
    if (activeTab === "Profit History") {
      fetchProfits(profitsPage);
      fetchProfitSummary();
    }
  }, [activeTab, profitsPage, userId]);

  useEffect(() => {
    if (activeTab === "KYC Verification") {
      if (!Array.isArray(user?.kycRecords) || user.kycRecords.length === 0) {
        fetchKycRecords();
      } else {
        setKycRecords(user.kycRecords);
      }
    }
  }, [activeTab, userId, user]);

  // ── Loading / Error states ────────────────────────────────
  if (loadingUser) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Loading user profile...</span>
      </div>
    );
  }

  if (errorUser || !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-center px-4 gap-3">
        <div className="text-5xl">😕</div>
        <p className="text-gray-500">{errorUser || "User not found"}</p>
        <button
          onClick={onClose || (() => navigate(-1))}
          className="mt-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* ── Profile Header Card ── */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative">
        <div className="h-20 sm:h-24 bg-gradient-to-r from-[#dbeafe] via-[#eff6ff] to-white" />

        <div className="px-4 sm:px-6 pb-5 -mt-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-blue-600 select-none">
              {user.firstname?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">
                  {user.firstname} {user.lastname}
                </h1>
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">
                {user.email}
                {user.country && <span className="ml-2">· {user.country}</span>}
                <span className="ml-2">
                  · Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose || (() => navigate(-1))}
            className="flex items-center gap-1.5 text-sm text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100 transition self-start sm:self-auto"
          >
            <FiArrowLeft size={14} /> Back
          </button>
        </div>
      </div>

      {/* ── Tabs + Content ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Tab bar */}
        <div className="flex items-center gap-1 overflow-x-auto px-4 pt-4 border-b border-gray-100 no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-shrink-0 text-sm px-3 py-2 rounded-t-lg whitespace-nowrap transition-colors ${
                t === activeTab
                  ? "text-blue-600 border-b-2 border-blue-600 font-semibold bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {activeTab === "Profile" && (
            <ProfileTab user={user} parsedAddress={parsedAddress} />
          )}

          {activeTab === "Wallets" && (
            <WalletsTab user={user} />
          )}

          {activeTab === "Transactions" && (
            <TransactionsTab
              txns={txns}
              txnsLoading={txnsLoading}
              txnsCount={txnsCount}
              txnsPage={txnsPage}
              txnsPagesTotal={txnsPagesTotal}
              setTxnsPage={setTxnsPage}
            />
          )}

          {activeTab === "Profit History" && (
            <ProfitHistoryTab
              profits={profits}
              profitsLoading={profitsLoading}
              profitsCount={profitsCount}
              profitsPage={profitsPage}
              profitsPagesTotal={profitsPagesTotal}
              profitSummary={profitSummary}
              setProfitsPage={setProfitsPage}
            />
          )}

          {activeTab === "KYC Verification" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-base font-semibold text-gray-800">KYC Records</h3>
                <div className="text-xs text-gray-400">All KYC entries for this user</div>
              </div>
              <UserKYCTab
                kycRecords={kycRecords}
                baseURL={API_BASE_URL}
                authHeader={authHeaders}
                fetchKycRecords={fetchKycRecords}
                fetchSummary={async () => {
                  try {
                    await axios.get(`${API_BASE_URL}/superAdmin/users/${userId}/summary`, {
                      headers: authHeaders,
                    });
                  } catch (err) {
                    console.warn("Failed to fetch summary:", err);
                  }
                }}
              />
            </div>
          )}

          {activeTab === "Virtual Accounts" && (
            <VirtualAccountsTab
              virtualAccounts={virtualAccounts}
              virtualAccountsLoading={virtualAccountsLoading}
              virtualAccountsError={virtualAccountsError}
              virtualAccountsCount={virtualAccountsCount}
              virtualAccountsPage={virtualAccountsPage}
              virtualAccountsPagesTotal={virtualAccountsPagesTotal}
              setVirtualAccountsPage={setVirtualAccountsPage}
            />
          )}

          {activeTab === "Virtual Cards" && (
            <UserVirtualCardsTab
              userId={userId}
              baseURL={API_BASE_URL}
              authHeader={authHeaders}
            />
          )}
        </div>
      </div>
    </div>
  );
}