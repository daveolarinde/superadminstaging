import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Plus, RefreshCw, Megaphone, ImageIcon, Images, FileText,
  Edit2, Eye, EyeOff, X, Upload, Trash2, ChevronLeft, ChevronRight, ExternalLink, Zap, LayoutDashboard,
  Bold, Italic, Underline, Link, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Minus, Undo, Redo,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import LinkExt from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const PLACEMENT_OPTIONS = [
  { value: "",                    label: "Select placement…"  },
  { value: "home_dashboard",      label: "Home Dashboard"     },
  { value: "wallet_screen",       label: "Wallet Screen"      },
  { value: "referral_page",       label: "Referral Page"      },
  { value: "transaction_history", label: "Transaction History"},
  { value: "transfer_screen",     label: "Transfer Screen"    },
  { value: "kyc_banner",          label: "KYC Banner"         },
  { value: "login_popup",         label: "Login Popup"        },
];

// An item belongs to the Announcements tab if it has htmlContent, placement=app_launch, or type=major
// This covers both old records (type:other + htmlContent) and new ones (type:major)
const isAnnouncementItem = (a) =>
  a.type === "major" ||
  a.placement === "app_launch" ||
  (a.htmlContent && a.htmlContent.trim().length > 0);

// Banner types (shown in banner modal)
const BANNER_TYPE_META = {
  single_image: {
    label: "Single Image",
    Icon: () => <ImageIcon size={14} />,
    color: "bg-violet-50 text-violet-600 ring-1 ring-violet-200",
  },
  carousel: {
    label: "Carousel",
    Icon: () => <Images size={14} />,
    color: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
  },
  other: {
    label: "Other",
    Icon: () => <FileText size={14} />,
    color: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  },
};

// Full type meta (for badges — "other" that is an announcement shows as Announcement badge)
const TYPE_META = {
  ...BANNER_TYPE_META,
  major: {
    label: "Announcement",
    Icon: () => <Zap size={14} />,
    color: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
  },
};

