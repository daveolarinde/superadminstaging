import { useEffect, useState } from "react";
import axios from "axios";

export default function BalancesWithRates() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_STAGE_API_URL}/superAdmin/balances-with-rates`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

       

       
        if (
          res.data &&
          res.data.status === "success" &&
          Array.isArray(res.data.data?.totals)
        ) {
          setBalances(res.data.data.totals);
        } else {
          console.error("⚠️ Unexpected API format:", res.data);
          setBalances([]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch balances:", err);
        setBalances([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40 text-gray-500">
        Loading balances...
      </div>
    );

  return (
    <div className="bg-white rounded-xl shadow p-5 sm:p-6 w-full overflow-x-auto">
      <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
        Balances with Rates
      </h2>

      <table className="min-w-full text-sm text-left border-collapse border-none">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 font-medium text-gray-600">SL</th>
            <th className="px-6 py-4 font-medium text-gray-600">CURRENCY</th>
            <th className="px-6 py-4 font-medium text-gray-600">
              TOTAL BALANCE
            </th>
            <th className="px-6 py-4 font-medium text-gray-600">
              CURRENCY RATE
            </th>
            <th className="px-6 py-4 font-medium text-gray-600">STATUS</th>
            <th className="px-6 py-4 font-medium text-gray-600">ACTION</th>
          </tr>
        </thead>

        <tbody>
          {balances.map((item, idx) => {
            const hasRate = item?.rate !== null && item?.rate !== undefined;

            return (
              <tr key={item.currency} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">{idx + 1}</td>

                <td className="px-6 py-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
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
                  {hasRate
                    ? `1 USD = ${item.rate.toLocaleString()} ${item.currency}`
                    : "N/A"}
                </td>

                <td className="px-6 py-4">
                  <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    Active
                  </span>
                </td>

                <td className="px-6 py-4">
                  <button className="px-3 py-1 text-xs sm:text-sm rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition">
                    👁 View Details
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
