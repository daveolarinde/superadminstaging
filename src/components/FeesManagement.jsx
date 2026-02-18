import React, { useEffect, useState } from "react";
import axios from "axios";

export default function FeesManagement() {
  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_URL;

  const ITEMS_PER_PAGE = 10;

  const [loading, setLoading] = useState(false);
  const [editingFee, setEditingFee] = useState(null);

  const [generalFees, setGeneralFees] = useState([]);
  const [conversionFees, setConversionFees] = useState([]);

  const [generalPage, setGeneralPage] = useState(1);
  const [conversionPage, setConversionPage] = useState(1);

  const [generalTotal, setGeneralTotal] = useState(0);
  const [conversionTotal, setConversionTotal] = useState(0);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/superAdmin/fees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allFees = res.data?.data || [];
      const general = allFees.filter(f => f.type !== "conversion");
      const conversion = allFees.filter(f => f.type === "conversion");

      setGeneralFees(general);
      setConversionFees(conversion);
      setGeneralTotal(general.length);
      setConversionTotal(conversion.length);
    } catch (err) {
      console.error("Error fetching fees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleUpdate = async (id) => {
    try {
      setLoading(true);
      const res = await axios.put(
        `${API_URL}/superAdmin/fees/${id}`,
        {
          feeType: editingFee.feeType,
          amount: editingFee.amount,
          percent: editingFee.percent,
          maximum: editingFee.maximum,
          minimum: editingFee.minimum,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setGeneralFees(prev => prev.map(f => f.id === id ? res.data.data : f));
      setConversionFees(prev => prev.map(f => f.id === id ? res.data.data : f));
      setEditingFee(null);
    } catch (err) {
      console.error("Error updating fee:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="text-gray-500 text-center py-6">Loading...</p>;

  const displayedGeneralFees = generalFees.slice(
    (generalPage - 1) * ITEMS_PER_PAGE,
    generalPage * ITEMS_PER_PAGE
  );

  const displayedConversionFees = conversionFees.slice(
    (conversionPage - 1) * ITEMS_PER_PAGE,
    conversionPage * ITEMS_PER_PAGE
  );

  // Helper function to format amount with correct currency
  // Set of general fee names that are in USD
const USD_GENERAL_FEES = new Set([
  "deposit_usd_fee",
  "transfer_usd_fee"
]);

const formatAmount = (fee) => {
  if (!fee.amount) return "—";
  const amt = Number(fee.amount).toLocaleString();

  // Conversion fees: currency is the "from" currency in the name
  if (fee.type === "conversion") {
    const fromCurrency = fee.name.split("_")[0]; 
    return fromCurrency.toLowerCase() === "usd" ? `$${amt}` : `₦${amt}`;
  }

  // General fees: check predefined USD set
  if (USD_GENERAL_FEES.has(fee.name.toLowerCase())) {
    return `$${amt}`;
  }

  // Default NGN
  return `₦${amt}`;
};


  return (
    <div className="p-6 space-y-10">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Fee Management</h2>
        <p className="text-sm text-gray-500">
          Manage system transaction & service fees
        </p>
      </div>

      {/* GENERAL FEES */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">General Fees</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <table className="min-w-full text-sm text-left border-collapse border-none">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-600">Type</th>
                <th className="px-6 py-4 font-medium text-gray-600">Name</th>
                <th className="px-6 py-4 font-medium text-gray-600">Where</th>
                <th className="px-6 py-4 font-medium text-gray-600">Fee Type</th>
                <th className="px-6 py-4 font-medium text-gray-600">Amount</th>
                <th className="px-6 py-4 font-medium text-gray-600">Percent (%)</th>
                <th className="px-6 py-4 font-medium text-gray-600">Maximum</th>
                <th className="px-6 py-4 font-medium text-gray-600">Minimum</th>
                <th className="px-6 py-4 font-medium text-gray-600 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedGeneralFees.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-gray-500 py-8 italic">
                    No general fee data available
                  </td>
                </tr>
              ) : (
                displayedGeneralFees.map(fee => (
                  <tr key={fee.id} className="hover:bg-gray-50 transition">
                    {editingFee?.id === fee.id ? (
                      <>
                        <td className="px-6 py-4">{fee.type}</td>
                        <td className="px-6 py-4">{fee.name}</td>
                        <td className="px-6 py-4">{fee.where}</td>

                        {/* Editable Fee Type */}
                        <td className="px-6 py-4">
                          <select
                            value={editingFee.feeType}
                            onChange={e =>
                              setEditingFee({ ...editingFee, feeType: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          >
                            <option value="flat">Flat</option>
                            <option value="percent">Percent</option>
                          </select>
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editingFee.amount}
                            onChange={e =>
                              setEditingFee({ ...editingFee, amount: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editingFee.percent}
                            onChange={e =>
                              setEditingFee({ ...editingFee, percent: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editingFee.maximum}
                            onChange={e =>
                              setEditingFee({ ...editingFee, maximum: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editingFee.minimum}
                            onChange={e =>
                              setEditingFee({ ...editingFee, minimum: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleUpdate(fee.id)}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFee(null)}
                            className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">{fee.type}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{fee.name}</td>
                        <td className="px-4 py-3 text-gray-700">{fee.where}</td>
                        <td className="px-4 py-3 text-gray-700 capitalize">{fee.feeType}</td>
                        <td className="px-4 py-3 text-gray-700">{formatAmount(fee)}</td>
                        <td className="px-4 py-3 text-gray-700">{fee.percent}%</td>
                        <td className="px-4 py-3 text-gray-700">{formatAmount({ ...fee, amount: fee.maximum })}</td>
                        <td className="px-4 py-3 text-gray-700">{formatAmount({ ...fee, amount: fee.minimum })}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setEditingFee(fee)}
                            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between mt-4">
            <button disabled={generalPage === 1} onClick={() => setGeneralPage(g => g - 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Previous</button>
            <p className="text-sm text-gray-600">Page {generalPage} of {Math.ceil(generalTotal / ITEMS_PER_PAGE)}</p>
            <button disabled={generalPage === Math.ceil(generalTotal / ITEMS_PER_PAGE)} onClick={() => setGeneralPage(g => g + 1)} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* CONVERSION FEES */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Conversion Fees</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
          <table className="min-w-full text-sm text-left border-collapse border-none">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-600">Name</th>
                <th className="px-6 py-4 font-medium text-gray-600">Where</th>
                <th className="px-6 py-4 font-medium text-gray-600">Fee Type</th>
                <th className="px-6 py-4 font-medium text-gray-600">Amount</th>
                <th className="px-6 py-4 font-medium text-gray-600">Percent (%)</th>
                <th className="px-6 py-4 font-medium text-gray-600">Maximum</th>
                <th className="px-6 py-4 font-medium text-gray-600">Minimum</th>
                <th className="px-6 py-4 font-medium text-gray-600 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedConversionFees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-gray-500 py-8 italic">
                    No conversion fee data available
                  </td>
                </tr>
              ) : (
                displayedConversionFees.map(fee => (
                  <tr key={fee.id} className="hover:bg-gray-50 transition">
                    {editingFee?.id === fee.id ? (
                      <>
                        <td className="px-6 py-4">{fee.name}</td>
                        <td className="px-6 py-4">{fee.where}</td>
                        <td className="px-6 py-4">
                          <select
                            value={editingFee.feeType}
                            onChange={e =>
                              setEditingFee({ ...editingFee, feeType: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          >
                            <option value="flat">Flat</option>
                            <option value="percent">Percent</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editingFee.amount || ""}
                            onChange={e =>
                              setEditingFee({ ...editingFee, amount: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                            placeholder="Flat amount"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editingFee.percent || ""}
                            onChange={e =>
                              setEditingFee({ ...editingFee, percent: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                            placeholder="% fee"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editingFee.maximum}
                            onChange={e =>
                              setEditingFee({ ...editingFee, maximum: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editingFee.minimum}
                            onChange={e =>
                              setEditingFee({ ...editingFee, minimum: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleUpdate(fee.id)}
                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFee(null)}
                            className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">{fee.name}</td>
                        <td className="px-6 py-4 text-gray-700">{fee.where}</td>
                        <td className="px-6 py-4 capitalize">{fee.feeType}</td>
                        <td className="px-6 py-4">{formatAmount(fee)}</td>
                        <td className="px-6 py-4">{fee.percent || "—"}%</td>
                        <td className="px-6 py-4">{formatAmount({ ...fee, amount: fee.maximum })}</td>
                        <td className="px-6 py-4">{formatAmount({ ...fee, amount: fee.minimum })}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setEditingFee(fee)}
                            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between mt-4">
            <button
              disabled={conversionPage === 1}
              onClick={() => setConversionPage(g => g - 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>

            <p className="text-sm text-gray-600">
              Page {conversionPage} of {Math.ceil(conversionTotal / ITEMS_PER_PAGE)}
            </p>

            <button
              disabled={conversionPage === Math.ceil(conversionTotal / ITEMS_PER_PAGE)}
              onClick={() => setConversionPage(g => g + 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
