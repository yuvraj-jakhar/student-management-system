import api from "./api";

export const getTeacherCourses = async () => {
  const response = await api.get("/teacher/courses");
  return response.data;
};

export const markAttendance = async (attendanceData) => {
  const response = await api.post("/teacher/attendance", attendanceData);
  return response.data;
};

export const getTeacherAttendance = async () => {
  const response = await api.get("/teacher/attendance");
  return response.data;
};

export const addMarks = async (marksData) => {
  const response = await api.post("/teacher/marks", marksData);
  return response.data;
};

export const getTeacherMarks = async () => {
  const response = await api.get("/teacher/marks");
  return response.data;
};

export const getTeacherPerformance = async () => {
  const response = await api.get("/teacher/performance");
  return response.data;
};

export const generateQRAttendance = async (courseId) => {
  const response = await api.post("/teacher/generate-qr", {
    course_id: courseId,
  });
  return response.data;
};
