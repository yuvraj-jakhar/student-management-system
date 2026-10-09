import api from "./api";

export const getEvents = async (search = "", category = "", statusFilter = "", page = 1, limit = 50) => {
  const params = { search, page, limit };
  if (category) params.category = category;
  if (statusFilter) params.status_filter = statusFilter;
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
