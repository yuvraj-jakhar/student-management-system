import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Mail,
  Phone,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

import { getAllUsers, createUser, updateUser, deleteUser, getAllCourses } from "../services/admin";
import { uploadImage } from "../services/auth";
import { getImageUrl } from "../services/api";

import Loader from "../components/Loader";
import Modal from "../components/Modal";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_no: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, coursesData] = await Promise.all([
        getAllUsers(),
        getAllCourses(),
      ]);

      const teacherList = (usersData || []).filter((u) => {
        const roles = Array.isArray(u.role) ? u.role : [u.role];
        return roles.includes("teacher");
      });

      setTeachers(teacherList);
      setCourses(coursesData || []);
    } catch (err) {
      toast.error("Failed to load faculty directory");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone_no: "",
    });
    setSelectedFile(null);
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      let image_url = null;
      if (selectedFile) {
        try {
          const up = await uploadImage(selectedFile);
          image_url = up.image_url;
        } catch {
          console.warn("Image upload failed");
        }
      }

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name || null,
        email: formData.email,
        password: formData.password,
        role: ["teacher"],
        phone_no: formData.phone_no || null,
        image: image_url,
      };

      await createUser(payload);
      toast.success("Faculty member created successfully");
      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create teacher");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      first_name: teacher.first_name || "",
      last_name: teacher.last_name || "",
      email: teacher.email || "",
      password: "",
      phone_no: teacher.phone_no || "",
    });
    setSelectedFile(null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    try {
      setActionLoading(true);
      let image_url = selectedTeacher.image;
      if (selectedFile) {
        try {
          const up = await uploadImage(selectedFile);
          image_url = up.image_url;
        } catch {
          console.warn("Image upload failed");
        }
      }

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name || null,
        phone_no: formData.phone_no || null,
        image: image_url,
      };

      await updateUser(selectedTeacher._id, payload);
      toast.success("Faculty profile updated");
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update teacher");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;
    try {
      setActionLoading(true);
      await deleteUser(selectedTeacher._id);
      toast.success("Faculty member removed");
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete teacher");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const fullName = `${t.first_name || ""} ${t.last_name || ""}`.toLowerCase();
    const email = (t.email || "").toLowerCase();
    const q = search.toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  const getTeacherAssignedCourses = (teacherId) => {
    return courses.filter((c) => c.teacher_id === teacherId);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Faculty Directory
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
              {teachers.length} Instructors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic instructors and course assignments
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs self-start sm:self-auto"
        >
          <Plus size={16} /> Add Faculty Member
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-purple-600 focus-within:bg-white transition">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-hidden text-slate-800 bg-transparent placeholder-slate-400"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <Loader text="Loading faculty members..." />
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users size={40} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No faculty members found</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Add a professor or lecturer to assign teaching curricula.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Instructor</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4">Teaching Load</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => {
                  const avatar = getImageUrl(teacher.image);
                  const assigned = getTeacherAssignedCourses(teacher._id);

                  return (
                    <tr
                      key={teacher._id}
                      className="hover:bg-slate-50/70 transition"
                    >
                      <td className="py-3 px-5 flex items-center gap-3">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                            {teacher.first_name ? teacher.first_name[0] : "T"}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {teacher.first_name} {teacher.last_name || ""}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Professor
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {teacher.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <BookOpen size={11} /> {assigned.length} Course{assigned.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {teacher.phone_no || "--"}
                      </td>
                      <td className="py-3 px-5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition"
                          title="View Profile"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(teacher)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit Record"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove Faculty"
                        >
                          <Trash2 size={15} />
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

      {/* Add Teacher Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Faculty Member"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_no}
                onChange={(e) =>
                  setFormData({ ...formData, phone_no: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Profile Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700"
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
              className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {actionLoading ? "Creating..." : "Save Faculty Member"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Faculty Profile"
      >
        <form onSubmit={handleEditSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone_no}
              onChange={(e) =>
                setFormData({ ...formData, phone_no: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Update Profile Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Faculty Profile"
      >
        {selectedTeacher && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
              {selectedTeacher.image ? (
                <img
                  src={getImageUrl(selectedTeacher.image)}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border border-purple-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-purple-200 text-purple-800 font-extrabold flex items-center justify-center text-xl">
                  {selectedTeacher.first_name ? selectedTeacher.first_name[0] : "T"}
                </div>
              )}
              <div>
                <h4 className="text-base font-bold text-slate-900 leading-tight">
                  {selectedTeacher.first_name} {selectedTeacher.last_name || ""}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{selectedTeacher.email}</p>
                <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  Faculty Instructor
                </span>
              </div>
            </div>

            <div>
              <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Assigned Classes
              </h5>
              {getTeacherAssignedCourses(selectedTeacher._id).length === 0 ? (
                <p className="text-xs text-slate-400">No courses assigned to this instructor.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getTeacherAssignedCourses(selectedTeacher._id).map((c) => (
                    <div
                      key={c._id}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">
                        {c.course_name || c.name} ({c.course_code || c.code || "COURSE"})
                      </span>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {c.student_ids?.length || 0} enrolled
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Remove Faculty Member"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to remove{" "}
            <strong>
              {selectedTeacher?.first_name} {selectedTeacher?.last_name}
            </strong>
            ?
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
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
            >
              {actionLoading ? "Removing..." : "Confirm Removal"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
