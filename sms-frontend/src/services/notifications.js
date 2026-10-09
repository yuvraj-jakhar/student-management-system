import api from "./api";

export const getMyNotifications = async (limit = 30) => {
  const response = await api.get("/notifications", { params: { limit } });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.put("/notifications/mark-all-read");
  return response.data;
};

export const createBroadcastNotification = async (notifData) => {
  const response = await api.post("/notifications", notifData);
  return response.data;
};
