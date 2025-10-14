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
  const token = sessionStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Login Page */}
      <Route path="/login" element={<Login />} />

      {/* Protected Admin Area */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      >
        {/* Default route */}
        <Route index element={<Dashboard />} />

        {/* Top-level routes */}
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

      {/* Fallback — redirects any unknown route */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
