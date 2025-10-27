import { useState, useEffect } from "react";
import { FiArrowLeft, FiEdit2 } from "react-icons/fi";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function UserProfileView({ onClose }) {
  const { userId } = useParams(); // 👈 read the userId from the URL
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
      
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
       

        if (!token) {
          setError("Missing authentication token");
          setUser(null);
          return;
        }

        // Optional: if your API supports /users/:id, use this instead for performance
        // const res = await axios.get(`${API_BASE_URL}/superAdmin/users/${userId}`, {
        //   headers: { Authorization: `Bearer ${token}` },
        // });

        const res = await axios.get(`${API_BASE_URL}/superAdmin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

       

        const allUsers = Array.isArray(res.data?.data) ? res.data.data : [];
        console.log("👥 Total users fetched:", allUsers.length);

        const foundUser = allUsers.find((u) =>
          [u?.id, u?._id, u?.userId].some(
            (v) => String(v).trim() === String(userId).trim()
          )
        );

        if (!foundUser) {
          console.warn("⚠️ User not found for ID:", userId);
          setError("User not found");
          setUser(null);
        } else {
          
          setUser(foundUser);
        }
      } catch (err) {
        console.error("💥 Fetch error:", err);
        setError("Failed to fetch user data");
        setUser(null);
      } finally {
        setLoading(false);
        
      }
    };

    if (!userId) {
    
      setLoading(false);
      setError("");
      setUser(null);
      return;
    }

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-gray-500">
        Loading user data...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-gray-500">
        <p>{error || "User not found"}</p>
        <button
          onClick={onClose || (() => navigate(-1))}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  const nairaAccount = user?.accounts?.find((acc) => acc?.currency === "NGN");
  const usdAccount = user?.accounts?.find((acc) => acc?.currency === "USD");

  const nairaBalance = parseFloat(nairaAccount?.balance || 0);
  const usdBalance = parseFloat(usdAccount?.balance || 0);

  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose || (() => navigate(-1))}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
          >
            <FiArrowLeft size={18} />
            Back
          </button>
          <h2 className="text-lg font-semibold text-gray-800">User Profile</h2>
        </div>

        <button className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-md text-sm font-medium">
          <FiEdit2 size={16} />
          Edit Profile
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
            {user?.firstname?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {user?.firstname} {user?.lastname}
            </h3>
            <p className="text-sm text-gray-500">
              @{user?.tag || `${user?.firstname?.toLowerCase() || "user"}`}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <p className="text-xs text-gray-400">Country</p>
            <p className="font-medium text-gray-700">{user?.country || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Phone Number</p>
            <p className="font-medium text-gray-700">{user?.phoneNumber || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Status</p>
            <p
              className={`font-medium ${
                user?.status === "active"
                  ? "text-green-600"
                  : user?.status === "blocked"
                  ? "text-red-500"
                  : "text-yellow-500"
              }`}
            >
              {user?.status || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h4 className="text-gray-500 text-sm mb-2">Account Balance (₦)</h4>
          <p className="text-2xl font-semibold text-gray-800">
            ₦{nairaBalance.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
          <h4 className="text-gray-500 text-sm mb-2">Account Balance ($)</h4>
          <p className="text-2xl font-semibold text-gray-800">
            ${usdBalance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <h4 className="text-gray-700 font-semibold mb-3">Linked Cards</h4>
        {user?.cards?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.cards.map((card) => (
              <div
                key={card.id}
                className="border border-gray-100 rounded-xl p-4 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-700">
                  {card.brand?.toUpperCase() || "CARD"} •••• {card.last_four || "----"}
                </p>
                <p className="text-xs text-gray-500">
                  Exp: {card.expiry || "N/A"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Balance: {card.currency} {card.balance || "0.00"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No linked cards</p>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <h4 className="text-gray-700 font-semibold mb-3">KYC Records</h4>
        {user?.kycRecords?.length > 0 ? (
          <ul className="space-y-3">
            {user.kycRecords.map((record) => (
              <li key={record.id} className="text-sm text-gray-600">
                <strong>{record.type?.toUpperCase()}</strong> —{" "}
                {record.status?.toUpperCase() || "UNKNOWN"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No KYC records found</p>
        )}
      </div>
    </div>
  );
}
