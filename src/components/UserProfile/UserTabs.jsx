import React from "react";

const tabs = [
  "Profile",
  "Wallets",
  "Transactions",
  "Profit History",
  "KYC Verification",
];

export default function UserTabs({ activeTab, setActiveTab }) {
  return (
    <div className="border-b bg-white sticky top-0 z-20">
      <div className="max-w-6xl mx-auto flex flex-wrap gap-6 px-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 border-b-2 text-sm font-medium transition ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
