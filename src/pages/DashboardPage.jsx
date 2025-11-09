import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardPage({ setIsAuthenticated }) {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-y-auto bg-gray-50">
        <Header setIsAuthenticated={setIsAuthenticated} />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
