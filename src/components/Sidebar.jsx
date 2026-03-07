import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ArrowLeftRight, Users, ShieldCheck,
  UserCheck, UserX, UserMinus, Clock, BadgeCheck,
  CreditCard, Landmark, TrendingUp, Percent, DollarSign,
  ChevronRight, X, Menu, FileText,Megaphone
} from "lucide-react";

// ── Nav link item ─────────────────────────────────────────────────────────────
const NavItem = ({ to, label, icon, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to ||
    (to !== "/admin" && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 group ${
        isActive
          ? "bg-white/15 text-white"
          : "text-slate-400 hover:bg-white/8 hover:text-slate-200"
      }`}
    >
      <span className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}>
        {icon}
      </span>
      <span className="text-[13px] font-medium leading-none">{label}</span>
      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
    </NavLink>
  );
};

// ── Collapsible group ─────────────────────────────────────────────────────────
const NavGroup = ({ label, icon, items, onClose }) => {
  const location = useLocation();
  const isAnyActive = items.some((i) => location.pathname.startsWith(i.to));
  const [open, setOpen] = useState(isAnyActive);

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-150 group ${
          isAnyActive
            ? "bg-white/15 text-white"
            : "text-slate-400 hover:bg-white/8 hover:text-slate-200"
        }`}
      >
        <span className={`shrink-0 ${isAnyActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`}>
          {icon}
        </span>
        <span className="text-[13px] font-medium leading-none flex-1 text-left">{label}</span>
        <ChevronRight
          size={13}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""} ${
            isAnyActive ? "text-slate-300" : "text-slate-600 group-hover:text-slate-400"
          }`}
        />
      </button>

      <div className={`overflow-hidden transition-all duration-250 ${open ? "max-h-96 mt-0.5" : "max-h-0"}`}>
        <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5">
          {items.map((sub) => (
            <NavItem key={sub.to} {...sub} onClick={onClose} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-2 mt-5">
    {children}
  </p>
);

// ── Sidebar content ───────────────────────────────────────────────────────────
const SidebarContent = ({ onClose }) => {
  const mainItems = [
    { to: "/admin",                    label: "Dashboard",          icon: <LayoutDashboard size={16} /> },
    { to: "/admin/transaction-summary",label: "Transactions Summary",         icon: <TrendingUp size={16} />      },
    { to: "/admin/transaction",        label: "Transactions",       icon: <ArrowLeftRight size={16} />  },
    { to: "/admin/profit",             label: "Profits",            icon: <DollarSign size={16} />      },
    { to: "/admin/Announcements", label: "Announcements", icon: <Megaphone size={16} /> },
    
  ];

  const financeItems = [
    { to: "/admin/exchange-rates",     label: "Exchange Rates",     icon: <ArrowLeftRight size={16} /> },
    { to: "/admin/Fees-management",    label: "Fees Management",    icon: <Percent size={16} />        },
    { to: "/admin/virtual-cards",      label: "Virtual Cards",      icon: <CreditCard size={16} />     },
    { to: "/admin/virtual-accounts",   label: "Virtual Accounts",   icon: <Landmark size={16} />       },
  ];

  const userItems = [
    { to: "/admin/all-users",          label: "All Users",          icon: <Users size={15} />      },
    { to: "/admin/active-users",       label: "Active",             icon: <UserCheck size={15} />  },
    { to: "/admin/blocked-users",      label: "Blocked",            icon: <UserX size={15} />      },
    { to: "/admin/inactive-users",     label: "Inactive",           icon: <UserMinus size={15} />  },
    { to: "/admin/Deactivate-users",   label: "Deactivated",        icon: <Clock size={15} />      },
  ];

  const kycItems = [
    { to: "/admin/kyc-all",            label: "All KYC",            icon: <FileText size={15} />    },
    { to: "/admin/kyc-approved",       label: "Approved",           icon: <BadgeCheck size={15} />  },
    { to: "/admin/kyc-pending",        label: "Pending",            icon: <Clock size={15} />       },
    { to: "/admin/kyc-rejected",       label: "Rejected",           icon: <UserX size={15} />       },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col select-none">

      {/* ── Logo / Brand ── */}
      <div className="px-5 py-5 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-slate-900 text-sm shadow-lg">
            S
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">SuperAdmin</p>
            <p className="text-[11px] text-slate-500 leading-tight">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">

        <SectionLabel>Main</SectionLabel>
        {mainItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}

        <SectionLabel>Finance</SectionLabel>
        {financeItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}

        <SectionLabel>People</SectionLabel>
        <NavGroup
          label="User Management"
          icon={<Users size={16} />}
          items={userItems}
          onClose={onClose}
        />
        <NavGroup
          label="KYC Management"
          icon={<ShieldCheck size={16} />}
          items={kycItems}
          onClose={onClose}
        />
      </nav>

      {/* ── Footer ── */}
      <div className="px-4 py-4 border-t border-white/8 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">Admin</p>
            <p className="text-[10px] text-slate-600 truncate">Logged in</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Online" />
        </div>
      </div>
    </aside>
  );
};

// ── Export ────────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition"
      >
        <Menu size={18} />
      </button>

      {/* Desktop */}
      <div className="hidden md:flex shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-0 left-0 z-50 h-full shadow-2xl">
            <div className="relative">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-[-44px] z-10 w-9 h-9 flex items-center justify-center bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
              >
                <X size={16} />
              </button>
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}