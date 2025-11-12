import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaExchangeAlt,
  FaUsers,
  FaUserShield,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaIdCardAlt,
  FaIdBadge,
  FaTimes,
  FaCreditCard,
} from "react-icons/fa";
import { FiMenu } from "react-icons/fi";

function IconCircle({ children }) {
  return (
    <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openKycMenu, setOpenKycMenu] = useState(false);

  const items = [
    { to: "/admin", label: "Dashboard", icon: <FaTachometerAlt /> },
    {
      to: "/admin/transaction-summary",
      label: "Transaction Summary",
      icon: <FaExchangeAlt />,

    },
    { to: "/admin/transaction", label: "Transaction", icon: <FaExchangeAlt /> },
    { to: "/admin/Fees-management", label: "Fees Management", icon: <FaTachometerAlt /> },
    { to: "/admin/virtual-cards", label: "Virtual Cards", icon: <FaCreditCard /> },
    {to: "/admin/virtual-accounts", label: "Virtual Accounts", icon: <FaCreditCard />  },
    { to: "/admin/profit", label: "Profits", icon: <FaTachometerAlt /> },
  ];

  const userMenuItems = [
    { to: "/admin/all-users", label: "All Users", icon: <FaUsers /> },
    { to: "/admin/active-users", label: "Active Users", icon: <FaUserCheck /> },
    { to: "/admin/blocked-users", label: "Blocked Users", icon: <FaUserTimes /> },
    { to: "/admin/inactive-users", label: "Inactive Users", icon: <FaUserClock /> },
    { to: "/admin/Deactivate-users", label: "Deactivate Users", icon: <FaUserShield /> },
  ];

  const kycMenuItems = [
    { to: "/admin/kyc-all", label: "All KYC", icon: <FaIdCardAlt /> },
    { to: "/admin/kyc-approved", label: "Approved KYC", icon: <FaIdBadge /> },
    { to: "/admin/kyc-pending", label: "Pending KYC", icon: <FaIdCardAlt /> },
    { to: "/admin/kyc-rejected", label: "Rejected KYC", icon: <FaUserTimes /> },
  ];

 
  const MenuButton = ({ to, label, icon }) => {
    const isActive = location.pathname === to;
    return (
      <NavLink
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-md mb-1 transition-all duration-200
          ${
            isActive
              ? "bg-white/20 text-white font-medium"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        onClick={() => setOpen(false)}
      >
        <div className="text-lg">{icon}</div>
        <span className="text-sm">{label}</span>
      </NavLink>
    );
  };

  const SidebarContent = () => (
    <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white h-screen p-6 flex flex-col shadow-lg">
      {/* Logo / Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-full w-10 h-10 bg-emerald-400 flex items-center justify-center font-bold text-slate-900">
          S
        </div>
        <div>
          <div className="font-bold text-lg">SuperAdmin</div>
          <div className="text-xs text-slate-300">Admin Panel</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        {items.map((it) => (
          <MenuButton key={it.to} {...it} />
        ))}

        {/* USER MANAGEMENT */}
        <div>
          <button
            onClick={() => setOpenUserMenu(!openUserMenu)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-md hover:bg-white/10 text-slate-300 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <FaUsers />
              <span className="font-medium text-sm">User Management</span>
            </div>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                openUserMenu ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              openUserMenu ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="pl-8">
              {userMenuItems.map((sub) => (
                <MenuButton key={sub.to} {...sub} />
              ))}
            </div>
          </div>
        </div>

        {/* KYC MANAGEMENT */}
        <div>
          <button
            onClick={() => setOpenKycMenu(!openKycMenu)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-md hover:bg-white/10 text-slate-300 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <FaIdCardAlt />
              <span className="font-medium text-sm">KYC Management</span>
            </div>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                openKycMenu ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              openKycMenu ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="pl-8">
              {kycMenuItems.map((sub) => (
                <MenuButton key={sub.to} {...sub} />
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Footer */}
      
    </aside>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-5 left-5 z-50 p-2 bg-slate-900 text-white rounded-md shadow-lg hover:bg-slate-800 transition"
      >
        <FiMenu className="w-6 h-6" />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <SidebarContent />
      </div>

      {/* Mobile Drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed top-0 left-0 z-50 w-72 h-full bg-slate-900">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-slate-300 transition"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}
