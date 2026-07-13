import { useEffect, useState } from "react";
import axios from "axios";
import { Landmark, Globe2, XCircle, Users } from "lucide-react";

const Spinner = ({ sm }) => (
  <svg className={`animate-spin ${sm ? "w-3.5 h-3.5" : "w-4 h-4"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const SOURCE_META = {
  wewire: { label: "International (WeWire)", icon: Globe2,   tone: "text-indigo-600 bg-indigo-50" },
  ngn:    { label: "Local (NGN)",             icon: Landmark, tone: "text-emerald-600 bg-emerald-50" },
};

export default function BeneficiariesTab({ userId, baseURL, authHeader }) {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [data,    setData]    = useState({});
  const [source,  setSource]  = useState("all");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const fetchBeneficiaries = async () => {
      setLoading(true);
      setError("");
      try {
        const params = { userId };
        if (source !== "all") params.source = source;

        const res = await axios.get(`${baseURL}/superAdmin/beneficiaries`, {
          headers: authHeader,
          params,
        });
        if (!cancelled) setData(res.data?.data || {});
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message ?? "Failed to fetch beneficiaries.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBeneficiaries();
    return () => { cancelled = true; };
  }, [userId, source, baseURL, authHeader]);

  const sources = Object.keys(data); // e.g. ["wewire", "ngn"]
  const totalCount = sources.reduce((sum, s) => sum + (data[s]?.total || 0), 0);

  const filterOptions = [
    { value: "all",    label: "All Sources" },
    { value: "wewire", label: "International (WeWire)" },
    { value: "ngn",    label: "Local (NGN)" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Beneficiaries</h3>
          <p className="text-xs text-gray-400 mt-0.5">Saved transfer recipients for this user</p>
        </div>

        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 w-fit">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSource(opt.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                source === opt.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Spinner /> Loading beneficiaries…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Users size={20} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-400">No beneficiaries found for this user.</p>
        </div>
      )}

      {!loading && !error && totalCount > 0 && (
        <div className="space-y-8">
          {sources.map((src) => {
            const meta = SOURCE_META[src] || { label: src, icon: Users, tone: "text-gray-600 bg-gray-50" };
            const Icon = meta.icon;
            const rows = data[src]?.data || [];
            if (rows.length === 0) return null;

            return (
              <div key={src}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.tone}`}>
                    <Icon size={14} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">{meta.label}</h4>
                  <span className="text-xs text-gray-400 font-mono">({data[src]?.total ?? rows.length})</span>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Account No.</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Bank</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Currency</th>
                        {src === "wewire" && (
                          <>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Country</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Method</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{b.name}</td>
                          <td className="px-5 py-3.5 text-sm font-mono text-gray-500">{b.accountNumber}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-700">{b.bankName}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                              {b.currency}
                            </span>
                          </td>
                          {src === "wewire" && (
                            <>
                              <td className="px-5 py-3.5 text-sm text-gray-700">{b.bankCountry}</td>
                              <td className="px-5 py-3.5 text-sm text-gray-500">{b.settlementMethod}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}