import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import Dashboard from "./pages/Dashboard";
import TransactionSummary from "./pages/TransactionSummary";
import AllUsers from "./pages/users/AllUsers";
import TransactionTable from "./pages/TransactionTable";
import ViewTransaction from "./components/ViewTransactions";
import Profit from "./pages/profits";
import ActiveUsers from "./pages/users/ActiveUsers";
import BlockedUsers from "./pages/users/BlockedUsers";
import InactiveUsers from "./pages/users/InActiveUsers";
import DeactivateUsers from "./pages/users/DeactivateUsers";
import Pending from "./pages/Kyc/KycPending";
import Approved from "./pages/Kyc/KycApproved";
import Rejected from "./pages/Kyc/KycRejected";
import UserProfileView from "./components/UserProfileView";
import VirtualCards from "./pages/VirtualCards";
import ViewCardDetails from "./components/ViewCardDetails";
import KycAll from "./pages/Kyc/KycAll";
import VirtualAccounts from "./pages/VirtualAccounts";
import ViewVirtualAccount from "./components/ViewVirtualAccount";

import ExchangeRates from "./components/ExchangeRates";
import Announcements from "./pages/Announcements";
import KycLimit from "./pages/Kyc/KycLimit";
import ReferralSettings from "./pages/Referralsettings";
import Currencies from "./pages/Currencies";
import Pricing from "./pages/Pricing";
import WewireBeneficiaries from "./pages/Wewirebeneficiaries";
import WalletTools from "./pages/Wallettools";

function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const expiry = getTokenExpiry(token);

    if (expiry && Date.now() >= expiry) {
      logout();
      return;
    }

    setIsAuthenticated(true);

    if (expiry) {
      const msUntilExpiry = expiry - Date.now();
      const timer = setTimeout(() => {
        logout();
      }, msUntilExpiry);

      return () => clearTimeout(timer);
    }
  }, [logout]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login setIsAuthenticated={setIsAuthenticated} />
          )
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <DashboardPage setIsAuthenticated={setIsAuthenticated} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
       
        <Route path="transaction-summary" element={<TransactionSummary />} />
        <Route path="transaction" element={<TransactionTable />} />
        <Route path="transactions/:id" element={<ViewTransaction />} />
        <Route path="profit" element={<Profit />} />
        <Route path="all-users" element={<AllUsers />} />
        <Route path="active-users" element={<ActiveUsers />} />
        <Route path="blocked-users" element={<BlockedUsers />} />
        <Route path="kyc-all" element={<KycAll />} />
        <Route path="kyc-approved" element={<Approved />} />
        <Route path="kyc-pending" element={<Pending />} />
        <Route path="kyc-rejected" element={<Rejected />} />
        <Route path="inactive-users" element={<InactiveUsers />} />
        <Route path="deactivate-users" element={<DeactivateUsers />} />
        <Route path="all-users/:userId" element={<UserProfileView />} />
        <Route path="virtual-cards" element={<VirtualCards />} />
        <Route path="virtual-cards/:id" element={<ViewCardDetails />} />
        <Route path="virtual-accounts" element={<VirtualAccounts />} />
        <Route path="virtual-accounts/:userId" element={<ViewVirtualAccount />} />
        <Route path="exchange-rates" element={<ExchangeRates />} />
        <Route path="Announcements" element={<Announcements />} />
        <Route path="kyc-limit" element={<KycLimit />} />
        <Route path="referral-settings" element={<ReferralSettings />} />
        <Route path="currencies" element={<Currencies />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="wewire-beneficiaries" element={<WewireBeneficiaries />} />
        <Route path="admin-tools" element={<WalletTools />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}