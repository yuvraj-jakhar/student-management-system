import { useState, useEffect } from "react";
import {
  Calendar,
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
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getEvents,
  createEvent,
  cancelEvent,
  registerForEvent,
  cancelEventRegistration,
  getEventParticipants,
  getMyEventRegistrations,
} from "../services/events";
import { getCurrentUser } from "../services/auth";

import Loader from "../components/Loader";
import Modal from "../components/Modal";

export default function Events() {
  const currentUser = getCurrentUser();
  const roles = Array.isArray(currentUser?.role) ? currentUser.role : [currentUser?.role || ""];
  const canCreate = roles.includes("admin") || roles.includes("teacher");
  const isStudent = roles.includes("student");

  const [activeTab, setActiveTab] = useState("all_events");
  const [loading, setLoading] = useState(true);

  // Event list
  const [events, setEvents] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [participantsList, setParticipantsList] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create Form
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Workshop",
    venue: "",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    capacity: 60,
    organizer: "",
  });

  useEffect(() => {
    if (activeTab === "all_events") {
      fetchEvents();
    } else {
      fetchMyRegistrations();
    }
  }, [activeTab, search, categoryFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents(search, categoryFilter);
      setEvents(data.events || []);
    } catch {
      toast.error("Failed to load campus events");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getMyEventRegistrations();
      setMyRegs(data || []);
    } catch {
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await createEvent({
        ...formData,
        capacity: parseInt(formData.capacity) || 50,
      });
      toast.success("Event published and broadcast to students!");
      setCreateModalOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "Workshop",
        venue: "",
        start_date: "",
        end_date: "",
        registration_deadline: "",
        capacity: 60,
        organizer: "",
      });
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create event");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      setActionLoading(true);
      await registerForEvent(eventId);
      toast.success("You are officially registered for this event!");
      fetchEvents();
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
      if (activeTab === "all_events") fetchEvents();
      else fetchMyRegistrations();
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

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Events & Campus Activities
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              RIET Jaipur
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rajasthan Institute of Engineering & Technology • Festivals, hackathons, seminars, sports & placement drives
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus size={16} /> Create Campus Event
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab("all_events")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "all_events"
              ? "bg-white text-indigo-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All Campus Events
        </button>

        <button
          onClick={() => setActiveTab("my_registrations")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "my_registrations"
              ? "bg-white text-indigo-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          My Registrations
        </button>
      </div>

      {/* TAB 1: ALL CAMPUS EVENTS */}
      {activeTab === "all_events" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-indigo-600 focus-within:bg-white transition">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search event title, venue, or organizer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs outline-hidden text-slate-800 bg-transparent placeholder-slate-400"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden w-full sm:w-auto"
            >
              <option value="">All Categories</option>
              <option value="Hackathon">Hackathon</option>
              <option value="Seminar">Seminar</option>
              <option value="Workshop">Workshop</option>
              <option value="Sports">Sports</option>
              <option value="Placement">Placement</option>
              <option value="Cultural">Cultural</option>
            </select>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <Loader text="Loading college events..." />
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <Calendar size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No events found</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Check back soon or create a new event.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => {
                const regPercent = Math.min(
                  100,
                  Math.round(((ev.registered_count || 0) / (ev.capacity || 50)) * 100)
                );
                return (
                  <div
                    key={ev._id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(
                            ev.category
                          )}`}
                        >
                          {ev.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Organized by {ev.organizer}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {ev.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-indigo-600 shrink-0" />
                          <span>
                            {ev.start_date
                              ? new Date(ev.start_date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "--"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-rose-500 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-amber-500 shrink-0" />
                          <span>
                            Deadline:{" "}
                            {ev.registration_deadline
                              ? new Date(ev.registration_deadline).toLocaleDateString()
                              : "--"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={13} className="text-emerald-500 shrink-0" />
                          <span>
                            {ev.registered_count || 0} / {ev.capacity} Registered
                          </span>
                        </div>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              regPercent > 90 ? "bg-rose-500" : "bg-indigo-600"
                            }`}
                            style={{ width: `${regPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {canCreate && (
                        <button
                          onClick={() => handleViewParticipants(ev)}
                          className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
                        >
                          View Participants ({ev.registered_count || 0})
                        </button>
                      )}

                      <div className="ml-auto flex items-center gap-2">
                        {ev.is_registered ? (
                          <button
                            onClick={() => handleCancelRegistration(ev._id)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                          >
                            Cancel Registration
                          </button>
                        ) : ev.is_full ? (
                          <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400">
                            Capacity Full
                          </span>
                        ) : ev.is_expired ? (
                          <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400">
                            Registration Closed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRegister(ev._id)}
                            disabled={actionLoading}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                          >
                            Register Now
                          </button>
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

      {/* TAB 2: MY REGISTRATIONS */}
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
                            {ev.organizer || "College"}
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
                        <td className="py-3 px-4 text-slate-600">{ev.venue || "--"}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600">
                          {ev.start_date ? new Date(ev.start_date).toLocaleDateString() : "--"}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : "--"}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button
                            onClick={() => handleCancelRegistration(reg.event_id)}
                            className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition"
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

      {/* Modal: Create Event */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create & Broadcast Campus Event"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Smart India Hackathon Campus Qualifier"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              >
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Seminar">Seminar</option>
                <option value="Sports">Sports Meet</option>
                <option value="Placement">Placement Drive</option>
                <option value="Cultural">Cultural Fest</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Participant Capacity *
              </label>
              <input
                type="number"
                min="5"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Venue Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. APJ Abdul Kalam Auditorium"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Organizing Entity *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dept of Computer Science"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-2 py-2 border border-slate-200 rounded-xl text-[11px] outline-hidden focus:border-indigo-600"
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
                className="w-full px-2 py-2 border border-slate-200 rounded-xl text-[11px] outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Reg Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.registration_deadline}
                onChange={(e) =>
                  setFormData({ ...formData, registration_deadline: e.target.value })
                }
                className="w-full px-2 py-2 border border-slate-200 rounded-xl text-[11px] outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Event Description *
            </label>
            <textarea
              rows="3"
              required
              placeholder="Outline event agenda, eligibility, prizes and guidelines..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
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
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {actionLoading ? "Publishing..." : "Publish & Notify Students"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Participants */}
      <Modal
        isOpen={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        title={`Registered Participants: ${selectedEvent?.title || ""}`}
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Total {participantsList.length} registered students for this activity.
          </p>

          <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-xl">
            {participantsList.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                No students registered yet
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Enrollment No</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Reg Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {participantsList.map((p) => (
                    <tr key={p._id}>
                      <td className="py-2 px-3 font-bold text-slate-800">
                        {p.student_name}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {p.student_enrollment || "--"}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{p.student_email}</td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">
                        {p.registered_at ? new Date(p.registered_at).toLocaleDateString() : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setParticipantsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
