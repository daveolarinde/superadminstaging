// components/UsersTable.jsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  MoreVertical, ExternalLink, ChevronLeft, ChevronRight,
  Mail, X, Send, ChevronDown, Users,
  Bold, Italic, Underline, Link, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Minus, Undo, Redo,Wallet,Bell,
  ShieldAlert,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import LinkExt from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

const API_URL = import.meta.env.VITE_STAGE_API_URL;

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    active:      { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
    inactive:    { cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400"   },
    blocked:     { cls: "bg-red-50 text-red-600 ring-1 ring-red-200",             dot: "bg-red-500"     },
    deactivated: { cls: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",         dot: "bg-gray-400"    },
    deactivate:  { cls: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",         dot: "bg-gray-400"    },
  };
  const s     = String(status || "").toLowerCase();
  const style = map[s] || { cls: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {s || "N/A"}
    </span>
  );
};

// ── Page number generator ─────────────────────────────────────────────────────
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

// ── Audience options ──────────────────────────────────────────────────────────
const AUDIENCE_OPTIONS = [
  { value: "all",      label: "All Users",      description: "Every registered user",       dot: "bg-blue-500"    },
  { value: "active",   label: "Active Users",   description: "Currently active accounts",   dot: "bg-emerald-500" },
  { value: "inactive", label: "Inactive Users", description: "Dormant or unverified users", dot: "bg-amber-400"   },
];

// ── KYC type options ──────────────────────────────────────────────────────────
const KYC_TYPE_OPTIONS = [
  { value: "identity", label: "Identity Document",  description: "e.g. Passport, National ID, Driver's license" },
  { value: "utility",  label: "Utility Document",   description: "e.g. Utility bill, Bank statement"            },
];

// ── Toolbar button helper ─────────────────────────────────────────────────────
const ToolbarBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    disabled={disabled}
    title={title}
    className={`w-7 h-7 flex items-center justify-center rounded-md text-xs transition
      ${active
        ? "bg-blue-100 text-blue-700"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}
      disabled:opacity-30 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-4 bg-gray-200 mx-0.5 self-center" />
);

// ── Rich Text Editor ──────────────────────────────────────────────────────────
const RichEditor = ({ onChange }) => {
  const [linkUrl,  setLinkUrl]  = useState("");
  const [showLink, setShowLink] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      UnderlineExt,
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[180px] max-h-[280px] overflow-y-auto outline-none px-3.5 py-3 text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none",
      },
    },
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
  });

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl.trim()) {
      const href = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().setLink({ href }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkUrl("");
    setShowLink(false);
  }, [editor, linkUrl]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50/80">
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={13} /></ToolbarBtn>
        <ToolbarDivider />
        <select
          title="Text style"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().setHeading({ level: Number(val) }).run();
          }}
          value={
            editor.isActive("heading", { level: 1 }) ? "1" :
            editor.isActive("heading", { level: 2 }) ? "2" :
            editor.isActive("heading", { level: 3 }) ? "3" : "p"
          }
          className="text-xs text-gray-600 border border-gray-200 rounded-md px-1.5 py-1 bg-white focus:outline-none focus:border-blue-400 cursor-pointer h-7"
        >
          <option value="p">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
        <ToolbarDivider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()}      active={editor.isActive("bold")}      title="Bold"><Bold size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()}    active={editor.isActive("italic")}    title="Italic"><Italic size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><Underline size={13} /></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive("bulletList")}  title="Bullet list"><List size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list"><ListOrdered size={13} /></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()}   active={editor.isActive({ textAlign: "left" })}   title="Align left"><AlignLeft size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center"><AlignCenter size={13} /></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()}  active={editor.isActive({ textAlign: "right" })}  title="Align right"><AlignRight size={13} /></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule"><Minus size={13} /></ToolbarBtn>
        <ToolbarDivider />
        <ToolbarBtn onClick={() => setShowLink(v => !v)} active={editor.isActive("link") || showLink} title="Insert link"><Link size={13} /></ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link"><X size={11} /></ToolbarBtn>
        )}
      </div>

      {showLink && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100">
          <input
            autoFocus
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyLink(); if (e.key === "Escape") setShowLink(false); }}
            placeholder="https://example.com"
            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white focus:outline-none focus:border-blue-400 text-gray-700 placeholder-gray-400"
          />
          <button type="button" onClick={applyLink} className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Apply</button>
          <button type="button" onClick={() => setShowLink(false)} className="text-gray-400 hover:text-gray-600 transition"><X size={13} /></button>
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="px-3.5 py-1.5 border-t border-gray-100 bg-gray-50/60">
        <p className="text-[10px] text-gray-400">
          Rich text — outputs clean HTML · <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Ctrl+B</kbd> bold ·
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] ml-1">Ctrl+I</kbd> italic ·
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] ml-1">Ctrl+U</kbd> underline
        </p>
      </div>
    </div>
  );
};

// ── Reset KYC Modal ───────────────────────────────────────────────────────────
const ResetKycModal = ({ user, onClose }) => {
  const [kycType,  setKycType]  = useState("identity");
  const [reason,   setReason]   = useState("");
  const [resetting, setResetting] = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);

  const handleReset = async () => {
    if (!reason.trim()) return setError("Please provide a reason for the KYC reset.");
    setError(null);
    setResetting(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/superAdmin/users/${user.id}/reset-kyc`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body:    JSON.stringify({ kycType, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.details?.join(", ") || data?.message || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setResetting(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
            <ShieldAlert size={24} className="text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">KYC Reset Successful</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            {user.firstname} {user.lastname}'s <span className="font-semibold capitalize">{kycType}</span> KYC has been reset.
            They will be required to re-submit their documents.
          </p>
          <div className="bg-orange-50 text-orange-700 font-semibold text-sm px-5 py-2 rounded-full ring-1 ring-orange-200">
            Status reset to <span className="capitalize">none</span>
          </div>
          <button
            onClick={onClose}
            className="mt-2 w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <ShieldAlert size={16} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 leading-tight">Reset KYC</h2>
              <p className="text-xs text-gray-400">
                {user.firstname} {user.lastname}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Info banner */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
            <ShieldAlert size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              This will reset the user's KYC status to <span className="font-semibold">none</span> and archive or reject their
              existing documents. They will be prompted to re-submit.
            </p>
          </div>

          {/* KYC type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              KYC Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {KYC_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKycType(opt.value)}
                  className={`flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-left transition ${
                    kycType === opt.value
                      ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className={`text-xs font-semibold ${kycType === opt.value ? "text-orange-700" : "text-gray-700"}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-gray-400 leading-snug">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Document blurry, please re-upload."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              This reason may be shown to the user as guidance for re-submission.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={resetting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={resetting || !reason.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {resetting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Resetting…
              </>
            ) : (
              <>
                <ShieldAlert size={13} />
                Reset KYC
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Email Modal ───────────────────────────────────────────────────────────────
const EmailModal = ({ onClose, totalUsers, preselectedUsers }) => {
  const isTargeted = preselectedUsers !== null;

  const [subject,      setSubject]      = useState("");
  const [body,         setBody]         = useState("");
  const [audience,     setAudience]     = useState("all");
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [sending,      setSending]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);

  const selectedAudience = AUDIENCE_OPTIONS.find(o => o.value === audience);
  const recipients       = preselectedUsers ?? [];

  const handleSend = async () => {
    if (!subject.trim())                    return setError("Subject is required.");
    if (!body.trim() || body === "<p></p>") return setError("Message body is required.");
    setError(null);
    setSending(true);
    try {
      const payload = isTargeted
        ? { subject: subject.trim(), htmlContent: body.trim(), sendTo: "selected", userIds: recipients.map(u => u.id) }
        : { subject: subject.trim(), htmlContent: body.trim(), sendTo: audience };

      const token = localStorage.getItem("token");
      const res   = await fetch(`${API_URL}/superAdmin/broadcast-email`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.details?.join(", ") || data?.message || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <Send size={24} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Email Dispatched!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{result.message || "Email dispatched successfully."}</p>
          <div className="bg-emerald-50 text-emerald-700 font-semibold text-sm px-5 py-2 rounded-full ring-1 ring-emerald-200">
            {result.dispatchedCount?.toLocaleString() ?? "—"} recipient{result.dispatchedCount !== 1 ? "s" : ""} reached
          </div>
          <button onClick={onClose} className="mt-2 w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTargeted ? "bg-purple-50" : "bg-blue-50"}`}>
              <Mail size={16} className={isTargeted ? "text-purple-600" : "text-blue-600"} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 leading-tight">{isTargeted ? "Send Email" : "Broadcast Email"}</h2>
              <p className="text-xs text-gray-400">
                {isTargeted ? `To ${recipients.length} selected user${recipients.length !== 1 ? "s" : ""}` : "Send a message to users"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isTargeted && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recipients</label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200 max-h-28 overflow-y-auto">
                {recipients.map(u => (
                  <span key={u.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-bold uppercase shrink-0">{u.firstname?.[0] || "?"}</span>
                    {u.firstname} {u.lastname}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isTargeted && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Audience</label>
              <div className="relative">
                <button
                  onClick={() => setAudienceOpen(v => !v)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-300 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${selectedAudience.dot}`} />
                    <span className="font-medium">{selectedAudience.label}</span>
                    <span className="text-gray-400">— {selectedAudience.description}</span>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${audienceOpen ? "rotate-180" : ""}`} />
                </button>
                {audienceOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setAudienceOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                      {AUDIENCE_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setAudience(opt.value); setAudienceOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition hover:bg-gray-50 ${audience === opt.value ? "bg-blue-50/60" : ""}`}>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                          <div className="text-left">
                            <p className="font-medium text-gray-800">{opt.label}</p>
                            <p className="text-xs text-gray-400">{opt.description}</p>
                          </div>
                          {audience === opt.value && <span className="ml-auto text-blue-600 text-xs font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Important update to your account"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message <span className="text-red-400">*</span></label>
            </div>
            <RichEditor onChange={setBody} />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            Sending to:{" "}
            <span className="font-semibold text-gray-600">
              {isTargeted ? `${recipients.length} user${recipients.length !== 1 ? "s" : ""}` : audience === "all" ? `all ${totalUsers.toLocaleString()} users` : `${audience} users`}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} disabled={sending} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition">Cancel</button>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim() || body === "<p></p>"}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition ${isTargeted ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {sending ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</>
              ) : (
                <><Send size={13} />{isTargeted ? `Send to ${recipients.length}` : "Send Broadcast"}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const UsersTable = ({
  users,
  totalUsers,
  limit,
  offset,
  onPageChange,
  onStatusChange,
  statusUpdating,
}) => {
  const navigate = useNavigate();

  const [openMenu,      setOpenMenu]      = useState(null);
  const [selectedIds,   setSelectedIds]   = useState(new Set());
  const [modalOpen,     setModalOpen]     = useState(false);
  const [targetedUsers, setTargetedUsers] = useState(null);
  const [kycResetUser,  setKycResetUser]  = useState(null); // user to reset KYC for

  const totalPages  = Math.ceil(totalUsers / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const startItem   = offset + 1;
  const endItem     = Math.min(offset + limit, totalUsers);

  const statusOptions = ["active", "inactive", "blocked", "deactivated"];

  const allSelected   = users.length > 0 && users.every(u => selectedIds.has(u.id));
  const someSelected  = users.some(u => selectedIds.has(u.id));
  const selectedUsers = users.filter(u => selectedIds.has(u.id));

  const toggleUser = (id) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const next = new Set(prev); users.forEach(u => next.delete(u.id)); return next; });
    } else {
      setSelectedIds(prev => { const next = new Set(prev); users.forEach(u => next.add(u.id)); return next; });
    }
  };

  const openBroadcast          = ()     => { setTargetedUsers(null); setModalOpen(true); };
  const openTargeted           = (list) => { setTargetedUsers(list); setModalOpen(true); };
  const openTargetedFromSelect = ()     => openTargeted(selectedUsers);
  const closeModal             = ()     => { setModalOpen(false); setTargetedUsers(null); };

  const openKycReset  = (user) => { setKycResetUser(user); setOpenMenu(null); };
  const closeKycReset = ()     => setKycResetUser(null);

  const thCls = "px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider";
  const tdCls = "px-5 py-4";

  return (
    <>
      {modalOpen && (
        <EmailModal onClose={closeModal} totalUsers={totalUsers} preselectedUsers={targetedUsers} />
      )}

      {kycResetUser && (
        <ResetKycModal user={kycResetUser} onClose={closeKycReset} />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-gray-600">{totalUsers.toLocaleString()}</span> total users
          </p>
         <div className="flex items-center gap-2">
  <button
    onClick={() => navigate("/admin/admin-tools?tab=wallet")}
    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
  >
    <Wallet size={13} />
    Adjust Wallet
  </button>
  <button
    onClick={() => navigate("/admin/admin-tools?tab=push")}
    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
  >
    <Bell size={13} />
    Send Push
  </button>
  <button
    onClick={openBroadcast}
    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
  >
    <Mail size={13} />
    Broadcast Email
  </button>
</div>
        </div>

        {/* Selection action bar */}
        {someSelected && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-purple-50 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-purple-500" />
              <span className="text-xs font-semibold text-purple-700">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openTargetedFromSelect}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                <Mail size={11} />
                Send Email to {selectedUsers.length} selected
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="w-6 h-6 flex items-center justify-center rounded-md text-purple-400 hover:bg-purple-100 hover:text-purple-600 transition"
                title="Clear selection"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-3xl">👥</p>
              <p className="text-sm font-medium text-gray-500">No users found</p>
              <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-purple-600"
                    />
                  </th>
                  <th className={thCls}>User</th>
                  <th className={thCls}>Email / Phone</th>
                  <th className={thCls}>Country</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Last Login</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => {
                  const isChecked = selectedIds.has(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50/70 transition-colors group ${isChecked ? "bg-purple-50/40" : ""}`}
                    >
                      <td className="px-4 py-4 w-10">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUser(user.id)}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-purple-600"
                        />
                      </td>

                      <td className={tdCls}>
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/all-users/${user.id}`)}>
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0 uppercase">
                            {user.firstname?.[0] || "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition text-sm leading-tight">
                              {user.firstname} {user.lastname}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">@{user.tag || user.firstname?.toLowerCase() || "user"}</p>
                          </div>
                        </div>
                      </td>

                      <td className={tdCls}>
                        <p className="text-gray-700 text-sm">{user.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.phoneNumber || "—"}</p>
                      </td>

                      <td className={`${tdCls} text-gray-600 text-sm`}>{user.country || "—"}</td>

                      <td className={tdCls}><StatusBadge status={user.status} /></td>

                      <td className={`${tdCls} text-xs text-gray-400 whitespace-nowrap`}>
                        {user.lastLogin ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true }) : "Never"}
                      </td>

                      <td className={tdCls}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/all-users/${user.id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          >
                            <ExternalLink size={11} /> View
                          </button>

                          <button
                            onClick={() => openTargeted([user])}
                            title={`Send email to ${user.firstname}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition text-gray-400"
                          >
                            <Mail size={13} />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition text-gray-500"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {openMenu === user.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">

                                  {/* Status section */}
                                  <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Set Status</p>
                                  {statusOptions.map((s) => {
                                    const colorMap = {
                                      active:      "text-emerald-700 hover:bg-emerald-50",
                                      inactive:    "text-amber-700 hover:bg-amber-50",
                                      blocked:     "text-red-600 hover:bg-red-50",
                                      deactivated: "text-gray-600 hover:bg-gray-50",
                                    };
                                    return (
                                      <button
                                        key={s}
                                        disabled={statusUpdating === user.id || user.status === s}
                                        onClick={() => { onStatusChange(user.id, s); setOpenMenu(null); }}
                                        className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium capitalize transition disabled:opacity-40 disabled:cursor-not-allowed ${colorMap[s]}`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                          s === "active"      ? "bg-emerald-500" :
                                          s === "inactive"    ? "bg-amber-400"   :
                                          s === "blocked"     ? "bg-red-500"     : "bg-gray-400"
                                        }`} />
                                        {statusUpdating === user.id ? "Updating…" : s}
                                        {user.status === s && " ✓"}
                                      </button>
                                    );
                                  })}

                                  {/* Divider */}
                                  <div className="my-1 border-t border-gray-100" />

                                  {/* KYC section */}
                                  <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">KYC</p>
                                  <button
                                    onClick={() => openKycReset(user)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-orange-600 hover:bg-orange-50 transition"
                                  >
                                    <ShieldAlert size={12} />
                                    Reset KYC
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalUsers > limit && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
            <p className="text-xs text-gray-400 shrink-0">
              Showing <span className="font-semibold text-gray-600">{startItem}–{endItem}</span> of{" "}
              <span className="font-semibold text-gray-600">{totalUsers}</span> users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(offset - limit)}
                disabled={offset === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={15} />
              </button>
              {pageNumbers.map((p, idx) =>
                p === "..." ? (
                  <span key={`e${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange((p - 1) * limit)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition ${
                      p === currentPage
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => onPageChange(offset + limit)}
                disabled={offset + limit >= totalUsers}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UsersTable;