import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  Search,
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
} from "../services/admin";
import { getTeacherCourses } from "../services/teacher";
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
  }, []);

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
              {isAdmin ? "Course Catalog" : "My Classes"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
              {filteredCourses.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? "Manage academic curricula, assign faculty, and oversee student enrollments"
              : "Registered subjects and classes for your academic term"}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setCourseForm({ name: "", code: "", teacher_id: "" });
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs self-start sm:self-auto"
          >
            <Plus size={16} /> Create New Course
          </button>
        )}
      </div>

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

      {/* Course Cards Grid (Equal Height Guaranteed) */}
      {loading ? (
        <Loader text="Loading courses catalog..." />
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
          <BookOpen size={40} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No courses found</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAdmin
              ? "Click 'Create New Course' to establish your curriculum."
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
    </div>
  );
}
