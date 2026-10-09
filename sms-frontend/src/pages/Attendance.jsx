import { useState, useEffect, useMemo } from "react";
import {
  CalendarCheck,
  QrCode,
  CheckCircle2,
  Clock,
  Plus,
  Copy,
  Check,
  Search,
  Camera,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw,
  Sparkles,
  BookOpen,
  Users,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { getCurrentUser } from "../services/auth";
import { getImageUrl } from "../services/api";
import { getRecentAttendance, getAllCourses, getAllUsers } from "../services/admin";
import {
  getTeacherCourses,
  generateQRAttendance,
  markAttendance,
  getTeacherAttendance,
} from "../services/teacher";
import { getStudentAttendance, submitQRScan, getStudentCourses } from "../services/student";

import Loader from "../components/Loader";
import Modal from "../components/Modal";
import QRScannerModal from "../components/QRScannerModal";
import QRProjectorModal from "../components/QRProjectorModal";

export default function Attendance() {
  const user = getCurrentUser();
  const roles = Array.isArray(user?.role) ? user.role : [user?.role || ""];

  const isAdmin = roles.includes("admin") || roles.includes("can_create_student");
  const isTeacher = roles.includes("teacher");
  const isStudent = roles.includes("student");

  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");

  // QR Generator State (Available to Teacher & Admin)
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCourseId, setQrCourseId] = useState("");
  const [activeQR, setActiveQR] = useState(null);
  const [projectorOpen, setProjectorOpen] = useState(false);

  // Student Camera Scanner State
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
  const [studentQrInput, setStudentQrInput] = useState("");

  // Manual Attendance Modal (Teacher & Admin)
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    course_id: "",
    student_id: "",
    date: new Date().toISOString().split("T")[0],
    status: "Present",
  });

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const [att, cList, uList] = await Promise.all([
          getRecentAttendance(),
          getAllCourses(),
          getAllUsers(),
        ]);
        setAttendanceRecords(att || []);
        setCourses(cList || []);
        setStudents((uList || []).filter((u) => u.role?.includes("student")));
      } else if (isTeacher) {
        const [cList, att, uList] = await Promise.all([
          getTeacherCourses(),
          getTeacherAttendance(),
          getAllUsers().catch(() => []),
        ]);
        setCourses(cList || []);
        setAttendanceRecords(att || []);
        setStudents((uList || []).filter((u) => u.role?.includes("student")));
      } else if (isStudent) {
        const [att, cList] = await Promise.all([
          getStudentAttendance(),
          getStudentCourses().catch(() => []),
        ]);
        setAttendanceRecords(att || []);
        setCourses(cList || []);
      }
    } catch (err) {
      toast.error("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  // Launch QR Generator
  const handleGenerateQR = async (e) => {
    e.preventDefault();
    if (!qrCourseId) {
      toast.error("Please select a course for QR generation");
      return;
    }
    try {
      setActionLoading(true);
      const data = await generateQRAttendance(qrCourseId);
      setActiveQR(data);
      setQrModalOpen(false);
      setProjectorOpen(true);
      toast.success("Attendance QR Code Generated! Active for 25 minutes.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate QR Code");
    } finally {
      setActionLoading(false);
    }
  };

  // Regenerate Token in Projector
  const handleRegenerateQR = async () => {
    if (!qrCourseId) return;
    try {
      const data = await generateQRAttendance(qrCourseId);
      setActiveQR(data);
      toast.success("New 25-minute QR Session Token generated!");
    } catch (err) {
      toast.error("Failed to refresh session");
    }
  };

  // Student Scan Verification
  const processAttendanceScan = async (tokenString) => {
    if (!tokenString || !tokenString.trim()) {
      toast.error("Invalid QR Token");
      return;
    }
    try {
      setActionLoading(true);
      const res = await submitQRScan(tokenString.trim());
      toast.success(res.message || "Attendance recorded successfully! Present verified.");
      setStudentQrInput("");
      setCameraScannerOpen(false);
      fetchAttendanceData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid or expired QR code session");
    } finally {
      setActionLoading(false);
    }
  };

  // Student Manual Token Submit
  const handleManualTokenSubmit = (e) => {
    e.preventDefault();
    processAttendanceScan(studentQrInput);
  };

  // Manual Attendance Record Submit (Professor/Admin)
  const handleManualMarkSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await markAttendance({
        course_id: manualForm.course_id,
        student_id: manualForm.student_id,
        date: new Date(manualForm.date).toISOString(),
        status: manualForm.status,
      });
      toast.success("Attendance record saved successfully");
      setManualModalOpen(false);
      fetchAttendanceData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to record attendance");
    } finally {
      setActionLoading(false);
    }
  };

  // Export Attendance CSV
  const exportToCSV = () => {
    if (attendanceRecords.length === 0) {
      toast.error("No attendance data to export");
      return;
    }
    const headers = ["ID", "Student_ID", "Course_ID", "Date", "Status"];
    const rows = filteredRecords.map((r) => [
      r._id || "",
      r.student_id || "N/A",
      r.course_id || "N/A",
      r.date ? new Date(r.date).toLocaleString() : "",
      r.status || "Present",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Apex_University_Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance report exported to CSV");
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(
      (r) => (r.status || "Present").toLowerCase() === "present"
    ).length;
    const todayStr = new Date().toISOString().split("T")[0];
    const todayCount = attendanceRecords.filter((r) =>
      r.date ? r.date.startsWith(todayStr) : false
    ).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    return { total, present, todayCount, rate };
  }, [attendanceRecords]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      const matchCourse =
        selectedCourseFilter === "all" || record.course_id === selectedCourseFilter;
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (record.student_id && record.student_id.toLowerCase().includes(searchLower)) ||
        (record.course_id && record.course_id.toLowerCase().includes(searchLower));

      return matchCourse && matchSearch;
    });
  }, [attendanceRecords, selectedCourseFilter, searchTerm]);

  const selectedCourseObj = courses.find((c) => c._id === qrCourseId);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Classroom Attendance Hub
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isAdmin
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : isTeacher
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {isAdmin ? "Admin Oversight" : isTeacher ? "Faculty Instructor" : "Student Check-in"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {isAdmin || isTeacher
              ? "Broadcast live 25-minute QR codes on classroom smartboards, record excused manual logs, and monitor university compliance."
              : "Point your device camera at the classroom projector to record verified attendance in real time."}
          </p>
        </div>

        {/* Action Controls for Admin & Teacher */}
        {(isAdmin || isTeacher) && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => {
                setActiveQR(null);
                setQrCourseId(courses[0]?._id || "");
                setQrModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <QrCode size={16} /> Launch Smartboard QR
            </button>
            <button
              onClick={() => {
                setManualForm({
                  course_id: courses[0]?._id || "",
                  student_id: students[0]?._id || "",
                  date: new Date().toISOString().split("T")[0],
                  status: "Present",
                });
                setManualModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus size={15} /> Manual Entry
            </button>
          </div>
        )}

        {/* Action Controls for Student */}
        {isStudent && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setCameraScannerOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm animate-pulse"
            >
              <Camera size={16} /> Scan with Camera
            </button>
          </div>
        )}
      </div>

      {/* 2. University KPI Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Sessions</span>
            <CalendarCheck size={18} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.total}</p>
          <span className="text-[10px] text-slate-500 font-medium">Logged in semester</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isStudent ? "Your Attendance" : "Overall Rate"}
            </span>
            <ShieldCheck size={18} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900">{metrics.rate}%</p>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                metrics.rate >= 75
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {metrics.rate >= 75 ? "75%+ Met" : "<75% Low"}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {metrics.rate >= 75 ? "Examination Eligible" : "Academic Warning"}
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Check-ins</span>
            <Clock size={18} className="text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.todayCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">Active sessions today</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monitored Courses</span>
            <BookOpen size={18} className="text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{courses.length}</p>
          <span className="text-[10px] text-slate-500 font-medium">Under active syllabus</span>
        </div>
      </div>

      {/* 3. Student Dedicated Interactive Station */}
      {isStudent && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-lg border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles size={13} /> Official Attendance Verification
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">
                Live Classroom Check-In Station
              </h3>
              <p className="text-slate-300 text-xs max-w-lg leading-relaxed">
                Scan the dynamic 25-minute QR Code on the lecture hall screen using your camera, or enter the session token string below.
              </p>

              {/* 75% Rule Compliance Status */}
              <div className="pt-2 flex items-center gap-3">
                <div className="w-36 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      metrics.rate >= 75 ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, metrics.rate)}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {metrics.rate}% Attendance
                </span>
                {metrics.rate < 75 && (
                  <span className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertTriangle size={13} /> Minimum 75% required for finals
                  </span>
                )}
              </div>
            </div>

            {/* Check-In Controls Box */}
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3 w-full lg:w-auto min-w-[320px]">
              <button
                type="button"
                onClick={() => setCameraScannerOpen(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
              >
                <Camera size={16} /> Open Device Camera Scanner
              </button>

              <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold text-center before:flex-1 before:border-b before:border-slate-700 after:flex-1 after:border-b after:border-slate-700">
                or enter token manually
              </div>

              <form onSubmit={handleManualTokenSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste 36-char Token ID..."
                  value={studentQrInput}
                  onChange={(e) => setStudentQrInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-mono placeholder:text-slate-500 outline-hidden focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !studentQrInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition whitespace-nowrap"
                >
                  {actionLoading ? "Verifying..." : "Confirm"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 4. Attendance Records Table & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by student identifier or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Course */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Filter size={13} className="text-slate-400" />
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="text-xs bg-transparent outline-hidden font-medium text-slate-700"
              >
                <option value="all">All Academic Courses</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.course_name || c.name} ({c.course_code || c.code || "CRS"})
                  </option>
                ))}
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={exportToCSV}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Download size={13} /> Export Report
            </button>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <Loader text="Loading certified attendance log..." />
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CalendarCheck size={44} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No attendance records found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Verified sessions marked via Smartboard QR tokens or manual instructor entries will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Verification</th>
                  {!isStudent && <th className="py-3 px-4">Student ID</th>}
                  <th className="py-3 px-4">Subject & Course</th>
                  <th className="py-3 px-4">Session Timestamp</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-5 text-right">Academic Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => {
                  const courseObj = courses.find((c) => c._id === record.course_id);
                  const isPresent = (record.status || "Present").toLowerCase() === "present";

                  return (
                    <tr key={record._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPresent
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <CheckCircle2 size={12} />
                          {record.status || "Present"}
                        </span>
                      </td>

                      {!isStudent && (
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          #{record.student_id ? record.student_id.slice(-6) : "N/A"}
                        </td>
                      )}

                      <td className="py-3.5 px-4 text-slate-800 font-semibold">
                        {courseObj ? (
                          <div className="flex flex-col">
                            <span>{courseObj.course_name || courseObj.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {courseObj.course_code || courseObj.code || "COURSE"}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400">
                            Course #{record.course_id?.slice(-6) || "N/A"}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {record.date ? new Date(record.date).toLocaleString() : "Recently logged"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-medium border border-purple-200">
                          <QrCode size={11} /> {record.qr_id ? "Smartboard QR" : "Digital Entry"}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                          <ShieldCheck size={13} /> Verified
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Course Selection Modal for QR Code Generation (Admin & Teacher) */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Launch Smartboard QR Attendance Projector"
      >
        <form onSubmit={handleGenerateQR} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Select Course for Session *
            </label>
            <select
              value={qrCourseId}
              onChange={(e) => setQrCourseId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-hidden bg-white focus:border-purple-600 font-medium"
            >
              <option value="">-- Choose Academic Subject --</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.course_name || c.name} ({c.course_code || c.code || "COURSE"})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              A dynamic cryptographic session valid for 25 minutes will be minted.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition shadow-sm"
            >
              {actionLoading ? "Minting Token..." : "Generate Projector Code"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Professional Fullscreen Smartboard Projector Modal */}
      <QRProjectorModal
        isOpen={projectorOpen}
        onClose={() => setProjectorOpen(false)}
        activeQR={activeQR}
        course={selectedCourseObj}
        onRegenerate={handleRegenerateQR}
        attendanceCount={metrics.todayCount}
      />

      {/* 7. Real-Time Camera QR Scanner Modal for Students */}
      <QRScannerModal
        isOpen={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        onScanSuccess={processAttendanceScan}
      />

      {/* 8. Manual Attendance Entry Modal (Admin & Teacher) */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Record Excused or Manual Attendance"
      >
        <form onSubmit={handleManualMarkSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Academic Course *
            </label>
            <select
              value={manualForm.course_id}
              onChange={(e) => setManualForm({ ...manualForm, course_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white focus:border-indigo-600"
            >
              <option value="">-- Choose Course --</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.course_name || c.name} ({c.course_code || c.code || "CRS"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Student *
            </label>
            <select
              value={manualForm.student_id}
              onChange={(e) => setManualForm({ ...manualForm, student_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white focus:border-indigo-600"
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.first_name} {s.last_name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Date *
              </label>
              <input
                type="date"
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Status *
              </label>
              <select
                value={manualForm.status}
                onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden"
              >
                <option value="Present">Present</option>
                <option value="Excused">Excused (Medical)</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
