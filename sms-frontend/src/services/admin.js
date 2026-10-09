import api from "./api";

export const getDashboardStats = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const searchUsers = async (
  page = 1,
  limit = 10,
  search = "",
  role = null,
  department = null,
  semester = null,
  isActive = null
) => {
  const params = { page, limit, search };
  if (role) params.role = role;
  if (department) params.department = department;
  if (semester) params.semester = semester;
  if (isActive !== null && isActive !== undefined) params.is_active = isActive;

  const response = await api.get("/admin/users/search", { params });
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post("/admin/users", userData);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

export const toggleUserStatus = async (userId, isActive) => {
  const response = await api.put(`/admin/users/${userId}/status`, { is_active: isActive });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const downloadImportTemplate = async (format = "csv") => {
  const response = await api.get(`/admin/students/import-template?format=${format}`, {
    responseType: "blob",
  });
  return response.data;
};

export const previewStudentImport = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/admin/students/import-preview", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const commitStudentImport = async (file, skipInvalid = true) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/admin/students/import?skip_invalid=${skipInvalid}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getAllCourses = async () => {
  const response = await api.get("/admin/courses");
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await api.post("/admin/courses", courseData);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await api.delete(`/admin/courses/${courseId}`);
  return response.data;
};

export const assignTeacherToCourse = async (courseId, teacherId) => {
  const response = await api.put(`/admin/courses/${courseId}/assign/${teacherId}`);
  return response.data;
};

export const enrollStudentInCourse = async (courseId, studentId) => {
  const response = await api.put(`/admin/courses/${courseId}/enroll/${studentId}`);
  return response.data;
};

export const getCourseProposals = async (status = null) => {
  const params = status ? { status } : {};
  const response = await api.get("/admin/courses/proposals", { params });
  return response.data;
};

export const reviewCourseProposal = async (proposalId, action, remarks = "") => {
  const response = await api.put(`/admin/courses/proposals/${proposalId}/review`, {
    action,
    remarks,
  });
  return response.data;
};

export const getLeaderboard = async () => {
  const response = await api.get("/admin/leaderboard");
  return response.data;
};

export const getCourseStats = async () => {
  const response = await api.get("/admin/course-stats");
  return response.data;
};

export const getRecentAttendance = async () => {
  const response = await api.get("/admin/recent-attendance");
  return response.data;
};
