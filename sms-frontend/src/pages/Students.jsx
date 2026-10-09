import { useState, useEffect } from "react";
import {
  GraduationCap,
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

import { searchUsers, createUser, updateUser, deleteUser, getAllUsers } from "../services/admin";
import { uploadImage, getCurrentUser } from "../services/auth";
import { getImageUrl } from "../services/api";

import Loader from "../components/Loader";
import Modal from "../components/Modal";

export default function Students() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role?.includes("admin") || currentUser?.role?.includes("can_create_student");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
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
    fetchStudents();
  }, [page, search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await searchUsers(page, 10, search);
      const studentList = (data.users || []).filter((u) => {
        const roles = Array.isArray(u.role) ? u.role : [u.role];
        return roles.includes("student");
      });
      setUsers(studentList);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || studentList.length);
    } catch (err) {
      try {
        const all = await getAllUsers();
        const studentList = all.filter((u) => {
          const roles = Array.isArray(u.role) ? u.role : [u.role];
          return roles.includes("student");
        });
        setUsers(studentList);
        setTotalCount(studentList.length);
      } catch (e) {
        toast.error("Failed to load students directory");
      }
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
        role: ["student"],
        phone_no: formData.phone_no || null,
        image: image_url,
      };

      await createUser(payload);
      toast.success("Student registered successfully");
      setCreateModalOpen(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create student");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      email: student.email || "",
      password: "",
      phone_no: student.phone_no || "",
    });
    setSelectedFile(null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      setActionLoading(true);
      let image_url = selectedStudent.image;
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

      await updateUser(selectedStudent._id, payload);
      toast.success("Student record updated");
      setEditModalOpen(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update student");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    try {
      setActionLoading(true);
      await deleteUser(selectedStudent._id);
      toast.success("Student deleted successfully");
      setDeleteModalOpen(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete student");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Student Records
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student registrations, academic identifiers, and profile details
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs self-start sm:self-auto"
          >
            <Plus size={16} /> Register Student
          </button>
        )}
      </div>

      {/* Search and Action Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-indigo-600 focus-within:bg-white transition">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, email or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs outline-hidden text-slate-800 bg-transparent placeholder-slate-400"
          />
        </div>
      </div>

      {/* Clean Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <Loader text="Loading student records..." />
        ) : users.length === 0 ? (
          <div className="text-center py-16 px-4">
            <GraduationCap size={40} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No students found</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {search ? "No students match your search query." : "Register a student to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Student Name</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Enrollment Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((student) => {
                  const avatar = getImageUrl(student.image);
                  return (
                    <tr
                      key={student._id}
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
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {student.first_name ? student.first_name[0] : "S"}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {student.first_name} {student.last_name || ""}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Undergraduate
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                        #{student._id ? student._id.slice(-6) : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {student.email}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {student.phone_no || "--"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(student)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Edit Record"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudent(student);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Record"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Clean Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-xs">
            <span className="text-slate-500">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New Student"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
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
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
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
              {actionLoading ? "Saving..." : "Create Student Record"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Student Record"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
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
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
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
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
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
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {actionLoading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Student Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Student Profile Card"
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              {selectedStudent.image ? (
                <img
                  src={getImageUrl(selectedStudent.image)}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xl">
                  {selectedStudent.first_name ? selectedStudent.first_name[0] : "S"}
                </div>
              )}
              <div>
                <h4 className="text-base font-bold text-slate-900 leading-tight">
                  {selectedStudent.first_name} {selectedStudent.last_name || ""}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{selectedStudent.email}</p>
                <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Enrolled Student
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Database Identifier
                </span>
                <span className="font-mono text-slate-800 break-all">
                  {selectedStudent._id}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Phone Number
                </span>
                <span className="text-slate-800 font-semibold">
                  {selectedStudent.phone_no || "Not provided"}
                </span>
              </div>
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
        title="Delete Student Record"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to delete student{" "}
            <strong>
              {selectedStudent?.first_name} {selectedStudent?.last_name}
            </strong>
            ? This action permanently removes their records.
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
              {actionLoading ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
