// components/UserSummaryCards.jsx
import { Users, UserCheck, UserMinus, UserX, CalendarPlus } from "lucide-react";

const cards = (summary) => [
  { label: "Total Users",       value: summary?.totalUsers      ?? 0, icon: <Users size={17} />,       bgColor: "bg-indigo-50",  textColor: "text-indigo-600"  },
  { label: "Active Users",      value: summary?.activeUsers     ?? 0, icon: <UserCheck size={17} />,   bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
  { label: "Inactive Users",    value: summary?.inactiveUsers   ?? 0, icon: <UserMinus size={17} />,   bgColor: "bg-amber-50",   textColor: "text-amber-600"   },
  { label: "Joined Today",      value: summary?.todayJoined     ?? 0, icon: <CalendarPlus size={17} />,bgColor: "bg-blue-50",    textColor: "text-blue-600"    },
  { label: "Deactivated Users", value: summary?.deactivatedUsers?? 0, icon: <UserX size={17} />,       bgColor: "bg-red-50",     textColor: "text-red-500"     },
];

const UserSummaryCards = ({ summary }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
    {cards(summary).map((card) => (
      <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.bgColor}`}>
          <span className={card.textColor}>{card.icon}</span>
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
        <p className="text-3xl font-bold text-gray-900">{(card.value).toLocaleString()}</p>
      </div>
    ))}
  </div>
);

export default UserSummaryCards;