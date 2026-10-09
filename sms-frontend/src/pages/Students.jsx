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
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  searchUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  downloadImportTemplate,
  previewStudentImport,
  commitStudentImport,
  toggleUserStatus,
} from "../services/admin";
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
  const [deptFilter, setDeptFilter] = useState("");
  const [semFilter, setSemFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_no: "",
    enrollment_no: "",
    department: "Computer Science & Engineering",
    branch: "CSE",
    semester: 1,
    academic_session: "2024-2028",
    dob: "",
    guardian_name: "",
    guardian_phone: "",
    address: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Bulk Import State
  const [importFile, setImportFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [page, search, deptFilter, semFilter, statusFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const isAct = statusFilter === "active" ? true : statusFilter === "inactive" ? false : null;
      const sem = semFilter ? parseInt(semFilter) : null;
      const data = await searchUsers(page, 10, search, "student", deptFilter || null, sem, isAct);
      setUsers(data.users || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      toast.error("Failed to load students directory");
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
      enrollment_no: "",
      department: "Computer Science & Engineering",
      branch: "CSE",
      semester: 1,
      academic_session: "2024-2028",
      dob: "",
      guardian_name: "",
      guardian_phone: "",
      address: "",
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
        ...formData,
        role: ["student"],
        image: image_url,
        is_active: true,
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
      enrollment_no: student.enrollment_no || "",
      department: student.department || "Computer Science & Engineering",
      branch: student.branch || "CSE",
      semester: student.semester || 1,
      academic_session: student.academic_session || "2024-2028",
      dob: student.dob || "",
      guardian_name: student.guardian_name || "",
      guardian_phone: student.guardian_phone || "",
      address: student.address || "",
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
        enrollment_no: formData.enrollment_no || null,
        department: formData.department,
        branch: formData.branch,
        semester: parseInt(formData.semester) || 1,
        academic_session: formData.academic_session,
        dob: formData.dob || null,
        guardian_name: formData.guardian_name || null,
        guardian_phone: formData.guardian_phone || null,
        address: formData.address || null,
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

  const handleToggleStatus = async (student) => {
    const currentStatus = student.is_active !== false;
    const newStatus = !currentStatus;
    try {
      await toggleUserStatus(student._id, newStatus);
      toast.success(`Student ${newStatus ? "activated" : "deactivated"} successfully`);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change status");
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

  // Bulk Import Handlers
  const handleDownloadTemplate = async (format) => {
    try {
      const blob = await downloadImportTemplate(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student_import_template.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Downloaded ${format.toUpperCase()} template`);
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    try {
      setPreviewLoading(true);
      const preview = await previewStudentImport(file);
      setPreviewData(preview);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to preview file");
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importFile) return;
    try {
      setImporting(true);
      const res = await commitStudentImport(importFile, true);
      toast.success(res.message || "Students imported successfully!");
      setImportModalOpen(false);
      setImportFile(null);
      setPreviewData(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Student Records & ERP Profiles
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Student directory, academic session enrollment, CSV/Excel batch onboarding
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                setImportFile(null);
                setPreviewData(null);
                setImportModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <FileSpreadsheet size={15} /> Bulk Import (CSV/Excel)
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Plus size={16} /> Register Student
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-indigo-600 focus-within:bg-white transition">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, email, enrollment ID or branch..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs outline-hidden text-slate-800 bg-transparent placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics">ECE</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
          </select>

          <select
            value={semFilter}
            onChange={(e) => {
              setSemFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
          >
            <option value="">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
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
              {search
                ? "No students match your search criteria."
                : "Register a student or bulk import via CSV/Excel."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Student Name</th>
                  <th className="py-3 px-4">Enrollment No</th>
                  <th className="py-3 px-4">Academic Branch & Sem</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((student) => {
                  const avatar = getImageUrl(student.image);
                  const isActive = student.is_active !== false;
                  return (
                    <tr key={student._id} className="hover:bg-slate-50/70 transition">
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
                          <span className="text-[10px] text-slate-400">
                            {student.academic_session || "2024-2028"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {student.enrollment_no || `#${student._id.slice(-6)}`}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-semibold">{student.branch || "CSE"}</span>
                        <span className="text-slate-400"> • Sem {student.semester || 1}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {student.email}
                      </td>
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <button
                            onClick={() => handleToggleStatus(student)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                            title="Click to toggle status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {isActive ? "Active" : "Deactivated"}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {isActive ? "Active" : "Deactivated"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="View Profile Details"
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

      {/* Modal: Bulk Import */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Bulk Import Students (CSV / Excel)"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-800">Download Template Format</p>
              <p className="text-[11px] text-slate-500">
                Pre-formatted headers for student roster onboarding
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadTemplate("csv")}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5"
              >
                <Download size={13} /> CSV
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate("xlsx")}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
              >
                <Download size={13} /> Excel (.xlsx)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Select Roster File (.csv or .xlsx)
            </label>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileSelect}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {previewLoading && <Loader text="Parsing and validating rows..." />}

          {previewData && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-100">
                  <p className="text-slate-500 text-[10px] font-bold uppercase">Total Rows</p>
                  <p className="text-base font-extrabold text-slate-900">{previewData.total_rows}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-emerald-700 text-[10px] font-bold uppercase">Valid Rows</p>
                  <p className="text-base font-extrabold text-emerald-700">{previewData.valid_rows}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <p className="text-rose-700 text-[10px] font-bold uppercase">Errors / Conflicts</p>
                  <p className="text-base font-extrabold text-rose-700">{previewData.invalid_rows}</p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500">
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Enrollment</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.rows.map((r) => (
                      <tr key={r.row_index} className={r.is_valid ? "bg-white" : "bg-rose-50/40"}>
                        <td className="py-2 px-3 font-mono">#{r.row_index}</td>
                        <td className="py-2 px-3 font-medium">
                          {r.data.first_name} {r.data.last_name || ""}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{r.data.email}</td>
                        <td className="py-2 px-3 font-mono">{r.data.enrollment_no || "--"}</td>
                        <td className="py-2 px-3">
                          {r.is_valid ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Valid
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold" title={r.errors.join(", ")}>
                              {r.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!previewData || previewData.valid_rows === 0 || importing}
              onClick={handleCommitImport}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-xs"
            >
              {importing
                ? "Importing..."
                : `Commit Import (${previewData?.valid_rows || 0} Records)`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add Student */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New Student (ERP Profile)"
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
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Enrollment Number
              </label>
              <input
                type="text"
                placeholder="e.g. 2024BTCS099"
                value={formData.enrollment_no}
                onChange={(e) => setFormData({ ...formData, enrollment_no: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Branch / Dept *
              </label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              >
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
                <option value="EE">EE</option>
                <option value="AIDS">AIDS</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Session
              </label>
              <input
                type="text"
                placeholder="2024-2028"
                value={formData.academic_session}
                onChange={(e) => setFormData({ ...formData, academic_session: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Guardian Name
              </label>
              <input
                type="text"
                value={formData.guardian_name}
                onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Guardian Phone
              </label>
              <input
                type="tel"
                value={formData.guardian_phone}
                onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
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

      {/* Modal: Edit Student */}
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
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Enrollment No
              </label>
              <input
                type="text"
                value={formData.enrollment_no}
                onChange={(e) => setFormData({ ...formData, enrollment_no: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Branch
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_no}
                onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Session
              </label>
              <input
                type="text"
                value={formData.academic_session}
                onChange={(e) => setFormData({ ...formData, academic_session: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
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

      {/* Modal: View Student Details */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Student ERP Profile Card"
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
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedStudent.branch || "CSE"} • Semester {selectedStudent.semester || 1}
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedStudent.is_active !== false
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {selectedStudent.is_active !== false ? "Active" : "Deactivated"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Enrollment Number
                </span>
                <span className="font-mono text-slate-800 font-bold">
                  {selectedStudent.enrollment_no || "Not assigned"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Academic Session
                </span>
                <span className="text-slate-800 font-semibold">
                  {selectedStudent.academic_session || "2024-2028"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Phone Number
                </span>
                <span className="text-slate-800 font-semibold">
                  {selectedStudent.phone_no || "--"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Department
                </span>
                <span className="text-slate-800 font-semibold">
                  {selectedStudent.department || "Engineering"}
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

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Student Record"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to permanently delete student{" "}
            <strong>
              {selectedStudent?.first_name} {selectedStudent?.last_name}
            </strong>
            ? This action cannot be reversed.
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
