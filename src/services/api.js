// Reads VITE_API_URL from .env (or Vercel/Netlify env vars) and strips any trailing slash
const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:8081").replace(/\/+$/, "");
const BASE_URL = `${API_ORIGIN}/api`;

// Reusable helper that handles headers, JWT injection, and errors for every call
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Automatically attach the JWT ID card if the user is logged in
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Safely read either JSON or plain text depending on what Spring Boot sent back
  const contentType = response.headers.get("content-type");
  const data =
    contentType && contentType.includes("application/json")
      ? await response.json()
      : await response.text();

  // Extract the exact message from GlobalExceptionHandler's JSON ApiError (or plain text)
  if (!response.ok) {
    const errorMessage =
      (data && typeof data === "object" && data.message) ||
      (typeof data === "string" && data) ||
      `Request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}

// --- Auth Endpoints ---
export function registerUser({ firstName, middleName, lastName, email, password }) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ firstName, middleName, lastName, email, password }),
  });
}

export function loginUser(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function requestPasswordReset(email) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(email, code, newPassword) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });
}

// --- Course Endpoints ---
export function getAllCourses(termId = null) {
  const query = termId ? `?termId=${termId}` : "";
  return apiRequest(`/courses${query}`, { method: "GET" });
}

export function createCourse(courseData) {
  return apiRequest("/courses", {
    method: "POST",
    body: JSON.stringify(courseData),
  });
}

// --- Enrollment Endpoints ---
export function enrollInCourse(courseId) {
  return apiRequest("/enrollments", {
    method: "POST",
    body: JSON.stringify({ courseId }),
  });
}

export function getMyEnrollments() {
  return apiRequest("/enrollments/my-courses", { method: "GET" });
}

export function dropCourse(enrollmentId) {
  return apiRequest(`/enrollments/${enrollmentId}`, { method: "DELETE" });
}

export function getCourseRoster(courseId) {
  return apiRequest(`/enrollments/course/${courseId}`, { method: "GET" });
}
// --- Session & JWT Helpers ---
export function decodeToken(token) {
  try {
    // A JWT has 3 parts separated by dots: header.payload.signature
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    // Check if the token is expired (JWT exp is in seconds, Date.now() is in milliseconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      return null;
    }

    return {
      email: payload.sub,
      fullName: payload.fullName || "",
      roles: payload.roles || [],
    };
  } catch {
    return null;
  }
}

export function saveSession(loginResponse) {
  // Handles both a plain JWT string or a JSON object like { token: "..." }
  const token = typeof loginResponse === "string" ? loginResponse : loginResponse.token;
  if (!token) return null;

  localStorage.setItem("token", token);
  return decodeToken(token);
}

export function getStoredUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return decodeToken(token);
}

export function logoutUser() {
  localStorage.removeItem("token");
}

export function assignGrade(enrollmentId, grade) {
  return apiRequest(`/enrollments/${enrollmentId}/grade`, {
    method: "PUT",
    body: JSON.stringify({ grade: grade || null }),
  });
}

// --- Public Endpoints (No Login Required) ---
export function getPublicStats() {
  return apiRequest("/public/stats", { method: "GET" });
}

export function getPublicPrograms({ search = "", degreeType = "" } = {}) {
  const params = new URLSearchParams();
  if (search.trim()) params.append("search", search.trim());
  if (degreeType && degreeType !== "All") params.append("degreeType", degreeType);

  const query = params.toString();
  return apiRequest(`/public/programs${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

// --- Admin Governance Endpoints (ROLE_ADMIN) ---
export function getAdminUsers() {
  return apiRequest("/admin/users", { method: "GET" });
}

export function updateUserRoles(userId, roles) {
  return apiRequest(`/admin/users/${userId}/roles`, {
    method: "PATCH",
    body: JSON.stringify({ roles }),
  });
}

export function updateUserStatus(userId, active) {
  return apiRequest(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export function getAuditLogs() {
  return apiRequest("/admin/audit-logs", { method: "GET" });
}
// --- Advisor / Registrar Approval Workflow ---
export function getPendingEnrollments() {
  return apiRequest("/enrollments/pending", { method: "GET" });
}

export function reviewEnrollment(enrollmentId, approve, advisorNote = "") {
  return apiRequest(`/enrollments/${enrollmentId}/review`, {
    method: "PATCH",
    body: JSON.stringify({ approve, advisorNote }),
  });
}

// --- Official Transcript ---
export function getMyTranscript() {
  return apiRequest("/enrollments/transcript", { method: "GET" });
}
// --- Academic Terms & Registration Windows ---
export function getActiveTerm() {
  return apiRequest("/terms/active", { method: "GET" });
}

export function getAllTerms() {
  return apiRequest("/terms", { method: "GET" });
}

export function createAcademicTerm(termData) {
  return apiRequest("/terms", {
    method: "POST",
    body: JSON.stringify(termData),
  });
}

export function updateAcademicTerm(termId, updates) {
  return apiRequest(`/terms/${termId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

