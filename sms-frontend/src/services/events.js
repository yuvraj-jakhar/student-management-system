import api from "./api";

export const getEvents = async (search = "", category = "", statusFilter = "", sourceFilter = "", timeFilter = "", page = 1, limit = 60) => {
  const params = { search, page, limit };
  if (category) params.category = category;
  if (statusFilter) params.status_filter = statusFilter;
  if (sourceFilter) params.source_filter = sourceFilter;
  if (timeFilter) params.time_filter = timeFilter;
  const response = await api.get("/events", { params });
  return response.data;
};

export const getEventDetails = async (eventId) => {
  const response = await api.get(`/events/${eventId}`);
  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await api.post("/events", eventData);
  return response.data;
};

export const updateEvent = async (eventId, eventData) => {
  const response = await api.put(`/events/${eventId}`, eventData);
  return response.data;
};

export const cancelEvent = async (eventId) => {
  const response = await api.delete(`/events/${eventId}`);
  return response.data;
};

export const registerForEvent = async (eventId) => {
  const response = await api.post(`/events/${eventId}/register`);
  return response.data;
};

export const cancelEventRegistration = async (eventId) => {
  const response = await api.post(`/events/${eventId}/cancel`);
  return response.data;
};

export const getEventParticipants = async (eventId) => {
  const response = await api.get(`/events/${eventId}/participants`);
  return response.data;
};

export const getMyEventRegistrations = async () => {
  const response = await api.get("/events/my-registrations");
  return response.data;
};

export const syncRietWebsiteEvents = async () => {
  const response = await api.post("/events/import/sync-riet-website");
  return response.data;
};

export const importManualEvent = async (data) => {
  const response = await api.post("/events/import/manual", data);
  return response.data;
};

export const getPendingReviewEvents = async () => {
  const response = await api.get("/events/admin/pending-review");
  return response.data;
};

export const reviewEventStatus = async (eventId, data) => {
  const response = await api.put(`/events/${eventId}/review`, data);
  return response.data;
};

export const getInstagramStatus = async () => {
  const response = await api.get("/events/instagram/status");
  return response.data;
};

export const getCalendarEvents = async (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  const response = await api.get("/events/calendar", { params });
  return response.data;
};

