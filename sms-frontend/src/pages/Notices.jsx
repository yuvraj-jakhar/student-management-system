import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Pin,
  Calendar,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  Building,
  User,
  ExternalLink,
  Filter,
  CheckCircle2,
  Sparkles,
  Megaphone,
} from "lucide-react";
import toast from "react-hot-toast";

import { getCurrentUser } from "../services/auth";
import { getAllNotices, createNotice, deleteNotice, togglePinNotice } from "../services/notices";
import Loader from "../components/Loader";
import Modal from "../components/Modal";

export default function Notices() {
  const user = getCurrentUser();
  const roles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
  const isAdmin = roles.includes("admin") || roles.includes("can_create_student");
  const isTeacher = roles.includes("teacher");

  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "Academic",
    priority: "Normal",
    target_audience: "All",
    department: "All Departments",
    is_pinned: false,
  });

  // Notice Details Modal
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const data = await getAllNotices();
      setNotices(data || []);
    } catch (err) {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    try {
      setCreateLoading(true);
      await createNotice(form);
      toast.success("Official Notice published successfully!");
      setCreateModalOpen(false);
      setForm({
        title: "",
        content: "",
        category: "Academic",
        priority: "Normal",
        target_audience: "All",
        department: "All Departments",
        is_pinned: false,
      });
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to publish notice");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteNotice = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete notice: "${title}"?`)) return;

    try {
      await deleteNotice(id);
      toast.success("Notice deleted");
      setNotices((prev) => prev.filter((n) => n._id !== id));
      if (selectedNotice?._id === id) setSelectedNotice(null);
    } catch (err) {
      toast.error("Failed to delete notice");
    }
  };

  const handleTogglePin = async (id) => {
    try {
      const res = await togglePinNotice(id);
      toast.success(res.message || "Pin status updated");
      fetchNotices();
    } catch (err) {
      toast.error("Failed to update pin status");
    }
  };

  // Filter & Search
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchesCat =
        selectedCategory === "all" ||
        n.category?.toLowerCase() === selectedCategory.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesQuery =
        !searchQuery ||
        n.title?.toLowerCase().includes(query) ||
        n.content?.toLowerCase().includes(query) ||
        n.department?.toLowerCase().includes(query) ||
        n.author_name?.toLowerCase().includes(query);

      return matchesCat && matchesQuery;
    });
  }, [notices, selectedCategory, searchQuery]);

  const categories = [
    { id: "all", label: "All Circulars" },
    { id: "Exam", label: "Examinations" },
    { id: "Academic", label: "Academic" },
    { id: "Placement", label: "Placements" },
    { id: "Event", label: "Events & Hackathons" },
    { id: "Holiday", label: "Holidays" },
  ];

  const getCategoryBadgeClass = (cat) => {
    switch (cat?.toLowerCase()) {
      case "exam":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "placement":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "event":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "holiday":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority?.toLowerCase() === "urgent") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
          URGENT
        </span>
      );
    }
    if (priority?.toLowerCase() === "high") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
          HIGH PRIORITY
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Megaphone size={19} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                University Notice Board
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official circulars, examination schedules, placement notices, and academic directives.
              </p>
            </div>
          </div>
        </div>

        {(isAdmin || isTeacher) && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs self-start sm:self-auto"
          >
            <Plus size={16} /> Publish New Notice
          </button>
        )}
      </div>

      {/* 2. Search & Category Filter Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search circulars by title, topic, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-indigo-600 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold self-start sm:self-auto">
            <span>Total Circulars:</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-lg font-mono text-[11px] font-bold">
              {filteredNotices.length}
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory.toLowerCase() === cat.id.toLowerCase()
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Notices Grid */}
      {loading ? (
        <Loader text="Loading university announcements..." />
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-xs">
          <Bell size={42} className="mx-auto text-slate-300 mb-2.5" />
          <h3 className="text-sm font-bold text-slate-700">No circulars found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No announcements matching "${searchQuery}". Try clearing search.`
              : "No notices published yet in this category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotices.map((notice) => {
            const isPinned = notice.is_pinned;
            const categoryClass = getCategoryBadgeClass(notice.category);

            return (
              <div
                key={notice._id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden group ${
                  isPinned
                    ? "border-amber-300 ring-2 ring-amber-400/20"
                    : "border-slate-200/80 hover:border-indigo-300"
                }`}
              >
                {/* Card Top Banner / Tags */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${categoryClass}`}
                      >
                        {notice.category || "Academic"}
                      </span>
                      {getPriorityBadge(notice.priority)}
                      {isPinned && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-200">
                          <Pin size={10} className="fill-amber-800" /> Pinned
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleTogglePin(notice._id)}
                          className={`p-1.5 rounded-lg text-xs transition ${
                            isPinned
                              ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                              : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          }`}
                          title={isPinned ? "Unpin notice" : "Pin notice to top"}
                        >
                          <Pin size={13} className={isPinned ? "fill-amber-600" : ""} />
                        </button>
                        <button
                          onClick={() => handleDeleteNotice(notice._id, notice.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete notice"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setSelectedNotice(notice)}
                    className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition cursor-pointer line-clamp-2 leading-snug"
                  >
                    {notice.title}
                  </h3>

                  {/* Snippet */}
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {notice.content}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>
                      {notice.created_at
                        ? new Date(notice.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recent"}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedNotice(notice)}
                    className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                  >
                    Read Details <ExternalLink size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Full Circular Details Modal */}
      <Modal
        isOpen={!!selectedNotice}
        onClose={() => setSelectedNotice(null)}
        title={selectedNotice?.title || "Official Circular"}
      >
        {selectedNotice && (
          <div className="space-y-4">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100 text-xs">
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getCategoryBadgeClass(
                  selectedNotice.category
                )}`}
              >
                {selectedNotice.category}
              </span>
              {getPriorityBadge(selectedNotice.priority)}
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px]">
                Audience: {selectedNotice.target_audience || "All"}
              </span>
              <span className="ml-auto text-slate-400 flex items-center gap-1 text-[11px]">
                <Calendar size={13} />
                {selectedNotice.created_at
                  ? new Date(selectedNotice.created_at).toLocaleString()
                  : "Recently posted"}
              </span>
            </div>

            {/* Content Body */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
              {selectedNotice.content}
            </div>

            {/* Author Attribution */}
            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  <Building size={14} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{selectedNotice.author_name || "Administration"}</p>
                  <p className="text-[11px] text-slate-500">{selectedNotice.department || "Academic Affairs"}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Circular
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Publish Notice Modal (Admin / Teacher) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Publish Official University Circular"
      >
        <form onSubmit={handleCreateNotice} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              placeholder="e.g. End-Semester Examination Schedule Autumn 2026"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
              >
                <option value="Academic">Academic</option>
                <option value="Exam">Exam</option>
                <option value="Placement">Placement</option>
                <option value="Event">Event</option>
                <option value="Holiday">Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority *
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Audience *
              </label>
              <select
                value={form.target_audience}
                onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
              >
                <option value="All">All Members</option>
                <option value="Students">Students Only</option>
                <option value="Faculty">Faculty Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Issuing Department
            </label>
            <input
              type="text"
              placeholder="e.g. Department of Computer Science & Engineering"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Circular Content *
            </label>
            <textarea
              rows={5}
              placeholder="Detailed notification announcement body text..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600 leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_pinned"
              checked={form.is_pinned}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label htmlFor="is_pinned" className="text-xs text-slate-700 font-semibold cursor-pointer">
              Pin this circular to top of notice board
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {createLoading ? "Publishing..." : "Broadcast Notice"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
