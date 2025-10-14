import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

function IconCircle({ children }) {
  return (
    <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center">
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
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/transaction-summary", label: "Transaction Summary" },
    { to: "/admin/transaction", label: "Transaction" },
  ];

  const userMenuItems = [
    { to: "/admin/all-users", label: "All Users" },
    { to: "/admin/active-users", label: "Active Users" },
    { to: "/admin/blocked-users", label: "Blocked Users" },
  ];

  const kycMenuItems = [
    { to: "/admin/kyc-approved", label: "Approved KYC" },
    { to: "/admin/kyc-pending", label: "Pending KYC" },
    { to: "/admin/kyc-rejected", label: "Rejected KYC" },
  ];

  const MenuButton = ({ to, label, hasDropdown }) => {
    const isActive = location.pathname === to;
    return (
      <NavLink
        to={to}
        className={`w-full block text-left px-3 py-3 rounded-md mb-1 flex items-center justify-between gap-3 transition-all hover:bg-white/5 ${
          isActive ? "bg-white/8 ring-1 ring-white/10" : ""
        }`}
        onClick={() => setOpen(false)} // closes mobile drawer
      >
        <div className="flex items-center gap-3">
          <IconCircle>
            <svg
              className="w-4 h-4 text-white/90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7h18M3 12h18M3 17h18"
              />
            </svg>
          </IconCircle>
          <span>{label}</span>
        </div>

        {hasDropdown && (
          <svg
            className={`w-4 h-4 transition-transform ${
              openUserMenu ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </NavLink>
    );
  };

  // Sidebar layout reused for both desktop and mobile
  const SidebarContent = () => (
    <aside className="w-72 bg-slate-900 text-slate-100 min-h-screen p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full w-10 h-10 bg-emerald-400 flex items-center justify-center font-bold text-slate-900">
          S
        </div>
        <div>
          <div className="font-bold">SuperAdmin</div>
          <div className="text-xs text-slate-300">Admin</div>
        </div>
      </div>

      <nav className="flex-1">
        {items.map((it) => (
          <MenuButton key={it.to} to={it.to} label={it.label} />
        ))}

        {/* User Management */}
        <div>
          <button
            onClick={() => setOpenUserMenu(!openUserMenu)}
            className="w-full text-left px-3 py-3 rounded-md mb-1 flex items-center justify-between gap-3 transition-all hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <IconCircle>
                <svg
                  className="w-4 h-4 text-white/90"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7h18M3 12h18M3 17h18"
                  />
                </svg>
              </IconCircle>
              <span>User Management</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${
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

          {openUserMenu && (
            <div className="pl-10">
              {userMenuItems.map((sub) => (
                <MenuButton key={sub.to} to={sub.to} label={sub.label} />
              ))}
            </div>
          )}
        </div>

        {/* KYC Management */}
        <div>
          <button
            onClick={() => setOpenKycMenu(!openKycMenu)}
            className="w-full text-left px-3 py-3 rounded-md mb-1 flex items-center justify-between gap-3 transition-all hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <IconCircle>
                <svg
                  className="w-4 h-4 text-white/90"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7h18M3 12h18M3 17h18"
                  />
                </svg>
              </IconCircle>
              <span>KYC Management</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${
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

          {openKycMenu && (
            <div className="pl-10">
              {kycMenuItems.map((sub) => (
                <MenuButton key={sub.to} to={sub.to} label={sub.label} />
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="text-xs text-slate-400">Version 1.5</div>
    </aside>
  );

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md shadow"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
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
          {/* Slide-in sidebar */}
          <div className="fixed top-0 left-0 z-50 w-72 h-full animate-slideIn">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}
