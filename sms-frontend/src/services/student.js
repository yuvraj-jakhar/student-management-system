import api from "./api";

export const getStudentProfile = async () => {
  const response = await api.get("/student/profile");
  return response.data;
};

export const getStudentCourses = async () => {
  const response = await api.get("/student/courses");
  return response.data;
};

export const getStudentAttendance = async () => {
  const response = await api.get("/student/attendance");
  return response.data;
};

export const getStudentMarks = async () => {
  const response = await api.get("/student/marks");
  return response.data;
};

export const submitQRScan = async (qrId) => {
  const response = await api.post("/student/scan-qr", {
    qr_id: qrId,
  });
  return response.data;
};
