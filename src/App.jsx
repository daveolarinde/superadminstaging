import { useState, useEffect } from "react";
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
import FeesManagement from "./components/FeesManagement";
import ExchangeRates from "./components/ExchangeRates";
function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);

    
    const handleBeforeUnload = () => {
      localStorage.removeItem("token");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <Routes>
      {/* Login Page */}
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

      {/* Protected Admin  */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <DashboardPage setIsAuthenticated={setIsAuthenticated} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="Fees-management" element={<FeesManagement/>}/>
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
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
