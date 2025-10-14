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

        // ✅ The API gives data as { NGN: 1000, USD: 0 }
        const balancesObj = res.data.data || {};
        const walletsArr = Object.keys(balancesObj).map((key) => ({
          currency: key,
          totalBalance: balancesObj[key],
        }));

        // ✅ The API gives rates as { data: { NGN: 1600, USD: 1 }, ... }
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
    <div className="bg-white rounded-xl shadow p-3 sm:p-5 w-full overflow-x-auto">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
        Wallet Currency
      </h2>

      <table className="min-w-full text-[12px] sm:text-sm text-left border-collapse">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-2 sm:px-4 py-2 font-medium text-gray-600">SL</th>
            <th className="px-2 sm:px-4 py-2 font-medium text-gray-600">CURRENCY</th>
            <th className="px-2 sm:px-4 py-2 font-medium text-gray-600">
              USER WALLET AMOUNT
            </th>
            <th className="px-2 sm:px-4 py-2 font-medium text-gray-600">
              CURRENCY RATE
            </th>
            <th className="px-2 sm:px-4 py-2 font-medium text-gray-600">STATUS</th>
            <th className="px-2 sm:px-4 py-2 font-medium text-gray-600">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((item, idx) => {
            const rateValue = rates[item.currency] || 1;

            return (
              <tr key={item.currency} className="border-b last:border-0">
                <td className="px-2 sm:px-4 py-2">{idx + 1}</td>
                <td className="px-2 sm:px-4 py-2 flex items-center gap-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden bg-gray-200">
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
                <td className="px-2 sm:px-4 py-2 font-semibold">
                  {parseFloat(item.totalBalance).toLocaleString()} {item.currency}
                </td>
                <td className="px-2 sm:px-4 py-2 text-gray-700">
                  1 USD = {rateValue.toLocaleString()} {item.currency}
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <span className="px-2 sm:px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    Active
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded-lg text-gray-700 hover:bg-gray-100 transition">
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
