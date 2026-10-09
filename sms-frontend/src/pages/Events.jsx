import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Search,
  Plus,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Sparkles,
  Trophy,
  Briefcase,
  GraduationCap,
  Award,
  AlertCircle,
  Trash2,
  ExternalLink,
  RefreshCw,
  Globe,
  Filter,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  Send,
  Building2,
  Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";

function InstagramIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

import {
  getEvents,
  createEvent,
  cancelEvent,
  registerForEvent,
  cancelEventRegistration,
  getEventParticipants,
  getMyEventRegistrations,
  syncRietWebsiteEvents,
  importManualEvent,
  getPendingReviewEvents,
  reviewEventStatus,
  getInstagramStatus,
  getCalendarEvents
} from "../services/events";
import { getCurrentUser } from "../services/auth";

import Loader from "../components/Loader";
import Modal from "../components/Modal";

export default function Events() {
  const currentUser = getCurrentUser();
  const roles = Array.isArray(currentUser?.role) ? currentUser.role : [currentUser?.role || ""];
  const isAdmin = roles.includes("admin");
  const canCreate = isAdmin || roles.includes("teacher");
  const isStudent = roles.includes("student");

  const [activeTab, setActiveTab] = useState("all_events"); // all_events, official_riet, in_house, calendar, my_registrations, pending_review
  const [loading, setLoading] = useState(true);

  // Event list & filters
  const [events, setEvents] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all"); // all, upcoming, past

  // Instagram status
  const [igStatus, setIgStatus] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manualImportModalOpen, setManualImportModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [participantsList, setParticipantsList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  // Create Form
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Workshop",
    venue: "RIET Campus, Jaipur",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    capacity: 60,
    organizer: "Rajasthan Institute of Engineering & Technology",
    banner_url: "",
  });

  // Manual Import Form (Instagram / Website)
  const [importForm, setImportForm] = useState({
    post_url: "",
    title: "",
    description: "",
    category: "Campus Life",
    source: "instagram",
    banner_url: "",
    venue: "RIET Campus, Jaipur",
    start_date: "",
    organizer: "RIET Official (@riet_official)",
    is_date_unverified: true,
    is_venue_unverified: false,
    notify_students: true,
  });

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [selectedDateStr, setSelectedDateStr] = useState("");

  useEffect(() => {
    fetchData();
    fetchIgStatus();
  }, [activeTab, search, categoryFilter, timeFilter]);

  useEffect(() => {
    if (activeTab === "calendar") {
      fetchCalendarData();
    }
  }, [activeTab, currentMonth, currentYear]);

  const fetchIgStatus = async () => {
    try {
      const st = await getInstagramStatus();
      setIgStatus(st);
    } catch {
      // ignore
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "my_registrations") {
        const regs = await getMyEventRegistrations();
        setMyRegs(regs || []);
      } else if (activeTab === "pending_review") {
        if (isAdmin) {
          const pending = await getPendingReviewEvents();
          setPendingEvents(pending || []);
        }
      } else if (activeTab === "calendar") {
        await fetchCalendarData();
      } else {
        let sourceFilter = "";
        if (activeTab === "official_riet") sourceFilter = "external";
        if (activeTab === "in_house") sourceFilter = "in_house";

        const data = await getEvents(
          search,
          categoryFilter === "all" ? "" : categoryFilter,
          "",
          sourceFilter,
          timeFilter === "all" ? "" : timeFilter
        );
        setEvents(data.events || []);
      }
    } catch {
      toast.error("Failed to load events data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    try {
      const data = await getCalendarEvents(currentMonth + 1, currentYear);
      setCalendarEvents(data || []);
    } catch {
      // ignore
    }
  };

  // Sync RIET Website
  const handleSyncWebsite = async () => {
    try {
      setSyncLoading(true);
      const res = await syncRietWebsiteEvents();
      toast.success(res.message || "RIET official website synchronized!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not sync RIET website");
    } finally {
      setSyncLoading(false);
    }
  };

  // Create In-House Event
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await createEvent({
        ...formData,
        capacity: parseInt(formData.capacity) || 50,
      });
      toast.success("In-house event created and published!");
      setCreateModalOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "Workshop",
        venue: "RIET Campus, Jaipur",
        start_date: "",
        end_date: "",
        registration_deadline: "",
        capacity: 60,
        organizer: "Rajasthan Institute of Engineering & Technology",
        banner_url: "",
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create event");
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Import (Instagram / External)
  const handleManualImportSubmit = async (e) => {
    e.preventDefault();
    if (!importForm.post_url || !importForm.title) {
      toast.error("Post URL and Title are mandatory");
      return;
    }
    try {
      setActionLoading(true);
      const res = await importManualEvent({
        ...importForm,
        start_date: importForm.start_date ? new Date(importForm.start_date).toISOString() : null,
      });
      toast.success(res.message || "Social post imported successfully!");
      setManualImportModalOpen(false);
      setImportForm({
        post_url: "",
        title: "",
        description: "",
        category: "Campus Life",
        source: "instagram",
        banner_url: "",
        venue: "RIET Campus, Jaipur",
        start_date: "",
        organizer: "RIET Official (@riet_official)",
        is_date_unverified: true,
        is_venue_unverified: false,
        notify_students: true,
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Import failed. Check for duplicate URL.");
    } finally {
      setActionLoading(false);
    }
  };

  // Review Event Action
  const handleReviewAction = async (eventId, action) => {
    try {
      setActionLoading(true);
      await reviewEventStatus(eventId, {
        action,
        remarks: action === "approved" ? "Approved by Campus Admin" : "Rejected by Admin",
        notify_students: action === "approved",
      });
      toast.success(`Event ${action} successfully`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Review action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      setActionLoading(true);
      await registerForEvent(eventId);
      toast.success("Event registration pass confirmed!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async (eventId) => {
    if (!window.confirm("Do you want to cancel your event registration?")) return;
    try {
      setActionLoading(true);
      await cancelEventRegistration(eventId);
      toast.success("Registration cancelled");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewParticipants = async (event) => {
    setSelectedEvent(event);
    try {
      const list = await getEventParticipants(event._id);
      setParticipantsList(list || []);
      setParticipantsModalOpen(true);
    } catch {
      toast.error("Failed to load participant list");
    }
  };

  const getCategoryBadge = (cat) => {
    const map = {
      Hackathon: "bg-purple-50 text-purple-700 border-purple-200",
      Seminar: "bg-blue-50 text-blue-700 border-blue-200",
      Workshop: "bg-indigo-50 text-indigo-700 border-indigo-200",
      Sports: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Placement: "bg-amber-50 text-amber-700 border-amber-200",
      Cultural: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return map[cat] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getSourceBadge = (ev) => {
    if (ev.source === "instagram") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white shadow-xs">
          <InstagramIcon size={11} /> Instagram @riet_official
        </span>
      );
    }
    if (ev.source === "riet_website") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Globe size={11} /> RIET Official Portal
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <Building2 size={11} /> In-House Event
      </span>
    );
  };

  // Calendar Helpers
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDateStr(dateStr);
    const matches = calendarEvents.filter((ev) => {
      if (!ev.start_date) return false;
      const d = ev.start_date.split("T")[0];
      return d === dateStr;
    });
    setSelectedDateEvents(matches);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              RIET Campus Events & Updates
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              RIET Jaipur
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Rajasthan Institute of Engineering & Technology official updates, Instagram fests, tech hackathons, webinars, sports leagues & campus placements.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <button
                onClick={handleSyncWebsite}
                disabled={syncLoading}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                title="Sync public events from rietjaipur.ac.in/newsevents"
              >
                <RefreshCw size={14} className={syncLoading ? "animate-spin" : ""} />
                {syncLoading ? "Syncing..." : "Sync RIET Website"}
              </button>

              <button
                onClick={() => setManualImportModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:opacity-90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <InstagramIcon size={14} /> Import Social Post
              </button>
            </>
          )}

          {canCreate && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={15} /> Create In-House Event
            </button>
          )}
        </div>
      </div>

      {/* 2. Official Social Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
            <InstagramIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs tracking-tight">Official Instagram: @riet_official</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official Source
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Verified handle of Rajasthan Institute of Engineering & Technology, Jaipur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://www.instagram.com/riet_official/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1"
          >
            <span>Visit @riet_official</span>
            <ExternalLink size={12} />
          </a>
          <a
            href="https://www.rietjaipur.ac.in/newsevents/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1"
          >
            <Globe size={12} />
            <span>RIET News Portal</span>
          </a>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit text-xs font-bold overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab("all_events")}
          className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap ${
            activeTab === "all_events"
              ? "bg-white text-indigo-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All Campus Events
        </button>

        <button
          onClick={() => setActiveTab("official_riet")}
          className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "official_riet"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Globe size={13} />
          <span>RIET Official (Web & Social)</span>
        </button>

        <button
          onClick={() => setActiveTab("in_house")}
          className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "in_house"
              ? "bg-white text-purple-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 size={13} />
          <span>College In-House</span>
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "calendar"
              ? "bg-white text-indigo-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CalendarIcon size={13} />
          <span>Event Calendar</span>
        </button>

        {isStudent && (
          <button
            onClick={() => setActiveTab("my_registrations")}
            className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "my_registrations"
                ? "bg-white text-emerald-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckCircle size={13} />
            <span>My Registration Passes</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab("pending_review")}
            className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "pending_review"
                ? "bg-white text-amber-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck size={13} />
            <span>Review Queue</span>
            {pendingEvents.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-white font-extrabold">
                {pendingEvents.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB: EVENTS GRID (all_events, official_riet, in_house) */}
      {/* ============================================================== */}
      {["all_events", "official_riet", "in_house"].includes(activeTab) && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-indigo-600 focus-within:bg-white transition">
              <Search size={15} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search event title, venue, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs outline-hidden text-slate-800 bg-transparent placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Seminar">Seminar</option>
                <option value="Workshop">Workshop</option>
                <option value="Sports">Sports</option>
                <option value="Placement">Placement</option>
                <option value="Cultural">Cultural</option>
                <option value="News & Updates">News & Updates</option>
              </select>

              {/* Time Horizon Filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
              >
                <option value="all">All Timelines</option>
                <option value="upcoming">Upcoming Events</option>
                <option value="past">Past / Archived</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <Loader text="Loading RIET campus events..." />
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <CalendarIcon size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No events found</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Try adjusting your search filters or sync the official RIET website.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((ev) => {
                const regPercent = Math.min(
                  100,
                  Math.round(((ev.registered_count || 0) / (ev.capacity || 50)) * 100)
                );
                return (
                  <div
                    key={ev._id}
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Event Banner Image or Themed Gradient */}
                      {ev.banner_url ? (
                        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                          <img
                            src={ev.banner_url}
                            alt={ev.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <div className="absolute top-2.5 left-2.5">
                            {getSourceBadge(ev)}
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 w-full bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 p-3 flex flex-col justify-between text-white relative">
                          <div className="flex items-center justify-between">
                            {getSourceBadge(ev)}
                            <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                              RIET Jaipur
                            </span>
                          </div>
                          <p className="text-xs font-semibold opacity-90 truncate">{ev.category}</p>
                        </div>
                      )}

                      {/* Content Body */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(
                              ev.category
                            )}`}
                          >
                            {ev.category}
                          </span>

                          {/* Unverified Indicators */}
                          <div className="flex items-center gap-1">
                            {ev.is_date_unverified && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                                title="Dates not specified in original posting"
                              >
                                Date Unverified
                              </span>
                            )}
                            {ev.is_venue_unverified && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600"
                                title="Specific hall/room not specified"
                              >
                                Venue TBD
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2">
                            {ev.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                            {ev.description}
                          </p>
                        </div>

                        {/* Event Details Grid */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                          <div className="flex items-center gap-2">
                            <CalendarIcon size={12} className="text-indigo-600 shrink-0" />
                            <span>
                              {ev.start_date
                                ? new Date(ev.start_date).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Check official circular"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-rose-500 shrink-0" />
                            <span className="truncate">{ev.venue || "RIET Campus, Bhankrota, Jaipur"}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Building2 size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate text-slate-500">{ev.organizer || "RIET Administration"}</span>
                          </div>
                        </div>

                        {/* Capacity Progress Bar (for registerable in-house events) */}
                        {ev.capacity > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                              <span>Seats: {ev.registered_count || 0} / {ev.capacity}</span>
                              <span>{regPercent}% booked</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  regPercent > 90 ? "bg-rose-500" : "bg-indigo-600"
                                }`}
                                style={{ width: `${regPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                      {ev.source_url ? (
                        <a
                          href={ev.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
                        >
                          <span>View Original Post</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">RIET Internal</span>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        {canCreate && ev.capacity > 0 && (
                          <button
                            onClick={() => handleViewParticipants(ev)}
                            className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 transition"
                          >
                            Roster ({ev.registered_count || 0})
                          </button>
                        )}

                        {ev.capacity > 0 && (
                          ev.is_registered ? (
                            <button
                              onClick={() => handleCancelRegistration(ev._id)}
                              className="px-3 py-1 rounded-xl text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                            >
                              Cancel Pass
                            </button>
                          ) : ev.is_full ? (
                            <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-400">
                              Full
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRegister(ev._id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition shadow-xs disabled:opacity-50"
                            >
                              Get Pass
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: INTERACTIVE EVENT CALENDAR */}
      {/* ============================================================== */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* Month Header Nav */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    setCurrentMonth(new Date().getMonth());
                    setCurrentYear(new Date().getFullYear());
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 mb-2">
              <span>SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Empty leading days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 bg-slate-50/50 rounded-xl" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = calendarEvents.filter((ev) => {
                  if (!ev.start_date) return false;
                  return ev.start_date.split("T")[0] === dateStr;
                });
                const isSelected = selectedDateStr === dateStr;
                const isToday =
                  new Date().toISOString().split("T")[0] === dateStr;

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => handleDateClick(day)}
                    className={`h-20 p-1.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50"
                        : isToday
                        ? "border-amber-400 bg-amber-50/30"
                        : "border-slate-100 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isToday ? "text-amber-600" : "text-slate-700"
                        }`}
                      >
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </div>

                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev, idx) => (
                        <div
                          key={idx}
                          className="text-[9px] font-semibold truncate bg-indigo-100 text-indigo-800 rounded px-1 py-0.2"
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[8px] text-slate-400 font-bold block">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDateStr && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Events on {new Date(selectedDateStr).toLocaleDateString("en-IN", { dateStyle: "full" })}:
              </h4>
              {selectedDateEvents.length === 0 ? (
                <p className="text-xs text-slate-400">No scheduled events on this day.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedDateEvents.map((ev) => (
                    <div
                      key={ev._id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getCategoryBadge(ev.category)}`}>
                          {ev.category}
                        </span>
                        <h5 className="font-bold text-xs text-slate-900 mt-1">{ev.title}</h5>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin size={11} className="text-rose-500" /> {ev.venue}
                        </p>
                      </div>
                      {ev.source_url && (
                        <a
                          href={ev.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: MY REGISTRATION PASSES */}
      {/* ============================================================== */}
      {activeTab === "my_registrations" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <Loader text="Loading your event tickets..." />
          ) : myRegs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Sparkles size={40} className="mx-auto text-indigo-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No active registrations</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Explore campus hackathons, seminars, and sports meets to register.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">Event</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Venue</th>
                    <th className="py-3 px-4">Event Date</th>
                    <th className="py-3 px-4">Registered On</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRegs.map((reg) => {
                    const ev = reg.event || {};
                    return (
                      <tr key={reg.registration_id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-5">
                          <p className="font-bold text-slate-900">{ev.title || "Campus Event"}</p>
                          <span className="text-[10px] text-slate-400">
                            {ev.organizer || "RIET Jaipur"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(
                              ev.category
                            )}`}
                          >
                            {ev.category || "Event"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                          {ev.venue || "RIET Campus"}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {ev.start_date
                            ? new Date(ev.start_date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "--"}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(reg.registered_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button
                            onClick={() => handleCancelRegistration(reg.event_id)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                          >
                            Cancel Pass
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: ADMIN REVIEW QUEUE */}
      {/* ============================================================== */}
      {activeTab === "pending_review" && isAdmin && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-600" />
              <span>
                <strong>Admin Governance Queue:</strong> Review imported events from Instagram / website before publishing to student notice boards.
              </span>
            </div>
          </div>

          {loading ? (
            <Loader text="Loading pending events..." />
          ) : pendingEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <CheckCircle size={40} className="mx-auto text-emerald-500 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No events pending review</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All external and manual imports have been reviewed and published.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    {getSourceBadge(ev)}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Pending Review
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{ev.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ev.description}</p>
                  </div>

                  {ev.source_url && (
                    <a
                      href={ev.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <span>Check Original Post Link</span>
                      <ExternalLink size={12} />
                    </a>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleReviewAction(ev._id, "rejected")}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReviewAction(ev._id, "approved")}
                      disabled={actionLoading}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1"
                    >
                      <Check size={13} />
                      <span>Approve & Publish</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: MANUAL SOCIAL IMPORT (INSTAGRAM / WEBSITE) */}
      {/* ============================================================== */}
      <Modal
        isOpen={manualImportModalOpen}
        onClose={() => setManualImportModalOpen(false)}
        title="Import Official Social Post (@riet_official)"
      >
        <form onSubmit={handleManualImportSubmit} className="space-y-3.5 text-xs">
          <p className="text-slate-500 text-[11px]">
            Paste the public URL from RIET Official Instagram (<strong className="text-slate-700">@riet_official</strong>) or official website. The system detects duplicates automatically.
          </p>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Public Post URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://www.instagram.com/p/..."
              value={importForm.post_url}
              onChange={(e) => setImportForm({ ...importForm, post_url: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Source Channel *
              </label>
              <select
                value={importForm.source}
                onChange={(e) => setImportForm({ ...importForm, source: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden"
              >
                <option value="instagram">Instagram (@riet_official)</option>
                <option value="riet_website">RIET Official Website</option>
                <option value="manual_social">Other Social Channel</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Category *
              </label>
              <select
                value={importForm.category}
                onChange={(e) => setImportForm({ ...importForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden"
              >
                <option value="Campus Life">Campus Life</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Seminar">Seminar</option>
                <option value="Workshop">Workshop</option>
                <option value="Sports">Sports</option>
                <option value="Cultural">Cultural</option>
                <option value="Placement">Placement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Annual Cultural Fest 'Goonj 2026' Announcement"
              value={importForm.title}
              onChange={(e) => setImportForm({ ...importForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Description / Caption *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Enter details extracted from the Instagram post..."
              value={importForm.description}
              onChange={(e) => setImportForm({ ...importForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Banner / Post Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={importForm.banner_url}
              onChange={(e) => setImportForm({ ...importForm, banner_url: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Venue
              </label>
              <input
                type="text"
                placeholder="RIET Campus, Jaipur"
                value={importForm.venue}
                onChange={(e) => setImportForm({ ...importForm, venue: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Event Date (Optional)
              </label>
              <input
                type="date"
                value={importForm.start_date}
                onChange={(e) => setImportForm({ ...importForm, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Unverified Checkboxes */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={importForm.is_date_unverified}
                onChange={(e) => setImportForm({ ...importForm, is_date_unverified: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span>Mark Date as Unverified (if not explicitly stated in post)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={importForm.notify_students}
                onChange={(e) => setImportForm({ ...importForm, notify_students: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <span className="font-bold text-indigo-700">Broadcast notification to students upon publishing</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setManualImportModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:opacity-95 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50"
            >
              {actionLoading ? "Importing..." : "Import & Publish"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: CREATE IN-HOUSE EVENT */}
      {/* ============================================================== */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Campus Event"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. National Conference on Quantum Computing 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden"
              >
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Placement">Placement</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Seat Capacity *
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Venue *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. APJ Abdul Kalam Auditorium, Block-A"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                End Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Reg. Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.registration_deadline}
                onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Organizing Body *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Department of CSE & Student Innovation Cell"
              value={formData.organizer}
              onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide a comprehensive description of the event..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50"
            >
              {actionLoading ? "Publishing..." : "Publish Event"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: PARTICIPANTS ROSTER */}
      {/* ============================================================== */}
      <Modal
        isOpen={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        title={`Participant Roster - ${selectedEvent?.title || "Event"}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
            <span>
              Total Registered: <strong className="text-slate-900">{participantsList.length}</strong>
            </span>
            <span>
              Capacity: <strong className="text-slate-900">{selectedEvent?.capacity || 0}</strong>
            </span>
          </div>

          {participantsList.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No students registered yet.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
              {participantsList.map((p, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">
                        {p.student_name || `Student #${p.student_id?.slice(-6)}`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.student_email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {p.registered_at ? new Date(p.registered_at).toLocaleDateString() : "--"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
