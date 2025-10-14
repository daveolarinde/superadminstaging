import { useState } from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Header({ onAllowNotifications, setIsAuthenticated }) {
  const [showBanner, setShowBanner] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleAllow = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        console.log("Notification permission:", perm);
        onAllowNotifications?.(perm);
      });
    }
  };

  const handleLogout = () => {
    // Always remove token
    localStorage.removeItem("token");

    // Call the prop if it exists
    if (typeof setIsAuthenticated === "function") {
      setIsAuthenticated(false);
    } else {
      console.warn("⚠️ setIsAuthenticated prop was not provided to <Header>");
    }

    // Navigate to login
    navigate("/admin");
  };

  return (
    <header className="w-full flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-white shadow">
      {/* Notification Banner */}
      {showBanner && (
        <div className="bg-red-50 py-5 text-red-600 p-3 rounded-md flex-1 flex flex-wrap items-center justify-between mb-4 md:mb-0">
          <span className="text-sm font-medium">
            Attention! Please allow your browser to get instant push notification.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAllow}
              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
            >
              Allow me
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-xl font-bold leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Profile + Bell */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative">
          <FaBell className="text-xl text-gray-600 hover:text-blue-600" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="flex items-center gap-2"
          >
            <FaUserCircle className="text-2xl text-gray-600 hover:text-blue-600" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 bg-white shadow rounded-md w-40">
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
