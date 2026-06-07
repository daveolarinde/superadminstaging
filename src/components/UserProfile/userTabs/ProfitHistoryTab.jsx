import React from "react";

// ── helpers ───────────────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS = { NGN: "₦", USD: "$", GHS: "₵", GBP: "£", EUR: "€" };

const fmt = (amount, currency = "NGN") =>
  `${CURRENCY_SYMBOLS[currency] ?? currency + " "}${parseFloat(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// colour palette per currency (cycles if more arrive)
const CURRENCY_THEMES = [
  {
    wrap:  "bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-100",
    label: "text-emerald-600",
    value: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    dot:   "bg-emerald-400",
  },
  {
    wrap:  "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-100",
    label: "text-blue-600",
    value: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    dot:   "bg-blue-400",
  },
  {
    wrap:  "bg-gradient-to-br from-violet-50 to-violet-100 border-violet-100",
    label: "text-violet-600",
    value: "text-violet-700",
    badge: "bg-violet-100 text-violet-700",
    dot:   "bg-violet-400",
  },
  {
    wrap:  "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-100",
    label: "text-amber-600",
    value: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    dot:   "bg-amber-400",
  },
];

const theme = (idx) => CURRENCY_THEMES[idx % CURRENCY_THEMES.length];

// one currency block inside the summary grid
const CurrencyBlock = ({ currency, stats, idx }) => {
  const t = theme(idx);
  const rows = [
    { label: "Net Earnings",   value: fmt(stats.netEarnings,   currency) },
    { label: "Monthly",        value: fmt(stats.monthlyProfit, currency) },
    { label: "Weekly",         value: fmt(stats.weeklyProfit,  currency) },
    { label: "Daily",          value: fmt(stats.dailyProfit,   currency) },
    { label: "Total Loss",     value: fmt(stats.totalLoss,     currency), dim: true },
    { label: "Transactions",   value: stats.totalTransactions             },
  ];

  return (
    <div className={`border rounded-2xl overflow-hidden ${t.wrap}`}>
      {/* header */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/60">
        <span className={`w-2 h-2 rounded-full ${t.dot}`} />
        <span className={`text-xs font-bold uppercase tracking-widest ${t.label}`}>
          {currency}
        </span>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${t.badge}`}>
          {fmt(stats.totalProfit, currency)}
        </span>
      </div>

      {/* stat grid */}
      <div className="grid grid-cols-3 divide-x divide-white/50">
        {rows.map(({ label, value, dim }) => (
          <div key={label} className="px-3 py-2.5">
            <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${t.label} opacity-70`}>
              {label}
            </p>
            <p className={`text-sm font-semibold ${dim ? "text-gray-400" : t.value}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── component ─────────────────────────────────────────────────────────────────
export default function ProfitHistoryTab({
  profits,
  profitsLoading,
  profitsCount,
  profitsPage,
  profitsPagesTotal,
  profitSummary,   // shape: { GBP: { totalProfit, netEarnings, ... }, EUR: {...}, ... }
  setProfitsPage,
}) {
  // profitSummary is already the `data` object from the API response
  const summaryEntries = profitSummary ? Object.entries(profitSummary) : [];

  // totals across all currencies for the top bar
  const totalTxns = summaryEntries.reduce((s, [, v]) => s + (v.totalTransactions ?? 0), 0);

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Profit History</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Margin breakdown across all currencies for this user
          </p>
        </div>
        {totalTxns > 0 && (
          <span className="self-start sm:self-auto text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            {totalTxns} transaction{totalTxns !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Per-currency summary blocks ──────────────────────────────────────── */}
      {summaryEntries.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {summaryEntries.map(([ccy, stats], idx) => (
            <CurrencyBlock key={ccy} currency={ccy} stats={stats} idx={idx} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 py-8 text-center text-sm text-gray-400">
          No summary data available
        </div>
      )}

      {/* ── Profit Records Table ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Profit ID", "Txn ID", "Txn Amount", "Profit", "Currency", "Date"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {profitsLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading profits…</span>
                    </div>
                  </td>
                </tr>
              ) : profits.length > 0 ? (
                profits.map((p) => {
                  const ccy = p.currency || p.transaction?.currency || "NGN";
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          …{String(p.id).slice(-10)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-gray-400">
                          …{String(p.transactionId || "—").slice(-10)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-gray-700">
                        {fmt(p.transaction?.amount, ccy)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-emerald-600">
                          +{fmt(p.amount, ccy)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          {ccy}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-400">
                        {new Date(p.createdAt || Date.now()).toLocaleString(undefined, {
                          year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-16">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-sm">No profit records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-xs text-gray-400">
          {profitsCount != null
            ? <>Page <strong className="text-gray-600">{profitsPage + 1}</strong> of{" "}
               <strong className="text-gray-600">{profitsPagesTotal ?? "?"}</strong>{" "}
               · {profitsCount} total records</>
            : `Page ${profitsPage + 1}`}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => setProfitsPage((p) => Math.max(0, p - 1))}
            disabled={profitsPage === 0}
            className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Prev
          </button>
          <button
            onClick={() => setProfitsPage((p) => p + 1)}
            disabled={profitsPagesTotal != null && profitsPage + 1 >= profitsPagesTotal}
            className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}