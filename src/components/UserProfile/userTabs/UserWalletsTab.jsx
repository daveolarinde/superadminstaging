import React from "react";

export default function UserWalletsTab({ accounts = [] }) {
  if (!accounts.length)
    return (
      <div className="text-gray-500 text-center py-6">
        No wallets found for this user.
      </div>
    );

  return (
    <div className="bg-white border border-gray-100 rounded-lg overflow-x-auto">
      <table className="min-w-full text-sm text-gray-700">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100">
          <tr>
            <th className="px-6 py-3 text-left">No.</th>
            <th className="px-6 py-3 text-left">Currency</th>
            <th className="px-6 py-3 text-left">Balance</th>
            <th className="px-6 py-3 text-left">Created At</th>
            <th className="px-6 py-3 text-left">Updated At</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((wallet, index) => (
            <tr
              key={wallet.id || index}
              className="border-b border-gray-100 hover:bg-gray-50 transition"
            >
              <td className="px-6 py-3">{index + 1}</td>
              <td className="px-6 py-3 font-medium">{wallet.currency}</td>
              <td className="px-6 py-3 text-gray-800 font-semibold">
                {parseFloat(wallet.balance).toLocaleString()}{" "}
                {wallet.currency}
              </td>
              <td className="px-6 py-3 text-gray-500">
                {new Date(wallet.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-3 text-gray-500">
                {new Date(wallet.updatedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
