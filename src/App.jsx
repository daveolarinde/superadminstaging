import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import Dashboard from "./components/Dashboard";
import TransactionSummary from "./components/TransactionSummary";
import AllUsers from "./components/users/AllUsers";
import TransactionTable from "./components/TransactionTable";
import ViewTransaction from "./components/ViewTransactions";
import Profit from "./components/profits";
import ActiveUsers from "./components/users/ActiveUsers";
import BlockedUsers from "./components/users/BlockedUsers";
import InactiveUsers from "./components/users/InActiveUsers"; 
import DeactivateUsers from "./components/users/DeactivateUsers";
import Pending from "./components/Kyc/KycPending";
import Approved from "./components/Kyc/KycApproved";
import Rejected from "./components/Kyc/KycRejected";
import UserProfileView from "./components/UserProfileView";
import VirtualCards from "./components/VirtualCards";
import ViewCardDetails from "./components/ViewCardDetails";
import KycAll from "./components/Kyc/KycAll";
import VirtualAccounts from "./components/VirtualAccounts";
import ViewVirtualAccount from "./components/ViewVirtualAccount";

function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);

    // Clear token on browser close
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
            <Navigate to="/admin" replace />
          ) : (
            <Login setIsAuthenticated={setIsAuthenticated} />
          )
        }
      />

      {/* Protected Admin Area */}
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
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
