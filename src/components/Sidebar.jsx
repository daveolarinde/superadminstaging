import React, { useState } from "react";

function IconCircle({ children }) {
  return (
    <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center">
      {children}
    </div>
  );
}

export default function Sidebar({ active, setActive }) {
  const [open, setOpen] = useState(false);             // mobile drawer
  const [openUserMenu, setOpenUserMenu] = useState(false); // dropdown toggle
  const [openKycMenu, setOpenKycMenu] = useState(false);
  // flat menu items
  const items = [
    { id: "dashboard", label: "Dashboard" },
    { id: "transaction-summary", label: "Transaction Summary" },
   

    { id: "virtual-card", label: "Virtual Card" },
    { id: "TransactionTable", label: "Transaction" },
 
  ];

  // dropdown submenu
  const userMenuItems = [
    { id: "all-users", label: "All Users" },
    { id: "active-users", label: "Active Users" },
    { id: "blocked-users", label: "Blocked Users" },
    { id: "email-unverified", label: "Email Unverified" },
    { id: "sms-unverified", label: "SMS Unverified" },
    { id: "mail-to-users", label: "Mail To Users" },
  ];

  const kycMenuItems = [
  {id: "kyc-approved", label: "Approved KYC"},
  {id: "kyc-pending", label: "Pending KYC"},
  {id: "kyc-rejected", label: "Rejected KYC"},
  ];

  const MenuButton = ({ id, label, onClick, isActive, hasDropdown }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 rounded-md mb-1 flex items-center justify-between gap-3 transition-all hover:bg-white/5 focus:outline-none ${
        isActive ? "bg-white/8 ring-1 ring-white/10" : ""
      }`}
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
    </button>
  );

  return (
    <>
      {/* Hamburger Button for Mobile */}
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

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 bg-slate-900 text-slate-100 min-h-screen p-6 flex-col gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="rounded-full w-10 h-10 bg-emerald-400 flex items-center justify-center font-bold text-slate-900">
            S
          </div>
          <div>
            <div className="font-bold">SuperAdmin</div>
            <div className="text-xs text-slate-300">Admin</div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1">
          {/* Normal items */}
          {items.map((it) => (
            <MenuButton
              key={it.id}
              label={it.label}
              isActive={active === it.id}
              onClick={() => setActive(it.id)}
            />
          ))}

          {/* Dropdown Section */}
          <div>
            <MenuButton
              label="User Management"
              hasDropdown
              isActive={openUserMenu}
              onClick={() => setOpenUserMenu(!openUserMenu)}
            />
            {openUserMenu && (
              <div className="pl-10">
                {userMenuItems.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setActive(sub.id)}
                    className={`block w-full text-left px-2 py-2 rounded-md text-sm mb-1 transition hover:bg-white/5 ${
                      active === sub.id ? "bg-white/8 ring-1 ring-white/10" : ""
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>



<div>
            <MenuButton
              label="Kyc  Management"
              hasDropdown
              isActive={openKycMenu}
              onClick={() => setOpenKycMenu(!openKycMenu)}
            />
            {openKycMenu && (
              <div className="pl-10">
                {kycMenuItems.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setActive(sub.id)}
                    className={`block w-full text-left px-2 py-2 rounded-md text-sm mb-1 transition hover:bg-white/5 ${
                      active === sub.id ? "bg-white/8 ring-1 ring-white/10" : ""
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </nav>

        <div className="text-xs text-slate-400">Version 1.5</div>
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed top-0 left-0 w-72 h-full bg-slate-900 text-slate-100 p-6 flex flex-col gap-6 z-50 animate-slideIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full w-10 h-10 bg-emerald-400 flex items-center justify-center font-bold text-slate-900">
                  S
                </div>
                <div>
                  <div className="font-bold">SuperAdmin</div>
                  <div className="text-xs text-slate-300">Admin</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 mt-6">
              {items.map((it) => (
                <MenuButton
                  key={it.id}
                  label={it.label}
                  isActive={active === it.id}
                  onClick={() => {
                    setActive(it.id);
                    setOpen(false);
                  }}
                />
              ))}

              {/* Dropdown for mobile */}
              <div>
                <MenuButton
                  label="User Management"
                  hasDropdown
                  isActive={openUserMenu}
                  onClick={() => setOpenUserMenu(!openUserMenu)}
                />
                {openUserMenu && (
                  <div className="pl-10">
                    {userMenuItems.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActive(sub.id);
                          setOpen(false);
                        }}
                        className={`block w-full text-left px-2 py-2 rounded-md text-sm mb-1 transition hover:bg-white/5 ${
                          active === sub.id ? "bg-white/8 ring-1 ring-white/10" : ""
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <MenuButton
                  label="Kyc Management"
                  hasDropdown
                  isActive={openKycMenu}
                  onClick={() => setOpenKycMenu(!openKycMenu)}
                />
                {openKycMenu && (
                  <div className="pl-10">
                    {kycMenuItems.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActive(sub.id);
                          setOpen(false);
                        }}
                        className={`block w-full text-left px-2 py-2 rounded-md text-sm mb-1 transition hover:bg-white/5 ${
                          active === sub.id ? "bg-white/8 ring-1 ring-white/10" : ""
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              
            </nav>

            <div className="text-xs text-slate-400">Version 1.5</div>
          </aside>
        </>
      )}
    </>
  );
}
