import { useState, useEffect } from "react";
import axios from "axios";
import { X, Upload, FileText, Eye } from "lucide-react";

// ── Lightbox for previewing uploaded files ────────────────────────────────────
const DocumentPreview = ({ file, onClose }) => {
  const url = URL.createObjectURL(file);
  const isPdf = file.type === "application/pdf";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
          <button
            onClick={() => { URL.revokeObjectURL(url); onClose(); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
          {isPdf ? (
            <iframe src={url} title="preview" className="w-full h-[70vh] rounded-lg border" />
          ) : (
            <img src={url} alt="preview" className="max-w-full max-h-[70vh] rounded-lg object-contain shadow" />
          )}
        </div>
      </div>
    </div>
  );
};

// ── File drop zone ────────────────────────────────────────────────────────────
const FileDropZone = ({ label, file, onChange }) => {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  return (
    <>
      {preview && file && (
        <DocumentPreview file={file} onClose={() => setPreview(false)} />
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer
          ${dragging
            ? "border-blue-400 bg-blue-50"
            : file
            ? "border-green-300 bg-green-50"
            : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
          }`}
      >
        <label className="cursor-pointer block">
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => onChange(e.target.files[0] || null)}
          />

          {file ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setPreview(true); }}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-blue-600 hover:bg-blue-50 transition shadow-sm"
              >
                <Eye size={12} /> View
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload size={18} className="text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">Drag & drop or click to browse · PNG, JPG, PDF</p>
              </div>
            </div>
          )}
        </label>
      </div>
    </>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────
const KycUpdateModal = ({ user, isOpen, onClose, baseURL, token, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Address
  const [street, setStreet]       = useState("");
  const [city, setCity]           = useState("");
  const [stateVal, setStateVal]   = useState("");
  const [postalCode, setPostal]   = useState("");
  const [country, setCountry]     = useState("");

  // Background
  const [occupation, setOccupation] = useState("");

  // Files
  const [identityDocument, setIdentityDocument] = useState(null);
  const [utilityBill, setUtilityBill]           = useState(null);

  useEffect(() => {
    if (user?.address) {
      setStreet(user.address.street || "");
      setCity(user.address.city || "");
      setStateVal(user.address.state || "");
      setPostal(user.address.postal_code || "");
      setCountry(user.address.country || "");
    }
    if (user?.background_information) {
      setOccupation(user.background_information.occupation || "");
    }
    setError(null);
    setIdentityDocument(null);
    setUtilityBill(null);
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("address", JSON.stringify({ street, city, state: stateVal, postal_code: postalCode, country }));
      formData.append("background_information", JSON.stringify({ occupation }));
      if (identityDocument) formData.append("document", identityDocument);
      if (utilityBill)      formData.append("utility_bill", utilityBill);

      const res = await axios.put(
        `${baseURL}/superAdmin/users/${user.id}/kyc`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        onSuccess?.();
        onClose();
      } else {
        setError("Update failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white transition";
  const labelCls = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Update KYC</h2>
            <p className="text-xs text-gray-400 mt-0.5">{user.firstname} {user.lastname}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              ❌ {error}
            </div>
          )}

          {/* Address */}
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Address Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Street</label>
                <input className={inputCls} placeholder="123 Main St" value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input className={inputCls} placeholder="Lagos" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input className={inputCls} placeholder="Lagos State" value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Postal Code</label>
                <input className={inputCls} placeholder="100001" value={postalCode} onChange={(e) => setPostal(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input className={inputCls} placeholder="Nigeria" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Background */}
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Background Information</p>
            <label className={labelCls}>Occupation</label>
            <input className={inputCls} placeholder="e.g. Software Engineer" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
          </section>

          {/* Documents */}
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Documents</p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              ⚠️ Uploading a new file will permanently replace the existing one.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Identity Document</label>
                <FileDropZone
                  label="Upload Identity Document"
                  file={identityDocument}
                  onChange={setIdentityDocument}
                />
              </div>
              <div>
                <label className={labelCls}>Utility Bill</label>
                <FileDropZone
                  label="Upload Utility Bill"
                  file={utilityBill}
                  onChange={setUtilityBill}
                />
              </div>
            </div>
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? "Updating…" : "Update KYC"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KycUpdateModal;