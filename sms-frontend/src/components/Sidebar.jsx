import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  User,
  LogOut,
  X,
  ShieldCheck,
  Building2,
  Bell,
} from "lucide-react";
import { getCurrentUser, logoutUser } from "../services/auth";

export default function Sidebar({ isOpen, onClose }) {
  const user = getCurrentUser();
  const roles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
  const primaryRole = roles[0] || "student";

  const navItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      to: "/students",
      icon: GraduationCap,
      label: "Students",
    },
    {
      to: "/teachers",
      icon: Users,
      label: "Teachers",
    },
    {
      to: "/courses",
      icon: BookOpen,
      label: "Courses",
    },
    {
      to: "/attendance",
      icon: CalendarCheck,
      label: "Attendance",
    },
    {
      to: "/marks",
      icon: Award,
      label: "Marks",
    },
    {
      to: "/notices",
      icon: Bell,
      label: "Notice Board",
      badge: "6",
    },
    {
      to: "/profile",
      icon: User,
      label: "Profile",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Fixed Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* University Brand Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Building2 size={20} />
              </div>
              <div className="leading-tight">
                <span className="font-bold text-sm tracking-tight text-white block">
                  CampusPortal
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Student Management
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Core Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs font-bold"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={17}
                        className={
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-slate-200"
                        }
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && !isActive && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer: User Badge + Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 space-y-2">
          {/* User mini info */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase">
              {user?.email ? user.email[0] : "U"}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate leading-snug">
                {user?.email?.split("@")[0] || "User"}
              </p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-400 capitalize font-medium">
                  {primaryRole}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logoutUser}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition border border-transparent hover:border-rose-500/20"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
