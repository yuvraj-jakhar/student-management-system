import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Shield,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  CheckCheck,
} from "lucide-react";
import { getCurrentUser, logoutUser } from "../services/auth";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notifications";

export default function Navbar({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Derive page title & breadcrumb based on URL
  const pageMetaMap = {
    "/dashboard": { title: "Dashboard", sub: "Overview & Analytics" },
    "/students": { title: "Students", sub: "Student Records & Enrollment" },
    "/teachers": { title: "Faculty & Teachers", sub: "Instructors Directory" },
    "/courses": { title: "Course Catalog", sub: "Classes & Curriculum" },
    "/attendance": { title: "Attendance", sub: "Live QR & Verification" },
    "/marks": { title: "Academic Performance", sub: "Grades & Evaluation" },
    "/library": { title: "Central Library", sub: "Catalogue & Circulation" },
    "/events": { title: "Events & Campus Activities", sub: "Festivals & Seminars" },
    "/notices": { title: "RIET Notice Board", sub: "Official Circulars & Announcements" },
    "/profile": { title: "My Profile", sub: "Account & Credentials" },
  };

  const currentMeta = pageMetaMap[location.pathname] || {
    title: "RIET Jaipur ERP",
    sub: "Rajasthan Institute of Engineering & Technology",
  };

  const roles = Array.isArray(user?.role) ? user.role : [user?.role || "user"];
  const primaryRole = roles[0] || "user";

  const fetchNotifs = async () => {
    try {
      const [list, countRes] = await Promise.all([
        getMyNotifications(15),
        getUnreadNotificationCount(),
      ]);
      setNotificationsList(list || []);
      setUnreadCount(countRes.unread_count || 0);
    } catch {
      // Graceful fallback if backend unmounted or token expired
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // 30s live poll
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReadItem = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(notif._id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotificationsList((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, is_read: true } : n))
        );
      } catch (e) {
        console.error(e);
      }
    }
    if (notif.link) {
      setNotificationsOpen(false);
      navigate(notif.link);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Toggle navigation"
          >
            <Menu size={20} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                {currentMeta.title}
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400">
                / {currentMeta.sub}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search (Desktop only) */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
          <div className="w-full relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Quick search ERP..."
              className="w-full pl-9 pr-12 py-1.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs border border-transparent focus:border-indigo-500 rounded-xl outline-hidden transition text-slate-800 placeholder-slate-400"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white">
              Ctrl K
            </span>
          </div>
        </div>

        {/* Right: Actions, Notifications & Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-fade-in max-h-[460px] flex flex-col">
                  <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Campus Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          {unreadCount} Unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <CheckCheck size={12} /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
                    {notificationsList.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No notifications yet
                      </div>
                    ) : (
                      notificationsList.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleReadItem(n)}
                          className={`p-2.5 rounded-xl transition cursor-pointer text-xs border ${
                            !n.is_read
                              ? "bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50"
                              : "bg-white border-transparent hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-800 leading-snug">
                              {n.title}
                            </p>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0">
                              {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] px-1">
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="font-medium text-slate-500 hover:text-slate-800"
                    >
                      Close
                    </button>
                    <Link
                      to="/notices"
                      onClick={() => setNotificationsOpen(false)}
                      className="font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Notice Board &rarr;
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.email ? user.email[0].toUpperCase() : "U"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                  {primaryRole}
                </p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-[11px] text-slate-400">Signed in as</p>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {user?.email}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                      Role: {primaryRole}
                    </span>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User size={15} className="text-slate-400" /> My Profile
                  </Link>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={logoutUser}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
