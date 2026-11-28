// Reads VITE_API_URL from .env (or Vercel/Netlify env vars) and strips any trailing slash
// Reads VITE_API_URL from .env (or Docker build args) without duplicating /api
const RAW_API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8081").replace(/\/+$/, "");
const BASE_URL = RAW_API_URL.endsWith("/api") ? RAW_API_URL : `${RAW_API_URL}/api`;

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

export function getMyTeachingCourses() {
  return apiRequest("/courses/my-teaching", { method: "GET" });
}

export function assignCourseInstructor(courseId, instructorId) {
  return apiRequest(`/courses/${courseId}/instructor`, {
    method: "PUT",
    body: JSON.stringify({ instructorId }),
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
// --- Degree Audit & Curriculum Requirements (v2.1) ---
export function getMyDegreeAudit(programCode = "") {
  const query = programCode ? `?programCode=${encodeURIComponent(programCode)}` : "";
  return apiRequest(`/degree-audit/my-audit${query}`, { method: "GET" });
}

export function getDegreeRequirements(programCode = "") {
  const query = programCode ? `?programCode=${encodeURIComponent(programCode)}` : "";
  return apiRequest(`/degree-audit/requirements${query}`, { method: "GET" });
}

export function addDegreeRequirement(requirementData) {
  return apiRequest("/degree-audit/requirements", {
    method: "POST",
    body: JSON.stringify(requirementData),
  });
}

export function deleteDegreeRequirement(requirementId) {
  return apiRequest(`/degree-audit/requirements/${requirementId}`, {
    method: "DELETE",
  });
}

// --- CSV Roster Export & Batch Grade Upload (v2.2) ---
export async function exportCourseRosterCsv(courseId, courseCode = "course") {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/gradebook/courses/${courseId}/export-csv`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to export CSV (${response.status})`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeCode = String(courseCode).replace(/[^a-zA-Z0-9_-]/g, "_");
  link.href = downloadUrl;
  link.download = `${safeCode}_roster.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function uploadBatchGradesCsv(courseId, file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/gradebook/courses/${courseId}/batch-grades`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const contentType = response.headers.get("content-type");
  const data =
    contentType && contentType.includes("application/json")
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === "object" && data.message) ||
      (typeof data === "string" && data) ||
      `Batch upload failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return data;
}
// --- Academic & Registration Holds (v2.3) ---
export function getMyActiveHolds() {
  return apiRequest("/holds/my-holds", { method: "GET" });
}

export function getAllActiveHolds() {
  return apiRequest("/holds/active", { method: "GET" });
}

export function searchStudentsForHolds(query = "") {
  const qs = query.trim() ? `?query=${encodeURIComponent(query.trim())}` : "";
  return apiRequest(`/holds/students${qs}`, { method: "GET" });
}

export function getStudentHolds(studentId) {
  return apiRequest(`/holds/student/${studentId}`, { method: "GET" });
}

export function placeAcademicHold(holdData) {
  return apiRequest("/holds", {
    method: "POST",
    body: JSON.stringify(holdData),
  });
}

export function liftAcademicHold(holdId, resolutionNote = "") {
  return apiRequest(`/holds/${holdId}/lift`, {
    method: "PATCH",
    body: JSON.stringify({ resolutionNote }),
  });
}

// --- Staff Student Transcript & Degree Audit Lookup (v2.5) ---
export function getStudentTranscriptForStaff(studentId) {
  return apiRequest(`/holds/student/${studentId}/transcript`, { method: "GET" });
}

export function getStudentDegreeAuditForStaff(studentId, programCode = "") {
  const qs = programCode.trim()
    ? `?programCode=${encodeURIComponent(programCode.trim())}`
    : "";
  return apiRequest(`/degree-audit/student/${studentId}${qs}`, { method: "GET" });
}

// --- Official PDF Transcript Downloads (v2.6) ---
async function downloadPdfEndpoint(endpoint, fallbackFilename) {
  const rawBase = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  const apiBase = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;
  const token = localStorage.getItem("token");

  const response = await fetch(`${apiBase}${endpoint}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = "Failed to download official PDF transcript.";
    try {
      const errData = await response.json();
      if (errData?.message) message = errData.message;
    } catch {
      // Ignore non-JSON error body
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fallbackFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function downloadMyTranscriptPdf() {
  return downloadPdfEndpoint("/transcripts/my-pdf", "Official_Transcript.pdf");
}

export function downloadStudentTranscriptPdf(studentId, studentName = "") {
  const safeName = studentName
    ? studentName.trim().replace(/\s+/g, "_")
    : `Student_${studentId}`;
  return downloadPdfEndpoint(
    `/transcripts/student/${studentId}/pdf`,
    `Official_Transcript_${safeName}.pdf`
  );
}