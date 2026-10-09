import api from "./api";

/**
 * Safely parse a JWT token payload without external libraries.
 */
export const decodeJWT = (token) => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT token:", e);
    return null;
  }
};

/**
 * Authenticate user with email and password
 */
export const loginUser = async (email, password) => {
  const response = await api.post("/login", { email, password });
  const data = response.data;
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
    const decoded = decodeJWT(data.access_token);
    if (decoded) {
      localStorage.setItem("user", JSON.stringify(decoded));
    }
  }
  return data;
};

/**
 * Log out user and clear storage
 */
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
};

/**
 * Get currently stored user object
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = decodeJWT(token);
    if (decoded) {
      localStorage.setItem("user", JSON.stringify(decoded));
      return decoded;
    }
  }
  return null;
};

/**
 * Check if current user has any of the given roles
 */
export const hasRole = (allowedRoles) => {
  const user = getCurrentUser();
  if (!user || !user.role) return false;
  
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return userRoles.some((r) => requiredRoles.includes(r));
};

export const isAdmin = () => hasRole(["admin"]);
export const isTeacher = () => hasRole(["teacher"]);
export const isStudent = () => hasRole(["student"]);

/**
 * Password Recovery
 */
export const forgotPassword = async (email) => {
  const response = await api.post("/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (email, new_password) => {
  const response = await api.put("/reset-password", { email, new_password });
  return response.data;
};

/**
 * Image Upload
 */
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};