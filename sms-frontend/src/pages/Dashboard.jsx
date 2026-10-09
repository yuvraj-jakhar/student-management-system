import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  PlusCircle,
  QrCode,
  ArrowRight,
  Shield,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
  UserCheck,
  ChevronRight,
  Building2,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";

import { getCurrentUser } from "../services/auth";
import { getDashboardStats, getCourseStats, getRecentAttendance } from "../services/admin";
import { getTeacherCourses, getTeacherPerformance } from "../services/teacher";
import { getStudentCourses, getStudentAttendance, getStudentMarks, submitQRScan } from "../services/student";

import StatCard from "../components/StatCard";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import QRScannerModal from "../components/QRScannerModal";
import CampusNoticesWidget from "../components/CampusNoticesWidget";

export default function Dashboard() {
  const user = getCurrentUser();
  const roles = Array.isArray(user?.role) ? user.role : [user?.role || ""];

  const isAdmin = roles.includes("admin") || roles.includes("can_create_student");
  const isTeacher = roles.includes("teacher");
  const isStudent = roles.includes("student");

  const [loading, setLoading] = useState(true);

  // Admin Data
  const [adminStats, setAdminStats] = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);

  // Teacher Data
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [teacherPerf, setTeacherPerf] = useState(null);

  // Student Data
  const [studentCourses, setStudentCourses] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [studentMarks, setStudentMarks] = useState([]);
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (isAdmin) {
        const [statsData, coursesData, attendanceData] = await Promise.allSettled([
          getDashboardStats(),
          getCourseStats(),
          getRecentAttendance(),
        ]);
        if (statsData.status === "fulfilled") setAdminStats(statsData.value);
        if (coursesData.status === "fulfilled") setCourseStats(coursesData.value);
        if (attendanceData.status === "fulfilled") setRecentAttendance(attendanceData.value);
      } else if (isTeacher) {
        const [coursesData, perfData] = await Promise.allSettled([
          getTeacherCourses(),
          getTeacherPerformance(),
        ]);
        if (coursesData.status === "fulfilled") setTeacherCourses(coursesData.value);
        if (perfData.status === "fulfilled") setTeacherPerf(perfData.value);
      } else if (isStudent) {
        const [coursesData, attData, marksData] = await Promise.allSettled([
          getStudentCourses(),
          getStudentAttendance(),
          getStudentMarks(),
        ]);
        if (coursesData.status === "fulfilled") setStudentCourses(coursesData.value);
        if (attData.status === "fulfilled") setStudentAttendance(attData.value);
        if (marksData.status === "fulfilled") setStudentMarks(marksData.value);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentScanQR = async (e) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) {
      toast.error("Please enter a valid QR Attendance ID");
      return;
    }
    try {
      setScanLoading(true);
      const res = await submitQRScan(qrCodeInput.trim());
      toast.success(res.message || "Attendance recorded successfully!");
      setScanModalOpen(false);
      setQrCodeInput("");
      const updatedAtt = await getStudentAttendance();
      setStudentAttendance(updatedAtt);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired QR code");
    } finally {
      setScanLoading(false);
    }
  };

  const handleCameraScanSuccess = async (scannedToken) => {
    setQrCodeInput(scannedToken);
    try {
      setScanLoading(true);
      const res = await submitQRScan(scannedToken.trim());
      toast.success(res.message || "Attendance recorded successfully! Present verified.");
      setCameraModalOpen(false);
      setScanModalOpen(false);
      setQrCodeInput("");
      const updatedAtt = await getStudentAttendance();
      setStudentAttendance(updatedAtt);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired QR code");
    } finally {
      setScanLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Loading campus analytics..." />;
  }

  // ==========================================
  // 1. ADMIN DASHBOARD VIEW
  // ==========================================
  if (isAdmin) {
    const stats = adminStats?.statistics || {};
    const topStudents = adminStats?.top_students || [];

    return (
      <div className="space-y-6">
        {/* 1. Welcome / Header Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Shield size={12} /> Administrator Portal
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Academic Session 2026–2027
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome, Administrator
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              System health is normal. Overview of faculty assignments, student enrollments, and institution attendance records.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/attendance"
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <QrCode size={15} /> Launch Attendance QR
            </Link>
            <Link
              to="/students"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle size={15} /> Add Student
            </Link>
            <Link
              to="/courses"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <BookOpen size={15} /> Add Course
            </Link>
          </div>
        </div>

        {/* 2. Statistics Cards (Equal Height) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-full">
            <StatCard
              title="Total Students"
              value={stats.students ?? 0}
              icon={GraduationCap}
              color="indigo"
              subtitle="Registered undergraduates"
              trend="Active"
            />
          </div>
          <div className="h-full">
            <StatCard
              title="Faculty Members"
              value={stats.teachers ?? 0}
              icon={Users}
              color="purple"
              subtitle="Teaching professors"
              trend="Assigned"
            />
          </div>
          <div className="h-full">
            <StatCard
              title="Academic Courses"
              value={stats.courses ?? 0}
              icon={BookOpen}
              color="blue"
              subtitle="Registered subjects"
              trend="Active"
            />
          </div>
          <div className="h-full">
            <StatCard
              title="Attendance Rate"
              value={`${stats.attendance_percentage ?? 0}%`}
              icon={CalendarCheck}
              color="emerald"
              subtitle={`${stats.attendance_records ?? 0} sessions verified`}
              trend="Verified"
            />
          </div>
        </div>

        {/* 3. Quick Actions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/students"
              className="p-3 rounded-xl border border-slate-200/70 hover:border-indigo-500 hover:bg-indigo-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 group"
            >
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <GraduationCap size={16} />
              </div>
              <span>Register Student</span>
            </Link>

            <Link
              to="/teachers"
              className="p-3 rounded-xl border border-slate-200/70 hover:border-purple-500 hover:bg-purple-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 group"
            >
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                <Users size={16} />
              </div>
              <span>Faculty Directory</span>
            </Link>

            <Link
              to="/courses"
              className="p-3 rounded-xl border border-slate-200/70 hover:border-blue-500 hover:bg-blue-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 group"
            >
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <BookOpen size={16} />
              </div>
              <span>Manage Courses</span>
            </Link>

            <Link
              to="/attendance"
              className="p-3 rounded-xl border border-slate-200/70 hover:border-emerald-500 hover:bg-emerald-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 group"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <CalendarCheck size={16} />
              </div>
              <span>Attendance Log</span>
            </Link>
          </div>
        </div>

        {/* 4. Recent Activity / Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Recent Attendance Logs
              </h3>
              <p className="text-[11px] text-slate-400">
                Verified attendance check-ins recorded across all classes
              </p>
            </div>
            <Link
              to="/attendance"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {recentAttendance.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No recent attendance records recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">Student Identifier</th>
                    <th className="py-3 px-4">Course Identifier</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttendance.slice(0, 5).map((att) => (
                    <tr key={att._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-5 font-mono text-slate-700 font-semibold">
                        #{att.student_id ? att.student_id.slice(-6) : "N/A"}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        #{att.course_id ? att.course_id.slice(-6) : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {att.date ? new Date(att.date).toLocaleString() : "Recently logged"}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> {att.status || "Present"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. Additional Useful Summary Section: Courses Breakdown & Top Students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Course Enrollment Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Course Enrollment Overview
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Active student counts per registered course
                  </p>
                </div>
                <Link
                  to="/courses"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  View All
                </Link>
              </div>

              {courseStats.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No courses registered yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {courseStats.slice(0, 4).map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">
                          {c.course}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700">
                        {c.students} enrolled
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Total Active Offerings:</span>
              <span className="font-bold text-slate-800">{courseStats.length} Classes</span>
            </div>
          </div>

          {/* Top Students Leaderboard */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Academic Leaderboard
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Highest scoring students across evaluations
                  </p>
                </div>
                <Link
                  to="/marks"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  All Marks
                </Link>
              </div>

              {topStudents.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No graded exam marks entered yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {topStudents.slice(0, 4).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg font-bold text-[10px] flex items-center justify-center text-white ${
                            idx === 0
                              ? "bg-amber-500"
                              : idx === 1
                              ? "bg-slate-400"
                              : "bg-amber-700"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800">
                          Student #{item.student_id ? item.student_id.slice(-6) : "N/A"}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                        {item.marks} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Top Performance Benchmark:</span>
              <span className="font-bold text-amber-600">
                {topStudents[0]?.marks ? `${topStudents[0].marks} / 100` : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* 6. University Notices & Announcements */}
        <CampusNoticesWidget />
      </div>
    );
  }

  // ==========================================
  // 2. TEACHER DASHBOARD VIEW
  // ==========================================
  if (isTeacher) {
    return (
      <div className="space-y-6">
        {/* 1. Welcome / Header Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <BookOpen size={12} /> Faculty Instructor
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                Active Term
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome, Professor
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl">
              Conduct classroom attendance, generate real-time QR code tokens, and grade submitted student examinations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/attendance"
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <QrCode size={15} /> Generate Attendance QR
            </Link>
            <Link
              to="/marks"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Award size={15} /> Grade Marks
            </Link>
          </div>
        </div>

        {/* 2. Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-full">
            <StatCard
              title="Assigned Courses"
              value={teacherCourses.length}
              icon={BookOpen}
              color="purple"
              subtitle="Current semester teaching load"
              trend="Assigned"
            />
          </div>
          <div className="h-full">
            <StatCard
              title="Total Attendance Logged"
              value={teacherPerf?.attendance_records ?? 0}
              icon={CalendarCheck}
              color="emerald"
              subtitle="Institution verified records"
              trend="Logged"
            />
          </div>
          <div className="h-full">
            <StatCard
              title="Marks Records Submitted"
              value={teacherPerf?.marks_records ?? 0}
              icon={Award}
              color="amber"
              subtitle="Graded student assessments"
              trend="Graded"
            />
          </div>
        </div>

        {/* 3. Quick Actions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/attendance"
              className="p-3.5 rounded-xl border border-slate-200/70 hover:border-purple-500 hover:bg-purple-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 group"
            >
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                <QrCode size={16} />
              </div>
              <div>
                <p className="font-bold">Live QR Attendance</p>
                <p className="text-[10px] text-slate-400 font-normal">Generate 25m check-in code</p>
              </div>
            </Link>

            <Link
              to="/marks"
              className="p-3.5 rounded-xl border border-slate-200/70 hover:border-amber-500 hover:bg-amber-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 group"
            >
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
                <Award size={16} />
              </div>
              <div>
                <p className="font-bold">Grade Student Marks</p>
                <p className="text-[10px] text-slate-400 font-normal">Submit exam evaluation</p>
              </div>
            </Link>

            <Link
              to="/courses"
              className="p-3.5 rounded-xl border border-slate-200/70 hover:border-blue-500 hover:bg-blue-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 group"
            >
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <BookOpen size={16} />
              </div>
              <div>
                <p className="font-bold">My Courses Roster</p>
                <p className="text-[10px] text-slate-400 font-normal">View enrolled student lists</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 4. Recent Activity / Data Table (Assigned Courses) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Assigned Teaching Load
              </h3>
              <p className="text-[11px] text-slate-400">
                Classes currently assigned to your instructor profile
              </p>
            </div>
            <Link
              to="/courses"
              className="text-xs font-bold text-purple-600 hover:text-purple-700"
            >
              Full Catalog
            </Link>
          </div>

          {teacherCourses.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No classes currently assigned to your account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">Course Code</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Enrollment Count</th>
                    <th className="py-3 px-5 text-right">Class Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacherCourses.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-5">
                        <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                          {c.course_code || c.code || "COURSE"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {c.course_name || c.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {c.student_ids?.length || 0} students enrolled
                      </td>
                      <td className="py-3 px-5 text-right space-x-2">
                        <Link
                          to="/attendance"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                        >
                          <QrCode size={13} /> QR Token
                        </Link>
                        <Link
                          to="/marks"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                        >
                          <Award size={13} /> Grade
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. Additional Useful Summary Section */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                Live Attendance Ready
              </h4>
              <p className="text-[11px] text-slate-400">
                You can project the 25-minute QR attendance screen in your lecture hall anytime.
              </p>
            </div>
          </div>
          <Link
            to="/attendance"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Launch QR Display
          </Link>
        </div>

        {/* University Notices & Announcements */}
        <CampusNoticesWidget />
      </div>
    );
  }

  // ==========================================
  // 3. STUDENT DASHBOARD VIEW
  // ==========================================
  return (
    <div className="space-y-6">
      {/* 1. Welcome / Header Section */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <GraduationCap size={12} /> Student Portal
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Enrolled Learner
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.email?.split("@")[0]}
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Track your course enrollment, submit lecture QR attendance check-ins, and inspect your grades.
          </p>
        </div>

        <div>
          <button
            onClick={() => setScanModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <QrCode size={16} /> Enter QR Attendance
          </button>
        </div>
      </div>

      {/* 2. Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-full">
          <StatCard
            title="Enrolled Subjects"
            value={studentCourses.length}
            icon={BookOpen}
            color="indigo"
            subtitle="Current semester courses"
            trend="Active"
          />
        </div>
        <div className="h-full">
          <StatCard
            title="Attendance Records"
            value={studentAttendance.length}
            icon={CalendarCheck}
            color="emerald"
            subtitle="Verified class sessions"
            trend="Verified"
          />
        </div>
        <div className="h-full">
          <StatCard
            title="Graded Evaluations"
            value={studentMarks.length}
            icon={Award}
            color="amber"
            subtitle="Exams & assessments graded"
            trend="Evaluated"
          />
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setCameraModalOpen(true)}
            className="p-3.5 rounded-xl border border-slate-200/70 hover:border-emerald-500 hover:bg-emerald-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 text-left group"
          >
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Camera size={16} />
            </div>
            <div>
              <p className="font-bold">Camera Scan</p>
              <p className="text-[10px] text-slate-400 font-normal">Real-time scan</p>
            </div>
          </button>

          <button
            onClick={() => setScanModalOpen(true)}
            className="p-3.5 rounded-xl border border-slate-200/70 hover:border-purple-500 hover:bg-purple-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 text-left group"
          >
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <QrCode size={16} />
            </div>
            <div>
              <p className="font-bold">Token Check-In</p>
              <p className="text-[10px] text-slate-400 font-normal">Manual token entry</p>
            </div>
          </button>

          <Link
            to="/courses"
            className="p-3.5 rounded-xl border border-slate-200/70 hover:border-indigo-500 hover:bg-indigo-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 group"
          >
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="font-bold">My Courses</p>
              <p className="text-[10px] text-slate-400 font-normal">View subjects & faculty</p>
            </div>
          </Link>

          <Link
            to="/marks"
            className="p-3.5 rounded-xl border border-slate-200/70 hover:border-amber-500 hover:bg-amber-50/40 transition flex items-center gap-3 text-xs font-bold text-slate-800 group"
          >
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
              <Award size={16} />
            </div>
            <div>
              <p className="font-bold">Report Card</p>
              <p className="text-[10px] text-slate-400 font-normal">Inspect exam scores</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Recent Activity / Data Table (Student Attendance History) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Personal Attendance History
            </h3>
            <p className="text-[11px] text-slate-400">
              Your latest verified class attendance records
            </p>
          </div>
          <Link
            to="/attendance"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            All Logs
          </Link>
        </div>

        {studentAttendance.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No attendance records recorded yet. Use QR check-in during your lecture.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Verification</th>
                  <th className="py-3 px-4">Course Identifier</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentAttendance.slice(0, 5).map((att) => (
                  <tr key={att._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={13} />
                      </div>
                      <span className="font-semibold text-slate-800">
                        {att.status || "Present"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      #{att.course_id ? att.course_id.slice(-6) : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {att.date ? new Date(att.date).toLocaleString() : "Recently logged"}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Recorded
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Additional Useful Summary Section: Enrolled Courses Cards */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Registered Curricula
            </h3>
            <p className="text-[11px] text-slate-400">
              Classes currently active on your student profile
            </p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Explore
          </Link>
        </div>

        {studentCourses.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            You are not currently enrolled in any courses.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {studentCourses.map((c) => (
              <div
                key={c._id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {c.course_code || c.code || "COURSE"}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 mt-2">
                    {c.course_name || c.name}
                  </h4>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Status:</span>
                  <span className="text-emerald-600 font-bold">Enrolled</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. University Notices & Announcements */}
      <CampusNoticesWidget />

      {/* QR Attendance Modal for Students */}
      <Modal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        title="Check-In Attendance"
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setScanModalOpen(false);
              setCameraModalOpen(true);
            }}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Camera size={16} /> Open Camera Scanner
          </button>

          <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold text-center before:flex-1 before:border-b before:border-slate-200 after:flex-1 after:border-b after:border-slate-200">
            or paste session token
          </div>

          <form onSubmit={handleStudentScanQR} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                QR Code Token *
              </label>
              <input
                type="text"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                placeholder="e.g. 64a70c8a-d9d1-44fd-8995-bc4014f34584"
                required
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-600 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setScanModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={scanLoading}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black disabled:opacity-50"
              >
                {scanLoading ? "Submitting..." : "Confirm Presence"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Real-Time Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />
    </div>
  );
}