import api from "./api";

export const getDashboardStats = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const searchUsers = async (page = 1, limit = 10, search = "") => {
  const response = await api.get("/admin/users/search", {
    params: { page, limit, search },
  });
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

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
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
