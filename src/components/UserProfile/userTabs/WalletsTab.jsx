import React from "react";

const CURRENCY_COLORS = {
  NGN: "from-green-400 to-emerald-600",
  USD: "from-blue-400 to-blue-600",
  GBP: "from-purple-400 to-purple-600",
  EUR: "from-orange-400 to-amber-600",
};

export default function WalletsTab({ user }) {
  const accounts = user.accounts || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-800">Wallets</h3>
        <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium border border-blue-100">
          {accounts.length} {accounts.length === 1 ? "wallet" : "wallets"}
        </span>
      </div>

      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const gradient = CURRENCY_COLORS[acc.currency] || "from-gray-400 to-gray-600";
            return (
              <div
                key={acc.id}
                className="relative overflow-hidden rounded-2xl shadow-sm border border-gray-100"
              >
                {/* Card top */}
                <div className={`bg-gradient-to-br ${gradient} p-5 text-white`}>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
                      {acc.currency}
                    </span>
                    <span className="text-xs opacity-70 bg-white/20 px-2 py-0.5 rounded-full">
                      {acc.type || "Wallet"}
                    </span>
                  </div>
                  <div className="text-2xl font-bold tracking-tight">
                    {Number(acc.balance || 0).toLocaleString()}
                  </div>
                  <div className="text-xs opacity-70 mt-1">Available Balance</div>
                </div>

                {/* Card bottom */}
                <div className="bg-white px-5 py-3 flex items-center justify-between text-xs text-gray-400">
                  <span>ID: {String(acc.id).slice(-8)}</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full ${
                      acc.status === "active"
                        ? "bg-green-50 text-green-600"
                        : "bg-yellow-50 text-yellow-600"
                    }`}
                  >
                    {acc.status || "active"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">💳</div>
          <div className="text-gray-500 text-sm">No wallets available</div>
        </div>
      )}
    </div>
  );
}