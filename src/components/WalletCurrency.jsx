import { useEffect, useState } from "react";
import axios from "axios";

export default function WalletCurrency() {
  const [wallets, setWallets] = useState([]);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/superAdmin/get-accountBalance-summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("📦 Wallet response:", res.data);

        const balancesObj = res.data.data || {};
        const walletsArr = Object.keys(balancesObj).map((key) => ({
          currency: key,
          totalBalance: balancesObj[key],
        }));

        const ratesObj = res.data.rates?.data || {};

        setWallets(walletsArr);
        setRates(ratesObj);
      } catch (err) {
        console.error("❌ Failed to fetch wallet data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWallets();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40 text-gray-500">
        Loading wallet balances...
      </div>
    );

  return (
    <div className="bg-white rounded-xl shadow p-5 sm:p-6 w-full overflow-x-auto">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
        Wallet Currency
      </h2>

      <table className="min-w-full text-sm text-left border-collapse border-none">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 font-medium text-gray-600">SL</th>
            <th className="px-6 py-4 font-medium text-gray-600">CURRENCY</th>
            <th className="px-6 py-4 font-medium text-gray-600">
              USER WALLET AMOUNT
            </th>
            <th className="px-6 py-4 font-medium text-gray-600">
              CURRENCY RATE
            </th>
            <th className="px-6 py-4 font-medium text-gray-600">STATUS</th>
            <th className="px-6 py-4 font-medium text-gray-600">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((item, idx) => {
            const rateValue = rates[item.currency] || 1;

            return (
              <tr
                key={item.currency}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">{idx + 1}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={`https://flagcdn.com/24x18/${item.currency
                        .slice(0, 2)
                        .toLowerCase()}.png`}
                      alt={item.currency}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </span>
                  {item.currency}
                </td>
                <td className="px-6 py-4 font-semibold">
                  {parseFloat(item.totalBalance).toLocaleString()}{" "}
                  {item.currency}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  1 USD = {rateValue.toLocaleString()} {item.currency}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="px-3 py-1 text-xs sm:text-sm rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition">
                    👁 View Transaction
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
