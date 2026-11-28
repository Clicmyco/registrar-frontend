// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import {
  getAllCourses,
  getMyEnrollments,
  enrollInCourse,
  dropCourse,
  getActiveTerm,
  getAllTerms,
  downloadMyTranscriptPdf,
} from "../services/api";
import OfficialTranscript from "../components/OfficialTranscript";
import DegreeAuditPanel from "../components/DegreeAuditPanel";
import WeeklyTimetable from "../components/WeeklyTimetable";
import StudentHoldBanner from "../components/StudentHoldBanner";
import NotificationBell from "../components/NotificationBell";
import GpaSimulatorPanel from "../components/GpaSimulatorPanel";
import CreditStandingMeter from "../components/CreditStandingMeter";
import RegistrationWaitlistTracker from "../components/RegistrationWaitlistTracker";

const gradePointsMap = {
  A: 4.0,
  "A-": 3.75,
  "B+": 3.5,
  B: 3.0,
  "C+": 2.5,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};

const statusBadge = {
  ENROLLED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200",
  WAITLISTED: "bg-purple-50 text-purple-700 border-purple-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  DROPPED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function Dashboard({ user, navigate }) {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activeTerm, setActiveTerm] = useState(null);
  const [terms, setTerms] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  // GPA Simulator State
  const [simulatedGrades, setSimulatedGrades] = useState({});
  const [simScope, setSimScope] = useState("TERM"); // "TERM" | "CUMULATIVE"
  const [includePending, setIncludePending] = useState(false);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const isStudent = user?.roles?.includes("ROLE_STUDENT");

  const loadDashboardData = async (termFilter = selectedTermId) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [catalog, active, termList, myEnrollments] = await Promise.all([
        getAllCourses(termFilter || null),
        getActiveTerm().catch(() => null),
        getAllTerms().catch(() => []),
        isStudent ? getMyEnrollments() : Promise.resolve([]),
      ]);

      setCourses(catalog);
      setActiveTerm(active);
      setTerms(Array.isArray(termList) ? termList : []);
      setEnrollments(myEnrollments);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to load registrar data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleEnroll = async (courseId) => {
    setFeedback(null);
    setActionLoadingId(courseId);
    try {
      const message = await enrollInCourse(courseId);
      setFeedback({ type: "success", text: message });
      await loadDashboardData();
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDrop = async (enrollmentId, courseId) => {
    setFeedback(null);
    setActionLoadingId(courseId);
    try {
      const message = await dropCourse(enrollmentId);
      setFeedback({ type: "success", text: message });
      await loadDashboardData();
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const updateCourseGrade = (courseId, newGrade) => {
    setSimulatedGrades((prev) => ({ ...prev, [courseId]: newGrade }));
  };

  const handleDownloadPdf = async () => {
    setFeedback(null);
    setIsDownloadingPdf(true);
    try {
      await downloadMyTranscriptPdf();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to download official PDF transcript.",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // --- GUARD: Prompt guests to sign in ---
  if (!user) {
    return (
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto text-xl">
            <i className="fa-solid fa-lock"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
          <p className="text-sm text-slate-600">
            Please sign in with your Student or Admin account to access live course registration and enrollment records.
          </p>
          <button
            onClick={() => navigate("auth-preview")}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm"
          >
            Go to Portal Sign-In
          </button>
        </div>
      </main>
    );
  }

  // --- MATH CALCULATIONS (Official + Scoped Simulated GPA) ---
  const activeEnrollments = enrollments.filter((e) => e.status === "ENROLLED");
  const viewedTerm =
    terms.find((t) => String(t.id) === String(selectedTermId)) || activeTerm;

  const matchesViewedTerm = (e) => {
    if (!viewedTerm || !e.termCode) return true;
    return e.termCode === viewedTerm.code;
  };

  const termActiveEnrollments = activeEnrollments.filter(matchesViewedTerm);
  const termCredits = termActiveEnrollments.reduce((sum, item) => sum + item.credits, 0);

  // Overall Official Cumulative GPA
  const gradedEnrollments = activeEnrollments.filter(
    (item) => item.grade && gradePointsMap[item.grade] !== undefined
  );
  const gradedCredits = gradedEnrollments.reduce((sum, item) => sum + item.credits, 0);
  const officialQualityPoints = gradedEnrollments.reduce(
    (sum, item) => sum + gradePointsMap[item.grade] * item.credits,
    0
  );
  const officialGpaNumeric =
    gradedCredits > 0 ? officialQualityPoints / gradedCredits : null;
  const officialGpa =
    officialGpaNumeric !== null ? officialGpaNumeric.toFixed(2) : "—";

  // Scoped Enrollments for Simulator (Term vs Cumulative + Optional Pending)
  const scopedEnrolled =
    simScope === "TERM" ? termActiveEnrollments : activeEnrollments;
  const scopedPending = enrollments.filter(
    (e) =>
      e.status === "PENDING_APPROVAL" &&
      (simScope === "CUMULATIVE" || matchesViewedTerm(e))
  );
  const coursesInSimScope = includePending
    ? [...scopedEnrolled, ...scopedPending]
    : scopedEnrolled;

  const scopeGraded = scopedEnrolled.filter(
    (item) => item.grade && gradePointsMap[item.grade] !== undefined
  );
  const scopeGradedCredits = scopeGraded.reduce((sum, item) => sum + item.credits, 0);
  const scopeOfficialQp = scopeGraded.reduce(
    (sum, item) => sum + gradePointsMap[item.grade] * item.credits,
    0
  );
  const scopeOfficialGpa =
    scopeGradedCredits > 0 ? scopeOfficialQp / scopeGradedCredits : null;

  let simTotalCredits = 0;
  let simTotalQualityPoints = 0;
  coursesInSimScope.forEach((item) => {
    const effectiveGrade =
      item.grade && gradePointsMap[item.grade] !== undefined
        ? item.grade
        : simulatedGrades[item.courseId] || "A";
    const gp = gradePointsMap[effectiveGrade] ?? 0;
    simTotalCredits += item.credits;
    simTotalQualityPoints += gp * item.credits;
  });

  const simulatedGpa =
    simTotalCredits > 0
      ? (simTotalQualityPoints / simTotalCredits).toFixed(2)
      : "0.00";

  const simDelta =
    scopeOfficialGpa !== null && simTotalCredits > 0
      ? Number((parseFloat(simulatedGpa) - scopeOfficialGpa).toFixed(2))
      : null;

  const handleApplyPreset = (presetGrade) => {
    setSimulatedGrades((prev) => {
      const next = { ...prev };
      coursesInSimScope.forEach((item) => {
        const isLocked = item.grade && gradePointsMap[item.grade] !== undefined;
        if (!isLocked) {
          next[item.courseId] = presetGrade;
        }
      });
      return next;
    });
  };

  const handleResetGrades = () => {
    setSimulatedGrades({});
  };

  const displayName = user.fullName || user.email;
  const nameParts = displayName.trim().split(/\s+/);
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="space-y-6">

        {/* Profile Summary Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {displayName}
                </h2>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap shrink-0 ${
                    isAdmin
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isAdmin ? "Registrar Admin" : "Active Student"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {user.email} • B.Sc. Computer Science
              </p>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 shrink-0">
            {!isAdmin && (
              <>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap">
                  <div className="text-[11px] text-slate-500">Enrolled Credits</div>
                  <div className="text-base font-extrabold text-indigo-700">
                    {termCredits} / 19 Cr
                  </div>
                </div>

                <div className="bg-indigo-50/70 px-3 py-1.5 rounded-xl border border-indigo-200 whitespace-nowrap">
                  <div className="text-[11px] text-indigo-700 font-medium">Official GPA</div>
                  <div className="text-base font-extrabold text-indigo-900">{officialGpa}</div>
                </div>

                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 whitespace-nowrap">
                  <div className="text-[11px] text-slate-500">
                    {simScope === "TERM" ? "Simulated Term GPA" : "Simulated Cumul. GPA"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold text-emerald-700">
                      {simulatedGpa}
                    </span>
                    {simDelta !== null && simDelta !== 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          simDelta > 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {simDelta > 0 ? `+${simDelta.toFixed(2)}` : simDelta.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-2 shrink-0">
              {!isAdmin && (
                <>
                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={handleDownloadPdf}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold transition shadow-sm whitespace-nowrap"
                  >
                    <i className="fa-solid fa-file-pdf mr-1.5"></i>
                    {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
                  </button>
                  <button
                    onClick={() => setShowTranscript((prev) => !prev)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm whitespace-nowrap"
                  >
                    <i className="fa-solid fa-file-lines mr-1.5"></i>
                    {showTranscript ? "Course Registration" : "Official Transcript"}
                  </button>
                </>
              )}
              <NotificationBell />
            </div>
          </div>
        </div>

        {!isAdmin && <StudentHoldBanner />}

        {/* Live Feedback Banner */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
              feedback.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <span>
              <i
                className={`fa-solid ${
                  feedback.type === "error" ? "fa-circle-exclamation" : "fa-circle-check"
                } mr-2`}
              ></i>
              {feedback.text}
            </span>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-500 hover:text-slate-800 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Active Semester Banner */}
        {activeTerm && (
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{activeTerm.name}</span>
              <span className="font-mono text-slate-400">({activeTerm.code})</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold border ${
                  activeTerm.registrationOpen
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {activeTerm.registrationOpen ? "Registration Open" : "Registration Closed"}
              </span>
            </div>
            {activeTerm.addDropDeadline && (
              <span className="text-slate-500">
                Add / Drop Deadline:{" "}
                <strong className="text-slate-700">{activeTerm.addDropDeadline}</strong>
              </span>
            )}
          </div>
        )}

        {/* Main Workspace: Official Transcript OR Registration + Right Column Stack + Timetable */}
        {showTranscript && !isAdmin ? (
          <OfficialTranscript onBack={() => setShowTranscript(false)} />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Course Catalog & Registration Table (7 Columns for Students, 12 for Admin) */}
              <div
                className={`${
                  isAdmin ? "lg:col-span-12" : "lg:col-span-7"
                } bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Semester Course Registration
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live course catalog loaded from Spring Boot
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTermId}
                      onChange={(e) => {
                        setSelectedTermId(e.target.value);
                        loadDashboardData(e.target.value);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
                    >
                      <option value="">All Semesters</option>
                      {terms.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.active ? "(Active)" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => loadDashboardData()}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition"
                    >
                      <i className="fa-solid fa-rotate mr-1"></i>Refresh
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    Loading courses from server...
                  </div>
                ) : courses.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500">
                    No courses found in the database yet. Sign in as an Admin to create one!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                          <th className="py-2.5 px-2">Code</th>
                          <th className="py-2.5 px-2">Course Title</th>
                          <th className="py-2.5 px-2 text-center">Cr.</th>
                          <th className="py-2.5 px-2 text-center">Seats</th>
                          {!isAdmin && <th className="py-2.5 px-2 text-center">Grade</th>}
                          <th className="py-2.5 px-2 text-right">Status / Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {courses.map((course) => {
                          const enrollment = enrollments.find((e) => e.courseId === course.id);
                          const isBusy = actionLoadingId === course.id;
                          const enrolledCount = course.enrolledCount ?? 0;
                          const maxCapacity = course.maxCapacity ?? 30;
                          const isFull = enrolledCount >= maxCapacity;

                          return (
                            <tr key={course.id} className="hover:bg-slate-50 transition">
                              <td className="py-3 px-2 font-mono text-xs font-semibold text-slate-700">
                                {course.courseCode}
                              </td>
                              <td className="py-3 px-2 text-xs sm:text-sm font-medium text-slate-900">
                                <div>{course.title}</div>
                                {course.meetingDays && course.startTime && course.endTime && (
                                  <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                                    <i className="fa-regular fa-clock mr-1"></i>
                                    {course.meetingDays} • {course.startTime.slice(0, 5)}–{course.endTime.slice(0, 5)}
                                    {course.room ? ` (${course.room})` : ""}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                  {course.termCode && (
                                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono">
                                      {course.termCode}
                                    </span>
                                  )}
                                  {course.prerequisiteCourseCode && (
                                    <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                                      Prereq: {course.prerequisiteCourseCode}
                                    </span>
                                  )}
                                  {(course.instructorName || course.instructorEmail) && (
                                    <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-medium">
                                      <i className="fa-solid fa-chalkboard-user mr-1"></i>
                                      {course.instructorName || course.instructorEmail}
                                    </span>
                                  )}
                                </div>
                                {enrollment?.advisorNote && (
                                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                                    Advisor note:{" "}
                                    <span className="font-medium text-slate-700">
                                      {enrollment.advisorNote}
                                    </span>
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center text-xs font-semibold text-slate-600">
                                {course.credits}
                              </td>
                              <td className="py-3 px-2 text-center text-xs font-semibold">
                                <div className="flex flex-col items-center gap-1">
                                  <span
                                    className={`px-2 py-0.5 rounded-full ${
                                      isFull
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {enrolledCount} / {maxCapacity}
                                  </span>
                                  {(course.waitlistCount ?? 0) > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                                      {course.waitlistCount} waitlisted
                                    </span>
                                  )}
                                </div>
                              </td>
                              {!isAdmin && (
                                <td className="py-3 px-2 text-center">
                                  {enrollment?.status === "ENROLLED" ? (
                                    enrollment.grade ? (
                                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800">
                                        {enrollment.grade}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-400 italic">In Progress</span>
                                    )
                                  ) : (
                                    <span className="text-xs text-slate-300">—</span>
                                  )}
                                </td>
                              )}
                              <td className="py-3 px-2 text-right">
                                {isAdmin ? (
                                  <span className="text-xs text-slate-400">Catalog Item</span>
                                ) : enrollment?.status === "ENROLLED" ? (
                                  <div className="inline-flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.ENROLLED}`}
                                    >
                                      Enrolled
                                    </span>
                                    <button
                                      disabled={isBusy}
                                      onClick={() => handleDrop(enrollment.enrollmentId, course.id)}
                                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition"
                                    >
                                      {isBusy ? "Dropping..." : "Drop"}
                                    </button>
                                  </div>
                                ) : enrollment?.status === "PENDING_APPROVAL" ? (
                                  <div className="inline-flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.PENDING_APPROVAL}`}
                                    >
                                      Pending Approval
                                    </span>
                                    <button
                                      disabled={isBusy}
                                      onClick={() => handleDrop(enrollment.enrollmentId, course.id)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 disabled:opacity-50 transition"
                                      title="Cancel pending request"
                                    >
                                      {isBusy ? "..." : "Cancel"}
                                    </button>
                                  </div>
                                ) : enrollment?.status === "WAITLISTED" ? (
                                  <div className="inline-flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.WAITLISTED}`}
                                    >
                                      Waitlisted{enrollment.waitlistPosition ? ` (#${enrollment.waitlistPosition})` : ""}
                                    </span>
                                    <button
                                      disabled={isBusy}
                                      onClick={() => handleDrop(enrollment.enrollmentId, course.id)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 disabled:opacity-50 transition"
                                      title="Leave waitlist"
                                    >
                                      {isBusy ? "..." : "Leave"}
                                    </button>
                                  </div>
                                ) : enrollment?.status === "REJECTED" ? (
                                  <div className="inline-flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.REJECTED}`}
                                    >
                                      Rejected
                                    </span>
                                    <button
                                      disabled={isBusy}
                                      onClick={() => handleEnroll(course.id)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border disabled:opacity-50 transition ${
                                        isFull
                                          ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                          : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                      }`}
                                    >
                                      {isBusy ? "Requesting..." : isFull ? "Join Waitlist" : "Re-Request"}
                                    </button>
                                  </div>
                                ) : enrollment?.status === "DROPPED" ? (
                                  <button
                                    disabled={isBusy}
                                    onClick={() => handleEnroll(course.id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold border disabled:opacity-50 transition ${
                                      isFull
                                        ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                                        : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                    }`}
                                  >
                                    {isBusy ? "Processing..." : isFull ? "Join Waitlist" : "Re-Enroll"}
                                  </button>
                                ) : isFull ? (
                                  <button
                                    disabled={isBusy}
                                    onClick={() => handleEnroll(course.id)}
                                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition"
                                  >
                                    {isBusy ? "Joining..." : "Join Waitlist"}
                                  </button>
                                ) : (
                                  <button
                                    disabled={isBusy}
                                    onClick={() => handleEnroll(course.id)}
                                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                                  >
                                    {isBusy ? "Requesting..." : "Request Course"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: GPA Simulator + Credit Meter + Registration & Waitlist Tracker (5 Columns) */}
              {!isAdmin && (
                <div className="lg:col-span-5 space-y-6">
                  <GpaSimulatorPanel
                    coursesInScope={coursesInSimScope}
                    gradePointsMap={gradePointsMap}
                    simulatedGrades={simulatedGrades}
                    onUpdateGrade={updateCourseGrade}
                    onApplyPreset={handleApplyPreset}
                    onResetGrades={handleResetGrades}
                    simScope={simScope}
                    onChangeScope={setSimScope}
                    viewedTermName={viewedTerm?.name}
                    includePending={includePending}
                    onToggleIncludePending={setIncludePending}
                    pendingCountInScope={scopedPending.length}
                    scopeOfficialGpa={scopeOfficialGpa}
                    scopeGradedCredits={scopeGradedCredits}
                    simulatedGpa={simulatedGpa}
                    simTotalCredits={simTotalCredits}
                    simTotalQualityPoints={simTotalQualityPoints}
                  />

                  <CreditStandingMeter
                    enrollments={enrollments}
                    activeEnrollments={activeEnrollments}
                    viewedTerm={viewedTerm}
                    coursesInSimScope={coursesInSimScope}
                    simulatedGrades={simulatedGrades}
                    gradePointsMap={gradePointsMap}
                    simScope={simScope}
                  />

                  <RegistrationWaitlistTracker
                    enrollments={enrollments}
                    courses={courses}
                    actionLoadingId={actionLoadingId}
                    onDrop={handleDrop}
                    onEnroll={handleEnroll}
                  />
                </div>
              )}

            </div>

            {!isAdmin && (
              <WeeklyTimetable
                enrollments={enrollments.filter((e) => {
                  if (!selectedTermId || !viewedTerm || !e.termCode) return true;
                  return e.termCode === viewedTerm.code;
                })}
                termLabel={selectedTermId ? viewedTerm?.name : activeTerm?.name}
              />
            )}

            <DegreeAuditPanel refreshTrigger={enrollments.length} />
          </>
        )}
      </section>
    </main>
  );
}