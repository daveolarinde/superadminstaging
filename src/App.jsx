import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  // ✅ Auto Logout Timer Reference
  const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes
  let logoutTimer;

  // ✅ Logout Function
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  // ✅ Reset Timer on User Activity
  const resetTimer = useCallback(() => {
    clearTimeout(logoutTimer);
    logoutTimer = setTimeout(handleLogout, AUTO_LOGOUT_TIME);
  }, [handleLogout]);

  // ✅ Detect user activity (mouse, keyboard, visibility)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      resetTimer();
    }

    const events = ["mousemove", "keydown", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // If the tab is hidden, we still let timer run
      } else {
        // When tab is active again, reset timer
        resetTimer();
      }
    });

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearTimeout(logoutTimer);
    };
  }, [resetTimer]);

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

      {/*  Protected Admin Area */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <DashboardPage setIsAuthenticated={setIsAuthenticated} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transaction-summary" element={<TransactionSummary />} />
        <Route path="transaction" element={<TransactionTable />} />
        <Route path="all-users" element={<AllUsers />} />
        <Route path="active-users" element={<ActiveUsers />} />
        <Route path="blocked-users" element={<BlockedUsers />} />
        <Route path="kyc-approved" element={<Approved />} />
        <Route path="kyc-pending" element={<Pending />} />
        <Route path="kyc-rejected" element={<Rejected />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
