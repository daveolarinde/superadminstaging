import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TransactionSummary from "../components/TransactionSummary";
import Dashboard from "../components/Dashboard";
import AllUsers from "../components/users/AllUsers";
import TransactionTable from "../components/TransactionTable"
import ActiveUsers from "../components/users/ActiveUsers";
import BlockedUsers from "../components/users/BlockedUsers";
import Pending from "../components/Kyc/KycPending";
import Approved from "../components/Kyc/Approved";
import Rejected from "../components/Kyc/Rejected";  
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;

      case "transaction-summary":     
        return <TransactionSummary />; 
  case "all-users":
      return <AllUsers />;
      case "TransactionTable":
        return <TransactionTable />;
      case "active-users":
        return <ActiveUsers />;
        case "blocked-users":
          return <BlockedUsers />;
          case "kyc-pending":
            return <Pending />;
            case "kyc-approved":
              return <Approved />;
              case "kyc-rejected":
                return <Rejected />;
      default:
        return <div className="p-6">Coming soon…</div>;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar active={activeTab} setActive={setActiveTab} />

      <div className="flex flex-col flex-1 overflow-y-auto bg-gray-50">
        <Header />
        <main className="flex-1 overflow-y-auto">{renderTab()}</main>
      </div>
    </div>
  );
}
