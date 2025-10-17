import { useState } from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Header({ onAllowNotifications, setIsAuthenticated }) {
  const [showBanner, setShowBanner] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  // ✅ Handle notification permission
  const handleAllow = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((perm) => {
        console.log("Notification permission:", perm);
        onAllowNotifications?.(perm);
      });
    }
  };

  // ✅ Handle logout
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");

      if (typeof setIsAuthenticated === "function") {
        setIsAuthenticated(false);
      } else {
        console.warn("⚠️ setIsAuthenticated prop not provided to <Header>");
      }

      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-6 relative">
        {/* 🔔 Notification Banner */}
        {showBanner && (
          <div className="w-full bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-4 py-3 mb-4 md:mb-0 animate-slideDown">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="text-sm leading-relaxed">
                ⚠️ <strong>Attention:</strong> Allow your browser to receive instant push
                notifications.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleAllow}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition w-full sm:w-auto"
                >
                  Allow Notifications
                </button>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold leading-none sm:ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🧑‍💼 Right Section (Notifications + User Menu) */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Bell Icon */}
          <button
            type="button"
            className="relative p-2 hover:bg-gray-50 rounded-full transition"
          >
            <FaBell className="text-[1.3rem] text-gray-600 hover:text-blue-600 transition" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-50 transition"
            >
              <FaUserCircle className="text-2xl text-gray-600 hover:text-blue-600 transition" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg border border-gray-100 rounded-lg w-44 py-1 z-50 animate-fadeIn">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✨ Animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </header>
  );
}
