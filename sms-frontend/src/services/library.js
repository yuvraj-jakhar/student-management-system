import api from "./api";

export const getBooks = async (search = "", category = "", availableOnly = false, page = 1, limit = 50) => {
  const params = { search, page, limit };
  if (category) params.category = category;
  if (availableOnly) params.available_only = true;
  const response = await api.get("/library/books", { params });
  return response.data;
};

export const getBookDetails = async (bookId) => {
  const response = await api.get(`/library/books/${bookId}`);
  return response.data;
};

export const createBook = async (bookData) => {
  const response = await api.post("/library/books", bookData);
  return response.data;
};

export const updateBook = async (bookId, bookData) => {
  const response = await api.put(`/library/books/${bookId}`, bookData);
  return response.data;
};

export const deactivateBook = async (bookId) => {
  const response = await api.delete(`/library/books/${bookId}`);
  return response.data;
};

export const issueBook = async (issueData) => {
  const response = await api.post("/library/issue", issueData);
  return response.data;
};

export const returnBook = async (returnData) => {
  const response = await api.post("/library/return", returnData);
  return response.data;
};

export const renewBook = async (renewData) => {
  const response = await api.post("/library/renew", renewData);
  return response.data;
};

export const getMyIssuedBooks = async () => {
  const response = await api.get("/library/my-books");
  return response.data;
};

export const getAllIssues = async (statusFilter = null, search = "", page = 1, limit = 50) => {
  const params = { page, limit, search };
  if (statusFilter) params.status_filter = statusFilter;
  const response = await api.get("/library/issues", { params });
  return response.data;
};

export const getOverdueBooks = async () => {
  const response = await api.get("/library/overdue");
  return response.data;
};

export const getLibraryStats = async () => {
  const response = await api.get("/library/stats");
  return response.data;
};
