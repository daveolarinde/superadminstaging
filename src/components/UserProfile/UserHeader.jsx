import React from "react";
import { FiArrowLeft } from "react-icons/fi";

export default function UserHeader({ user, onClose }) {
  return (
    <div className="relative bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-6 flex flex-col items-center text-center">
        <button
          onClick={onClose}
          className="absolute left-4 top-4 flex items-center gap-1 text-gray-600 hover:text-blue-600"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <img
          src="https://ui-avatars.com/api/?name=${user.firstname}+${user.lastname}&background=random"
          alt="User Avatar"
          className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
        />

        <h2 className="text-2xl font-semibold mt-4 text-gray-800">
          {user.firstname} {user.lastname}
        </h2>
        <p className="text-gray-500 text-sm">{user.email}</p>

        <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm">
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
            {user.status?.toUpperCase()}
          </span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
            {user.country}
          </span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>

        <button className="mt-5 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Edit Profile
        </button>
      </div>
    </div>
  );
}
