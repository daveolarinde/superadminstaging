import React, { useEffect, useState } from "react";
import axios from "axios";

export default function FeesManagement() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingFee, setEditingFee] = useState(null);

  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch all fees
  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/superAdmin/fees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      
        setFees(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching fees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [API_URL, token]);

  //  Handle update
  const handleUpdate = async (id) => {
    try {
      setLoading(true);
      const res = await axios.put(
        `${API_URL}/superAdmin/fees/${id}`,
        {
          amount: editingFee.amount,
          feeType: editingFee.feeType,
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

     
      setFees((prev) =>
        prev.map((fee) => (fee.id === id ? res.data.data : fee))
      );

      setEditingFee(null);
    } catch (err) {
      console.error("Error updating fee:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-gray-500 text-center py-6">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Fee Management</h2>
        <p className="text-sm text-gray-500">Manage system transaction & service fees</p>
      </div>

      {/* CARD WRAPPER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Fee Type</th>
                <th className="px-4 py-3 font-medium text-gray-600">Amount (₦)</th>
                <th className="px-4 py-3 font-medium text-gray-600">Percent (%)</th>
                <th className="px-4 py-3 font-medium text-gray-600">Maximum (₦)</th>
                <th className="px-4 py-3 font-medium text-gray-600">Minimum (₦)</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center text-gray-500 py-8 italic"
                  >
                    No fee data available
                  </td>
                </tr>
              ) : (
                fees.map((fee) => (
                  <tr
                    key={fee.id}
                    className="border-t hover:bg-gray-50 transition-all duration-150"
                  >
                    {editingFee?.id === fee.id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editingFee.feeType}
                            onChange={(e) =>
                              setEditingFee({
                                ...editingFee,
                                feeType: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editingFee.amount}
                            onChange={(e) =>
                              setEditingFee({
                                ...editingFee,
                                amount: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editingFee.percent}
                            onChange={(e) =>
                              setEditingFee({
                                ...editingFee,
                                percent: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editingFee.maximum}
                            onChange={(e) =>
                              setEditingFee({
                                ...editingFee,
                                maximum: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editingFee.minimum}
                            onChange={(e) =>
                              setEditingFee({
                                ...editingFee,
                                minimum: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
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
                        <td className="px-4 py-3 font-medium text-gray-800">{fee.feeType}</td>
                        <td className="px-4 py-3 text-gray-700">
                          ₦{Number(fee.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{fee.percent}%</td>
                        <td className="px-4 py-3 text-gray-700">
                          ₦{Number(fee.maximum).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          ₦{Number(fee.minimum).toLocaleString()}
                        </td>
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
        </div>
      </div>
    </div>
  );
}
