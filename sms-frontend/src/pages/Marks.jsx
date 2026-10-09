import { useState, useEffect } from "react";
import {
  Award,
  Plus,
  Trophy,
  Search,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

import { getCurrentUser } from "../services/auth";
import { getLeaderboard, getAllCourses, getAllUsers } from "../services/admin";
import {
  getTeacherCourses,
  addMarks,
  getTeacherMarks,
} from "../services/teacher";
import { getStudentMarks, getStudentCourses } from "../services/student";

import Loader from "../components/Loader";
import Modal from "../components/Modal";

export default function Marks() {
  const user = getCurrentUser();
  const roles = Array.isArray(user?.role) ? user.role : [user?.role || ""];

  const isAdmin = roles.includes("admin") || roles.includes("can_create_student");
  const isTeacher = roles.includes("teacher");
  const isStudent = roles.includes("student");

  const [loading, setLoading] = useState(true);
  const [marksList, setMarksList] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  // Add Marks Modal (Teacher)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [marksForm, setMarksForm] = useState({
    course_id: "",
    student_id: "",
    marks: "",
  });

  useEffect(() => {
    fetchMarksData();
  }, []);

  const fetchMarksData = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const [lb, cList, uList] = await Promise.all([
          getLeaderboard(),
          getAllCourses(),
          getAllUsers(),
        ]);
        setLeaderboard(lb || []);
        setCourses(cList || []);
        setStudents((uList || []).filter((u) => u.role?.includes("student")));
      } else if (isTeacher) {
        const [mList, cList, uList] = await Promise.all([
          getTeacherMarks(),
          getTeacherCourses(),
          getAllUsers().catch(() => []),
        ]);
        setMarksList(mList || []);
        setCourses(cList || []);
        setStudents((uList || []).filter((u) => u.role?.includes("student")));
      } else if (isStudent) {
        const [mList, cList] = await Promise.all([
          getStudentMarks(),
          getStudentCourses(),
        ]);
        setMarksList(mList || []);
        setCourses(cList || []);
      }
    } catch (err) {
      toast.error("Failed to load academic evaluations");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMarks = async (e) => {
    e.preventDefault();
    if (!marksForm.course_id || !marksForm.student_id || !marksForm.marks) {
      toast.error("Please fill all required marks fields");
      return;
    }

    try {
      setActionLoading(true);
      await addMarks({
        course_id: marksForm.course_id,
        student_id: marksForm.student_id,
        marks: parseFloat(marksForm.marks),
      });
      toast.success("Marks recorded successfully");
      setAddModalOpen(false);
      setMarksForm({ course_id: "", student_id: "", marks: "" });
      fetchMarksData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to record student marks");
    } finally {
      setActionLoading(false);
    }
  };

  const getCourseName = (courseId) => {
    const found = courses.find((c) => c._id === courseId);
    return found
      ? `${found.course_name || found.name} (${found.course_code || found.code || "COURSE"})`
      : `Course #${courseId?.slice(-6) || "N/A"}`;
  };

  const getStudentName = (studentId) => {
    const found = students.find((s) => s._id === studentId);
    return found ? `${found.first_name} ${found.last_name || ""}` : `Student #${studentId?.slice(-6) || "N/A"}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Academic Grading & Evaluations
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
              Evaluations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTeacher
              ? "Submit official student exam scores and grade performance"
              : isStudent
              ? "Review your personal subject evaluation scores and grade performance"
              : "Official university leaderboard and academic evaluation scores"}
          </p>
        </div>

        {isTeacher && (
          <button
            onClick={() => {
              setMarksForm({
                course_id: courses[0]?._id || "",
                student_id: students[0]?._id || "",
                marks: "",
              });
              setAddModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs self-start sm:self-auto"
          >
            <Plus size={16} /> Enter Student Marks
          </button>
        )}
      </div>

      {/* Admin Leaderboard View */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Dean's List & Student Leaderboard
              </h3>
              <p className="text-[11px] text-slate-400">
                Top academic performers across all active course evaluations
              </p>
            </div>
          </div>

          {loading ? (
            <Loader text="Loading leaderboard..." />
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No examination marks entered into the system yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {leaderboard.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                        idx === 0
                          ? "bg-amber-400 text-white shadow-xs"
                          : idx === 1
                          ? "bg-slate-300 text-slate-800"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {getStudentName(item.student_id)}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {getCourseName(item.course_id)}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-extrabold rounded-lg">
                    {item.marks} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Graded Evaluations Table (Teacher & Student) */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">
                {isStudent ? "Official Academic Report" : "Graded Assessments"} ({marksList.length})
              </h3>
            </div>
          </div>

          {loading ? (
            <Loader text="Loading marks records..." />
          ) : marksList.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Award size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No marks entered</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTeacher
                  ? "Click 'Enter Student Marks' to submit student evaluation scores."
                  : "No marks records published yet for your profile."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">Subject</th>
                    {isTeacher && <th className="py-3 px-4">Student</th>}
                    <th className="py-3 px-4">Exam Score</th>
                    <th className="py-3 px-4">Academic Grade</th>
                    <th className="py-3 px-5 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marksList.map((m) => {
                    const score = parseFloat(m.marks);
                    const grade =
                      score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : "D";

                    return (
                      <tr key={m._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-5 font-bold text-slate-900">
                          {getCourseName(m.course_id)}
                        </td>
                        {isTeacher && (
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {getStudentName(m.student_id)}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span className="font-mono font-extrabold text-slate-800 text-xs">
                            {m.marks} / 100
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                            Grade {grade}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <span className="text-[11px] font-bold text-emerald-600">
                            Published
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
      )}

      {/* Add Marks Modal for Faculty */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Submit Academic Marks"
      >
        <form onSubmit={handleAddMarks} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Course Subject *
            </label>
            <select
              value={marksForm.course_id}
              onChange={(e) =>
                setMarksForm({ ...marksForm, course_id: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
            >
              <option value="">-- Choose Course --</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.course_name || c.name} ({c.course_code || c.code || "COURSE"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Select Student *
            </label>
            <select
              value={marksForm.student_id}
              onChange={(e) =>
                setMarksForm({ ...marksForm, student_id: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white"
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.first_name} {s.last_name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Numerical Score (0 - 100) *
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              required
              placeholder="e.g. 92.5"
              value={marksForm.marks}
              onChange={(e) =>
                setMarksForm({ ...marksForm, marks: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 disabled:opacity-50"
            >
              {actionLoading ? "Submitting..." : "Publish Score"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
