import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  RefreshCw, Search, X, ChevronDown, ChevronUp,
  User, Building2, CreditCard, Mail, Phone,
  MapPin, ExternalLink, CheckCircle2, XCircle,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_STAGE_URL;

// ── helpers ───────────────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS = { NGN: "₦", USD: "$", EUR: "€", GBP: "£", GHS: "₵" };

const initials = (first, last) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "??";

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
];
const avatarColor = (id = "") =>
  AVATAR_COLORS[(id.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const displayName = (b) =>
  b.name ?? (`${b.firstName ?? ""} ${b.lastName ?? ""}`.trim() || "—");

// ── account type badge ────────────────────────────────────────────────────────
const AccountTypeBadge = ({ type }) => {
  const map = {
    BANK_ACCOUNT: { color: "bg-blue-50 text-blue-700", label: "Bank Account" },
    WALLET: { color: "bg-emerald-50 text-emerald-700", label: "Wallet" },
    CARD: { color: "bg-purple-50 text-purple-700", label: "Card" },
  };
  const cfg = map[type] ?? { color: "bg-gray-100 text-gray-600", label: type ?? "Unknown" };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

// ── beneficiary type badge ────────────────────────────────────────────────────
const BeneficiaryTypeBadge = ({ type }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${type === "BUSINESS"
      ? "bg-amber-50 text-amber-700"
      : "bg-sky-50 text-sky-700"
    }`}>
    {type === "BUSINESS" ? <Building2 size={9} /> : <User size={9} />}
    {type === "INDIVIDUAL" ? "Individual" : "Business"}
  </span>
);

// ── account row inside expanded section ───────────────────────────────────────
const AccountCard = ({ account }) => {
  const ccySymbol = CURRENCY_SYMBOLS[account.currency] ?? account.currency ?? "";
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-800">
            {account.accountName ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AccountTypeBadge type={account.type} />
          {account.currency && (
            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {ccySymbol} {account.currency}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {[
          { label: "Bank", value: account.bankName },
          { label: "Account No.", value: account.accountNumber },
          { label: "SWIFT / BIC", value: account.swiftBic },
          { label: "Routing No.", value: account.routingNumber },
          { label: "IBAN", value: account.iban },
          { label: "Sort Code", value: account.sortCode },
          { label: "Country", value: account.country },
          { label: "Settlement", value: account.settlementMethod },
        ]
          .filter((f) => f.value)
          .map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-xs font-medium text-gray-700 mt-0.5 break-all">{value}</p>
            </div>
          ))}
      </div>
    </div>
  );
};

// ── single beneficiary row ────────────────────────────────────────────────────
const BeneficiaryRow = ({ beneficiary }) => {
  const [expanded, setExpanded] = useState(false);
  const name = displayName(beneficiary);
  const accounts = beneficiary.beneficiaryAccounts ?? [];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* main row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors"
      >
        {/* avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(beneficiary.id)}`}
        >
          {beneficiary.type === "BUSINESS"
            ? <Building2 size={16} />
            : initials(beneficiary.firstName, beneficiary.lastName)}
        </div>

        {/* name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-800 truncate">{name}</span>
            <BeneficiaryTypeBadge type={beneficiary.type} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {beneficiary.email && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Mail size={10} /> {beneficiary.email}
              </span>
            )}
            {beneficiary.telephone && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Phone size={10} /> {beneficiary.telephone}
              </span>
            )}
            {beneficiary.city && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={10} /> {beneficiary.city}{beneficiary.country ? `, ${beneficiary.country}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* accounts count + currency pills */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {accounts.length > 0 && (
            <div className="flex gap-1">
              {[...new Set(accounts.map((a) => a.currency).filter(Boolean))].map((ccy) => (
                <span
                  key={ccy}
                  className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {ccy}
                </span>
              ))}
            </div>
          )}
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {accounts.length} acct{accounts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* expand chevron */}
        <div className="text-gray-400 shrink-0 ml-2">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* expanded — accounts + extra fields */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/40 space-y-4">

          {/* extra beneficiary details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: "ID", value: beneficiary.id, mono: true },
              { label: "External ID", value: beneficiary.externalId },
              { label: "Business ID", value: beneficiary.businessId, mono: true },
              { label: "Sub Customer", value: beneficiary.subCustomerId },
              { label: "Address", value: [beneficiary.addressLine1, beneficiary.addressLine2, beneficiary.buildingName].filter(Boolean).join(", ") || null },
              { label: "Postal Code", value: beneficiary.postalCode },
              { label: "State", value: beneficiary.state },
              { label: "Registered", value: beneficiary.createdAt ? new Date(beneficiary.createdAt).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null },
            ]
              .filter((f) => f.value)
              .map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className={`mt-0.5 text-gray-700 break-all ${mono ? "font-mono text-[11px]" : "font-medium text-xs"}`}>
                    {value}
                  </p>
                </div>
              ))}
          </div>

          {/* account cards */}
          {accounts.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Bank Accounts / Wallets ({accounts.length})
              </p>
              {accounts.map((acct) => (
                <AccountCard key={acct.id} account={acct} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No accounts linked to this beneficiary.</p>
          )}
        </div>
      )}
    </div>
  );
};

// ── toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
      }`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={13} /></button>
    </div>
  );
};

// ── main page ─────────────────────────────────────────────────────────────────
export default function WewireBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 30,
  });
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchBeneficiaries = useCallback(async (page = 1, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const res = await axios.get(
        `${API_BASE_URL}/superAdmin/wewire/beneficiaries?page=${page}`,
        { headers }
      );
      // response shape: { data: { data: [], totalItems, totalPages, currentPage, pageSize } }
      const payload = res.data?.data ?? {};
      const list = payload.data ?? [];
      setBeneficiaries(list);
      setFiltered(list);
      setPagination({
        currentPage: payload.currentPage ?? page,
        totalPages: payload.totalPages ?? 1,
        totalItems: payload.totalItems ?? list.length,
        pageSize: payload.pageSize ?? 30,
      });
    } catch {
      setError("Failed to load WeWire beneficiaries.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBeneficiaries(1); }, []);

  // ── client search ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setFiltered(beneficiaries); return; }
    const term = search.toLowerCase();
    setFiltered(
      beneficiaries.filter((b) =>
        displayName(b).toLowerCase().includes(term) ||
        b.email?.toLowerCase().includes(term) ||
        b.beneficiaryAccounts?.some(
          (a) =>
            a.bankName?.toLowerCase().includes(term) ||
            a.accountNumber?.includes(term) ||
            a.accountName?.toLowerCase().includes(term)
        )
      )
    );
  }, [search, beneficiaries]);

  // ── derived ────────────────────────────────────────────────────────────────
  const individualCount = beneficiaries.filter((b) => b.type === "INDIVIDUAL").length;
  const businessCount = beneficiaries.filter((b) => b.type === "BUSINESS").length;
  const totalAccounts = beneficiaries.reduce((s, b) => s + (b.beneficiaryAccounts?.length ?? 0), 0);
  const currencies = [...new Set(
    beneficiaries.flatMap((b) => b.beneficiaryAccounts?.map((a) => a.currency).filter(Boolean) ?? [])
  )];

  // ── render ─────────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-4 h-4 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading beneficiaries…
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-gray-500">
        <p>{error}</p>
        <button
          onClick={() => fetchBeneficiaries(1)}
          className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">WeWire Beneficiaries</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            All registered payout beneficiaries via WeWire
          </p>
        </div>
        <button
          onClick={() => fetchBeneficiaries(pagination.currentPage, true)}
          disabled={refreshing}
          className="self-start sm:self-auto p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: pagination.totalItems, color: "text-gray-800" },
          { label: "Individuals", value: individualCount, color: "text-sky-600" },
          { label: "Businesses", value: businessCount, color: "text-amber-600" },
          { label: "Accounts", value: totalAccounts, color: "text-violet-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* currencies active */}
      {currencies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currencies.map((ccy) => (
            <span
              key={ccy}
              className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full"
            >
              {CURRENCY_SYMBOLS[ccy] ?? ""} {ccy}
            </span>
          ))}
        </div>
      )}

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="relative w-full sm:w-80">
        <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search name, email, bank, account no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-300"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── List ──────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((b) => <BeneficiaryRow key={b.id} beneficiary={b} />)
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
            <User size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">
              {search ? "No beneficiaries match your search." : "No beneficiaries found."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-sm text-emerald-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-400">
            Page <strong className="text-gray-600">{pagination.currentPage}</strong> of{" "}
            <strong className="text-gray-600">{pagination.totalPages}</strong>
            {" "}· {pagination.totalItems} total
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagination.currentPage <= 1}
              onClick={() => fetchBeneficiaries(pagination.currentPage - 1)}
              className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Prev
            </button>
            <button
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => fetchBeneficiaries(pagination.currentPage + 1)}
              className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}