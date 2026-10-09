import api from "./api";

export const getAllNotices = async (params = {}) => {
  const response = await api.get("/notices", { params });
  return response.data;
};

export const createNotice = async (noticeData) => {
  const response = await api.post("/notices", noticeData);
  return response.data;
};

export const deleteNotice = async (noticeId) => {
  const response = await api.delete(`/notices/${noticeId}`);
  return response.data;
};

export const togglePinNotice = async (noticeId) => {
  const response = await api.put(`/notices/${noticeId}/pin`);
  return response.data;
};
