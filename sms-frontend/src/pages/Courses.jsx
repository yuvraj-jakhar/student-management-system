import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  Search,
  Sparkles,
  CheckCheck,
  XCircle,
  Clock,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";

import { getCurrentUser } from "../services/auth";
import {
  getAllCourses,
  createCourse,
  deleteCourse,
  assignTeacherToCourse,
  enrollStudentInCourse,
  getAllUsers,
  getCourseProposals,
  reviewCourseProposal,
} from "../services/admin";
import {
  getTeacherCourses,
  proposeCourse,
  getMyProposals,
} from "../services/teacher";
import { getStudentCourses } from "../services/student";

import Loader from "../components/Loader";
import Modal from "../components/Modal";

export default function Courses() {
  const user = getCurrentUser();
  const roles = Array.isArray(user?.role) ? user.role : [user?.role || ""];

  const isAdmin = roles.includes("admin") || roles.includes("can_create_student");
  const isTeacher = roles.includes("teacher");
  const isStudent = roles.includes("student");

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Proposals State
  const [activeTab, setActiveTab] = useState("courses"); // "courses" | "proposals"
  const [proposals, setProposals] = useState([]);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    name: "",
    code: "",
    department: "Computer Science & Engineering",
    semester: 3,
    credits: 4,
    description: "",
    syllabus: "",
  });

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentsListModalOpen, setStudentsListModalOpen] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // New Course Form State
  const [courseForm, setCourseForm] = useState({
    name: "",
    code: "",
    teacher_id: "",
  });

  useEffect(() => {
    fetchCourses();
    if (isAdmin || isTeacher) {
      fetchProposals();
    }
  }, [activeTab]);

  const fetchProposals = async () => {
    try {
      if (isAdmin) {
        const data = await getCourseProposals();
        setProposals(data || []);
      } else if (isTeacher) {
        const data = await getMyProposals();
        setProposals(data || []);
      }
    } catch {
      // non-blocking
    }
  };

  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await proposeCourse({
        ...proposalForm,
        semester: parseInt(proposalForm.semester) || 1,
        credits: parseInt(proposalForm.credits) || 4,
      });
      toast.success("Course proposal submitted to University Academic Council!");
      setProposeModalOpen(false);
      setProposalForm({
        name: "",
        code: "",
        department: "Computer Science & Engineering",
        semester: 3,
        credits: 4,
        description: "",
        syllabus: "",
      });
      fetchProposals();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Proposal submission failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewProposal = async (proposalId, action) => {
    try {
      setActionLoading(true);
      await reviewCourseProposal(proposalId, action, `Reviewed by Academic Admin`);
      toast.success(`Proposal ${action} successfully`);
      fetchProposals();
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Review failed");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);

      if (isAdmin) {
        const [coursesData, usersData] = await Promise.all([
          getAllCourses(),
          getAllUsers(),
        ]);
        setCourses(coursesData || []);

        const teacherList = (usersData || []).filter((u) => {
          const r = Array.isArray(u.role) ? u.role : [u.role];
          return r.includes("teacher");
        });
        const studentList = (usersData || []).filter((u) => {
          const r = Array.isArray(u.role) ? u.role : [u.role];
          return r.includes("student");
        });

        setTeachers(teacherList);
        setStudents(studentList);
      } else if (isTeacher) {
        const data = await getTeacherCourses();
        setCourses(data || []);
      } else if (isStudent) {
        const data = await getStudentCourses();
        setCourses(data || []);
      }
    } catch (err) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await createCourse({
        course_name: courseForm.name,
        course_code: courseForm.code,
        name: courseForm.name,
        code: courseForm.code,
        teacher_id: courseForm.teacher_id || null,
        student_ids: [],
      });
      toast.success("Course created successfully");
      setCreateModalOpen(false);
      setCourseForm({ name: "", code: "", teacher_id: "" });
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create course");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !selectedTeacherId) return;
    try {
      setActionLoading(true);
      await assignTeacherToCourse(selectedCourse._id, selectedTeacherId);
      toast.success("Instructor assigned to course");
      setAssignModalOpen(false);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to assign teacher");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !selectedStudentId) return;
    try {
      setActionLoading(true);
      await enrollStudentInCourse(selectedCourse._id, selectedStudentId);
      toast.success("Student enrolled in course");
      setEnrollModalOpen(false);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to enroll student");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    try {
      setActionLoading(true);
      await deleteCourse(selectedCourse._id);
      toast.success("Course deleted successfully");
      setDeleteModalOpen(false);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete course");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const name = (c.course_name || c.name || "").toLowerCase();
    const code = (c.course_code || c.code || "").toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const getTeacherName = (teacherId) => {
    if (!teacherId) return "Unassigned";
    const found = teachers.find((t) => t._id === teacherId);
    return found ? `${found.first_name} ${found.last_name || ""}` : `Teacher #${teacherId.slice(-4)}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {isAdmin ? "Course Catalog & Curricula" : "Faculty & Class Allocations"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              {filteredCourses.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? "Manage academic curricula, assign faculty, and review course proposals"
              : "Assigned subjects, syllabus guidelines, and course proposal workflows"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isTeacher && (
            <button
              onClick={() => setProposeModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Sparkles size={16} /> Propose New Course
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setCourseForm({ name: "", code: "", teacher_id: "" });
                setCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Plus size={16} /> Create New Course
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher for Admin & Teachers */}
      {(isAdmin || isTeacher) && (
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold">
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === "courses"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab("proposals")}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === "proposals"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {isAdmin ? `Approval Queue (${proposals.length})` : `My Proposals (${proposals.length})`}
          </button>
        </div>
      )}

      {/* PROPOSALS TABLE VIEW */}
      {activeTab === "proposals" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {proposals.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Sparkles size={40} className="mx-auto text-indigo-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No course proposals submitted</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Faculty members can propose new elective or departmental courses for administration approval.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">Course Proposal</th>
                    <th className="py-3 px-4">Department & Sem</th>
                    <th className="py-3 px-4">Proposing Faculty</th>
                    <th className="py-3 px-4">Credits</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposals.map((prop) => (
                    <tr key={prop._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-5">
                        <p className="font-bold text-slate-900">{prop.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Code: {prop.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-700">{prop.department}</p>
                        <span className="text-[10px] text-slate-400">Semester {prop.semester}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {prop.teacher_name || "Faculty Member"}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {prop.credits || 4} Credits
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            prop.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : prop.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {prop.status ? prop.status.toUpperCase() : "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right space-x-1">
                        {isAdmin && prop.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleReviewProposal(prop._id, "approved")}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewProposal(prop._id, "rejected")}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition border border-rose-200 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {prop.status !== "pending" && (
                          <span className="text-[11px] text-slate-400 font-medium">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE COURSES VIEW */}
      {activeTab === "courses" && (
        <>
          {/* Search Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-blue-600 focus-within:bg-white transition">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search courses by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs outline-hidden text-slate-800 bg-transparent placeholder-slate-400"
              />
            </div>
          </div>

          {/* Course Cards Grid */}
          {loading ? (
            <Loader text="Loading courses catalog..." />
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
              <BookOpen size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No courses found</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAdmin
                  ? "Click 'Create New Course' or approve faculty proposals."
                  : "No classes enrolled at this moment."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => {
            const studentCount = course.student_ids?.length || 0;
            return (
              <div
                key={course._id}
                className="h-full bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      {course.course_code || course.code || "COURSE"}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setStudentsListModalOpen(true);
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition"
                    >
                      <Users size={13} /> {studentCount} Enrolled
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-3">
                    {course.course_name || course.name}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Instructor:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                        {getTeacherName(course.teacher_id)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Course ID:</span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        #{course._id.slice(-6)}
                      </span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setSelectedTeacherId(course.teacher_id || "");
                        setAssignModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition flex items-center gap-1"
                      title="Assign Instructor"
                    >
                      <UserCheck size={13} /> Instructor
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setSelectedStudentId("");
                        setEnrollModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1"
                      title="Enroll Student"
                    >
                      <UserPlus size={13} /> Enroll
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Course"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  )}

      {/* Create Course Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Academic Course"
      >
        <form onSubmit={handleCreateCourse} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Operating Systems"
              value={courseForm.name}
              onChange={(e) =>
                setCourseForm({ ...courseForm, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Course Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CS401"
              value={courseForm.code}
              onChange={(e) =>
                setCourseForm({ ...courseForm, code: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Assign Instructor (Optional)
            </label>
            <select
              value={courseForm.teacher_id}
              onChange={(e) =>
                setCourseForm({ ...courseForm, teacher_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white focus:border-blue-600"
            >
              <option value="">-- Choose Instructor --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.first_name} {t.last_name} ({t.email})
                </option>
              ))}
            </select>
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
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : "Save Course"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Instructor: ${selectedCourse?.course_name || selectedCourse?.name}`}
      >
        <form onSubmit={handleAssignTeacher} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Select Faculty Member *
            </label>
            <select
              required
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden bg-white focus:border-purple-600"
            >
              <option value="">-- Select Instructor --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.first_name} {t.last_name} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {actionLoading ? "Assigning..." : "Confirm Assignment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title={`Enroll Student: ${selectedCourse?.course_name || selectedCourse?.name}`}
      >
        <form onSubmit={handleEnrollStudent} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Select Student *
            </label>
            <select
              required
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
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

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEnrollModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {actionLoading ? "Enrolling..." : "Enroll Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enrolled Students Roster Modal */}
      <Modal
        isOpen={studentsListModalOpen}
        onClose={() => setStudentsListModalOpen(false)}
        title={`Enrolled Students: ${selectedCourse?.course_name || selectedCourse?.name}`}
      >
        <div className="space-y-3">
          {selectedCourse?.student_ids?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No students are currently enrolled in this class.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {selectedCourse?.student_ids?.map((sid, idx) => {
                const sObj = students.find((s) => s._id === sid);
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800">
                      {sObj ? `${sObj.first_name} ${sObj.last_name || ""}` : `Student ID: ${sid}`}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {sObj?.email || sid.slice(-6)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={() => setStudentsListModalOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Course Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Course"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to delete course{" "}
            <strong>{selectedCourse?.course_name || selectedCourse?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteCourse}
              disabled={actionLoading}
              className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
            >
              {actionLoading ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Faculty Course Proposal Modal */}
      <Modal
        isOpen={proposeModalOpen}
        onClose={() => setProposeModalOpen(false)}
        title="Propose New Course to Academic Council"
      >
        <form onSubmit={handleProposeSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Deep Learning & Neural Networks"
              value={proposalForm.name}
              onChange={(e) => setProposalForm({ ...proposalForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS-409"
                value={proposalForm.code}
                onChange={(e) => setProposalForm({ ...proposalForm, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Department *
              </label>
              <select
                value={proposalForm.department}
                onChange={(e) => setProposalForm({ ...proposalForm, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              >
                <option value="Computer Science & Engineering">Computer Science</option>
                <option value="Electronics & Communication">ECE</option>
                <option value="Mechanical Engineering">Mechanical</option>
                <option value="Civil Engineering">Civil</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Target Semester *
              </label>
              <select
                value={proposalForm.semester}
                onChange={(e) => setProposalForm({ ...proposalForm, semester: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Credit Hours *
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={proposalForm.credits}
                onChange={(e) => setProposalForm({ ...proposalForm, credits: parseInt(e.target.value) || 4 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Course Description & Objectives *
            </label>
            <textarea
              rows="3"
              required
              placeholder="Outline course objectives, prerequisites, and evaluation scheme..."
              value={proposalForm.description}
              onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setProposeModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              <Send size={13} /> {actionLoading ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
