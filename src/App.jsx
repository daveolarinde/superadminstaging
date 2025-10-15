import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import Dashboard from "./components/Dashboard";
import TransactionSummary from "./components/TransactionSummary";
import AllUsers from "./components/users/AllUsers";
import TransactionTable from "./components/TransactionTable";
import ActiveUsers from "./components/users/ActiveUsers";
import BlockedUsers from "./components/users/BlockedUsers";
import Pending from "./components/Kyc/KycPending";
import Approved from "./components/Kyc/Approved";
import Rejected from "./components/Kyc/Rejected";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ Check if user is already logged in (token in localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <Routes>
      {/* ✅ Login Page */}
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

      {/* ✅ Protected Admin Area */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <DashboardPage setIsAuthenticated={setIsAuthenticated} />
          </ProtectedRoute>
        }
      >
        {/* Default route */}
        <Route index element={<Dashboard />} />

        {/* Transaction Routes */}
        <Route path="transaction-summary" element={<TransactionSummary />} />
        <Route path="transaction" element={<TransactionTable />} />

        {/* User Management */}
        <Route path="all-users" element={<AllUsers />} />
        <Route path="active-users" element={<ActiveUsers />} />
        <Route path="blocked-users" element={<BlockedUsers />} />

        {/* KYC Management */}
        <Route path="kyc-approved" element={<Approved />} />
        <Route path="kyc-pending" element={<Pending />} />
        <Route path="kyc-rejected" element={<Rejected />} />
      </Route>

      {/* ✅ Fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