const STATUS_META = {
  active:   { cls: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  inactive: { cls: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",         dot: "bg-gray-400"   },
};

// ── Sub-components ────────────────────────────────────────────────────────────
const TypeBadge = ({ type, isAnnouncement }) => {
  // If the record is an announcement (even if type=other), show Announcement badge
  const key = isAnnouncement ? "major" : (type || "other").toLowerCase();
  const m = TYPE_META[key] ?? TYPE_META.other;
  const { Icon } = m;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.color}`}>
      <Icon />{m.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status?.toLowerCase()] ?? STATUS_META.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {status}
    </span>
  );
};

// ── Image preview carousel ────────────────────────────────────────────────────
const MediaPreview = ({ media = [], type }) => {
  const [idx, setIdx] = useState(0);
  if (!media.length) return <span className="text-gray-300 text-xs">No media</span>;

  if (type === "single_image" || media.length === 1) {
    return (
      <img
        src={media[0]}
        alt="preview"
        className="w-14 h-10 object-cover rounded-lg border border-gray-100"
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
        <ChevronLeft size={12} />
      </button>
      <img
        src={media[idx]}
        alt={`slide ${idx + 1}`}
        className="w-14 h-10 object-cover rounded-lg border border-gray-100"
        onError={(e) => { e.target.style.display = "none"; }}
      />
      <button type="button" onClick={() => setIdx((i) => Math.min(media.length - 1, i + 1))} disabled={idx === media.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
        <ChevronRight size={12} />
      </button>
      <span className="text-xs text-gray-400">{idx + 1}/{media.length}</span>
    </div>
  );
};

// ── File Drop Zone ────────────────────────────────────────────────────────────
const FileDropZone = ({ label, multiple, files, onChange, onRemove }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (!dropped.length) return;
    onChange(multiple ? dropped : [dropped[0]]);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
        }`}
      >
        <Upload size={20} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden"
          onChange={(e) => onChange(Array.from(e.target.files))} />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              <img src={URL.createObjectURL(f)} alt="" className="w-20 h-16 object-cover rounded-lg border border-gray-200" />
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={10} />
              </button>
              <p className="text-xs text-gray-400 truncate max-w-[80px] mt-0.5">{f.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Rich Text Editor ──────────────────────────────────────────────────────────
const ToolbarBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    disabled={disabled}
    title={title}
    className={`w-7 h-7 flex items-center justify-center rounded-md text-xs transition
      ${active ? "bg-rose-100 text-rose-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"}
      disabled:opacity-30 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const ToolbarDivider = () => <div className="w-px h-4 bg-gray-200 mx-0.5 self-center" />;

const RichEditor = ({ onChange, initialContent = "" }) => {
  const [linkUrl,  setLinkUrl]  = useState("");
  const [showLink, setShowLink] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      UnderlineExt,
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: "text-rose-600 underline" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "min-h-[160px] max-h-[260px] overflow-y-auto outline-none px-3.5 py-3 text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none",
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
    <div className="rounded-xl border border-gray-200 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-50 transition overflow-hidden bg-white">
      {/* Toolbar */}
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
          className="text-xs text-gray-600 border border-gray-200 rounded-md px-1.5 py-1 bg-white focus:outline-none focus:border-rose-400 cursor-pointer h-7"
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
      {/* Link input */}
      {showLink && (
        <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border-b border-rose-100">
          <input
            autoFocus
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyLink(); if (e.key === "Escape") setShowLink(false); }}
            placeholder="https://example.com"
            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white focus:outline-none focus:border-rose-400 text-gray-700 placeholder-gray-400"
          />
          <button type="button" onClick={applyLink} className="px-3 py-1.5 text-xs font-semibold bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition">Apply</button>
          <button type="button" onClick={() => setShowLink(false)} className="text-gray-400 hover:text-gray-600 transition"><X size={13} /></button>
        </div>
      )}
      {/* Content area */}
      <EditorContent editor={editor} />
      {/* Footer */}
      <div className="px-3.5 py-1.5 border-t border-gray-100 bg-gray-50/60">
        <p className="text-[10px] text-gray-400">
          Rich text · outputs clean HTML ·{" "}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Ctrl+B</kbd> bold ·{" "}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] ml-1">Ctrl+I</kbd> italic ·{" "}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] ml-1">Ctrl+U</kbd> underline
        </p>
      </div>
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
// mode: "banner" | "announcement"
const AnnouncementModal = ({ open, onClose, onSaved, editData, mode }) => {
  const isEdit = !!editData;
  const isMajorMode = mode === "announcement";

  const blankForm = {
    name: "",
    type: isMajorMode ? "other" : "single_image",
    placement: "", actionUrl: "",
    status: "active", subject: "", htmlContent: "",
  };

  const [form, setForm]     = useState(blankForm);
  const [files, setFiles]   = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!open) return;
    if (editData) {
      setForm({
        name:        editData.name        || "",
        type:        editData.type        || (isMajorMode ? "other" : "single_image"),
        placement:   editData.placement   || "",
        actionUrl:   editData.actionUrl   || "",
        status:      editData.status      || "active",
        subject:     editData.subject     || "",
        htmlContent: editData.htmlContent || "",
      });
    } else {
      setForm({
        ...blankForm,
        type: isMajorMode ? "other" : "single_image",
      });
    }
    setFiles([]);
    setError("");
  }, [editData, open, isMajorMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Name is required");

    if (isMajorMode) {
      if (!form.subject.trim()) return setError("Subject is required");
      const htmlEmpty = !form.htmlContent.trim() || form.htmlContent === "<p></p>";
      if (htmlEmpty) return setError("HTML content is required");
    } else {
      if (!isEdit && form.type !== "other" && files.length === 0)
        return setError("Please upload at least one image");
      if (form.type === "single_image" && files.length > 1)
        return setError("Single image type allows only one image");
    }

    setSaving(true);

    try {
      let res;

      if (isMajorMode) {
        // Always send as type "other" with placement "app_launch" — matches old records too
        const payload = {
          name:        form.name.trim(),
          type:        "other",
          status:      "active",
          placement:   "app_launch",
          subject:     form.subject,
          htmlContent: form.htmlContent,
        };

        if (isEdit) {
          res = await axios.put(`${API_BASE_URL}/superadmin/announcements/${editData.id}`, payload, { headers: authHeaders() });
        } else {
          res = await axios.post(`${API_BASE_URL}/superadmin/announcements`, payload, { headers: authHeaders() });
        }
      } else {
        const fd = new FormData();
        fd.append("name", form.name.trim());
        fd.append("type", form.type.toLowerCase());
        fd.append("status", form.status);
        fd.append("placement", form.placement);
        fd.append("actionUrl", form.actionUrl);
        files.forEach((f) => fd.append("media", f));

        if (isEdit) {
          res = await axios.put(`${API_BASE_URL}/superadmin/announcements/${editData.id}`, fd, { headers: authHeaders() });
        } else {
          res = await axios.post(`${API_BASE_URL}/superadmin/announcements`, fd, { headers: authHeaders() });
        }
      }

      console.log("RESPONSE:", res?.data);
      onSaved(mode);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || `Failed to ${isEdit ? "update" : "create"}`);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isMajorMode ? "bg-rose-500" : "bg-violet-600"}`}>
              {isMajorMode ? <Zap size={15} className="text-white" /> : <LayoutDashboard size={15} className="text-white" />}
            </div>
            <h2 className="text-base font-bold text-gray-900">
              {isEdit
                ? `Edit ${isMajorMode ? "Announcement" : "Banner"}`
                : `New ${isMajorMode ? "Announcement" : "Banner"}`}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={isMajorMode ? "e.g. System Maintenance Notice" : "e.g. Summer Promo Banner"}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-300"
            />
          </div>

          {/* Type selector — banners only */}
          {!isMajorMode && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(BANNER_TYPE_META).map(([val, meta]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { set("type", val); setFiles([]); setError(""); }}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                      form.type === val
                        ? "border-violet-500 bg-violet-50 text-violet-600"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg">
                      {val === "single_image" ? "🖼️" : val === "carousel" ? "🎠" : "📄"}
                    </span>
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── ANNOUNCEMENT FIELDS ── */}
          {isMajorMode && (
            <>
              <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 space-y-0.5">
                <p className="text-sm font-semibold text-rose-700 flex items-center gap-1.5">
                  <Zap size={13} /> Major Announcement
                </p>
                <p className="text-xs text-rose-500">
                  Placement is fixed to <strong>App Launch</strong> · Status is always <strong>Active</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Subject *{" "}
                  <span className="text-gray-400 normal-case font-normal">(HTML allowed)</span>
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => set("subject", e.target.value)}
                  placeholder='e.g. <strong>Important Update</strong> — Please Read'
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder-gray-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">HTML Content *</label>
                <RichEditor
                  key={open ? (editData?.id ?? "new") : "closed"}
                  initialContent={form.htmlContent}
                  onChange={(html) => set("htmlContent", html)}
                />
              </div>
            </>
          )}

          {/* ── BANNER FIELDS ── */}
          {!isMajorMode && (
            <>
              {form.type === "single_image" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Image {!isEdit && "*"}
                  </label>
                  <FileDropZone
                    label="Drop or click to upload one image"
                    multiple={false}
                    files={files}
                    onChange={(f) => setFiles([f[0]])}
                    onRemove={() => setFiles([])}
                  />
                  {isEdit && editData?.media?.length > 0 && files.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1.5">Current image kept unless you upload a new one.</p>
                  )}
                </div>
              )}

              {form.type === "carousel" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Carousel Images {!isEdit && "*"}{" "}
                    <span className="text-gray-400 normal-case font-normal">(2 or more recommended)</span>
                  </label>
                  <FileDropZone
                    label="Drop or click to upload multiple images"
                    multiple={true}
                    files={files}
                    onChange={(f) => setFiles((prev) => [...prev, ...f])}
                    onRemove={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                  {isEdit && editData?.media?.length > 0 && files.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1.5">Current {editData.media.length} image(s) kept unless you upload new ones.</p>
                  )}
                </div>
              )}

              {form.type === "other" && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                  📄 No media required for "Other" type — uses action URL and placement only.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Placement</label>
                <select
                  value={form.placement}
                  onChange={(e) => set("placement", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                >
                  {PLACEMENT_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value} disabled={value === ""}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Action URL</label>
                <input
                  type="text"
                  value={form.actionUrl}
                  onChange={(e) => set("actionUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <div className="flex gap-3">
                  {["active", "inactive"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("status", s)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                        form.status === s
                          ? s === "active"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                            : "border-gray-400 bg-gray-100 text-gray-600"
                          : "border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {s === "active" ? "✅ Active" : "⏸ Inactive"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition flex items-center justify-center gap-2 ${
                isMajorMode ? "bg-rose-500 hover:bg-rose-600" : "bg-violet-600 hover:bg-violet-700"
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : isEdit
                ? "Save Changes"
                : `Create ${isMajorMode ? "Announcement" : "Banner"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Shared Table ──────────────────────────────────────────────────────────────
const ItemTable = ({ items, mode, onEdit, onToggle, onDelete, togglingId, deletingId, openCreate }) => {
  const placementLabel = (value) => {
    if (value === "app_launch") return "App Launch";
    return PLACEMENT_OPTIONS.find((o) => o.value === value)?.label || value || "—";
  };

  const isAnn = mode === "announcement";

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        {isAnn ? <Zap size={32} className="text-gray-300" /> : <LayoutDashboard size={32} className="text-gray-300" />}
        <p className="text-sm font-medium text-gray-500">No {isAnn ? "announcements" : "banners"} found</p>
        <button
          type="button"
          onClick={openCreate}
          className={`mt-3 px-4 py-2 text-sm text-white rounded-xl transition ${
            isAnn ? "bg-rose-500 hover:bg-rose-600" : "bg-violet-600 hover:bg-violet-700"
          }`}
        >
          + Create one
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[960px] w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {["Preview", "Name", "Type", "Placement", "Subject / Action URL", "Status", "Created", "Actions"].map((h) => (
              <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item) => {
            const ann = isAnnouncementItem(item);
            const isLocked = ann; // announcements always active, no toggle

            return (
              <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">

                {/* Preview */}
                <td className="px-4 py-3.5">
                  {ann ? (
                    <div className="w-14 h-10 bg-rose-50 rounded-lg border border-rose-100 flex items-center justify-center">
                      <Zap size={16} className="text-rose-400" />
                    </div>
                  ) : (
                    <MediaPreview media={item.media || []} type={item.type} />
                  )}
                </td>

                {/* Name */}
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-black">{item.name}</span>
                </td>

                {/* Type */}
                <td className="px-4 py-3.5">
                  <TypeBadge type={item.type} isAnnouncement={ann} />
                </td>

                {/* Placement */}
                <td className="px-4 py-3.5">
                  {item.placement ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      item.placement === "app_launch" ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-600"
                    }`}>
                      {placementLabel(item.placement)}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>

                {/* Subject / Action URL */}
                <td className="px-4 py-3.5 max-w-[150px]">
                  {ann ? (
                    item.subject ? (
                      <span
                        className="text-xs text-gray-900 block truncate max-w-[140px]"
                        title={item.subject.replace(/<[^>]*>/g, "")}
                        dangerouslySetInnerHTML={{ __html: item.subject }}
                      />
                    ) : (
                      <span className="text-black text-xs">—</span>
                    )
                  ) : item.actionUrl ? (
                    <a
                      href={item.actionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline max-w-[140px] truncate"
                    >
                      <ExternalLink size={10} />
                      {item.actionUrl}
                    </a>
                  ) : (
                    <span className="text-black text-xs">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <StatusBadge status={item.status} />
                </td>

                {/* Created */}
                <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggle(item)}
                      disabled={togglingId === item.id || isLocked}
                      title={isLocked ? "Announcements are always active" : item.status === "active" ? "Deactivate" : "Activate"}
                      className={`p-1.5 rounded-lg transition ${
                        isLocked
                          ? "text-gray-300 cursor-not-allowed"
                          : item.status === "active"
                          ? "text-emerald-600 hover:bg-emerald-50"
                          : "text-gray-400 hover:bg-gray-100"
                      } disabled:opacity-40`}
                    >
                      {togglingId === item.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : item.status === "active" ? (
                        <Eye size={15} />
                      ) : (
                        <EyeOff size={15} />
                      )}
                    </button>

                    <button type="button" onClick={() => onEdit(item)} title="Edit"
                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition">
                      <Edit2 size={15} />
                    </button>

                    <button type="button" onClick={() => onDelete(item)} disabled={deletingId === item.id} title="Delete"
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40">
                      {deletingId === item.id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [error, setError]                 = useState("");

  const [activeTab, setActiveTab]         = useState("banner");
  const [filterType, setFilterType]       = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [modalOpen, setModalOpen]         = useState(false);
  const [editData, setEditData]           = useState(null);
  const [modalMode, setModalMode]         = useState("banner");
  const [togglingId, setTogglingId]       = useState(null);
  const [deletingId, setDeletingId]       = useState(null);

  const fetchAnnouncements = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE_URL}/superadmin/announcements`, { headers: authHeaders() });
      const raw = res.data?.data ?? res.data;
      setAnnouncements(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleToggleStatus = async (item) => {
    if (isAnnouncementItem(item)) return;
    const newStatus = item.status === "active" ? "inactive" : "active";
    setTogglingId(item.id);
    try {
      const fd = new FormData();
      fd.append("status", newStatus);
      await axios.put(`${API_BASE_URL}/superadmin/announcements/${item.id}`, fd, { headers: authHeaders() });
      setAnnouncements((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: newStatus } : a)));
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      await axios.delete(`${API_BASE_URL}/superadmin/announcements/${item.id}`, { headers: authHeaders() });
      setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const openCreate = (tab) => {
    setEditData(null);
    setModalMode(tab ?? activeTab);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditData(item);
    // Use the same isAnnouncementItem logic to detect which modal to open
    setModalMode(isAnnouncementItem(item) ? "announcement" : "banner");
    setModalOpen(true);
  };

  // Split using the shared helper — covers type:major, type:other+htmlContent, placement:app_launch
  const bannerItems       = announcements.filter((a) => !isAnnouncementItem(a));
  const announcementItems = announcements.filter((a) =>  isAnnouncementItem(a));

  const baseItems = activeTab === "banner" ? bannerItems : announcementItems;
  const filtered  = baseItems.filter((a) => {
    if (filterType   && a.type   !== filterType)   return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setFilterType("");
    setFilterStatus("");
  };

  const isBannerTab = activeTab === "banner";

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {isBannerTab
              ? <LayoutDashboard size={20} className="text-violet-600" />
              : <Megaphone size={20} className="text-rose-500" />}
            {isBannerTab ? "Banners" : "Announcements"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {baseItems.length} total · {baseItems.filter((a) => a.status === "active").length} active
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isBannerTab && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
            >
              <option value="">All Types</option>
              <option value="single_image">Single Image</option>
              <option value="carousel">Carousel</option>
              <option value="other">Other</option>
            </select>
          )}

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            onClick={() => fetchAnnouncements(true)}
            disabled={refreshing}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border shadow-sm transition ${
              refreshing ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => openCreate(activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition shadow-sm ${
              isBannerTab ? "bg-violet-600 hover:bg-violet-700" : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            <Plus size={15} />
            New {isBannerTab ? "Banner" : "Announcement"}
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",    value: baseItems.length,                                        bg: "bg-indigo-50",  text: "text-indigo-700"  },
          { label: "Active",   value: baseItems.filter((a) => a.status === "active").length,   bg: "bg-emerald-50", text: "text-emerald-700" },
          { label: "Inactive", value: baseItems.filter((a) => a.status === "inactive").length, bg: "bg-gray-100",   text: "text-gray-600"    },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
        {[
          { key: "banner",       label: "Banners",       icon: <LayoutDashboard size={14} />, count: bannerItems.length       },
          { key: "announcement", label: "Announcements", icon: <Megaphone size={14} />,       count: announcementItems.length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabSwitch(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? tab.key === "announcement"
                  ? "bg-white text-rose-500 shadow-sm"
                  : "bg-white text-violet-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab.key
                ? tab.key === "announcement"
                  ? "bg-rose-50 text-rose-500"
                  : "bg-violet-50 text-violet-600"
                : "bg-gray-200 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            <p className="text-sm text-gray-400">Loading…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2 text-center px-4">
            <p className="text-2xl">⚠️</p>
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button type="button" onClick={() => fetchAnnouncements()}
              className="mt-2 px-4 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
              Try again
            </button>
          </div>
        ) : (
          <ItemTable
            items={filtered}
            mode={activeTab}
            onEdit={openEdit}
            onToggle={handleToggleStatus}
            onDelete={handleDelete}
            togglingId={togglingId}
            deletingId={deletingId}
            openCreate={() => openCreate(activeTab)}
          />
        )}
      </div>

      {/* ── Modal ── */}
      <AnnouncementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(savedMode) => {
          if (savedMode) setActiveTab(savedMode);
          fetchAnnouncements(true);
        }}
        editData={editData}
        mode={modalMode}
      />
    </div>
  );
}