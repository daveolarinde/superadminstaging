// components/KycSummaryCards.jsx
const KycSummaryCards = ({ summary }) => {
  const cards = [
    { title: "TOTAL KYC",      value: summary.total    },
    { title: "PENDING KYC",    value: summary.pending   },
    { title: "SUCCESSFUL KYC", value: summary.success   },
    { title: "APPROVED KYC",   value: summary.approved  },
    { title: "FAILED KYC",     value: summary.failed    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white shadow-sm rounded-xl p-5 border border-gray-100"
        >
          <h3 className="text-xs font-semibold text-gray-400 uppercase">
            {card.title}
          </h3>
          <div className="flex items-end justify-between mt-3">
            <p className="text-4xl font-bold">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KycSummaryCards;