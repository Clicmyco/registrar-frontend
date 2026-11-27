// src/pages/InstructorDashboard.jsx
import { useState, useEffect } from "react";
import {
  getMyTeachingCourses,
  getCourseRoster,
  assignGrade,
} from "../services/api";

const GRADE_OPTIONS = ["", "A", "A-", "B+", "B", "C+", "C", "D", "F"];

export default function InstructorDashboard({ user, navigate }) {
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [roster, setRoster] = useState([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [savingGradeId, setSavingGradeId] = useState(null);

  const [feedback, setFeedback] = useState(null);

  const isInstructor = user?.roles?.includes("ROLE_INSTRUCTOR");
  const isAdminOrRegistrar =
    user?.roles?.includes("ROLE_ADMIN") || user?.roles?.includes("ROLE_REGISTRAR");
  const canAccess = isInstructor || isAdminOrRegistrar;

  const loadAssignedCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const data = await getMyTeachingCourses();
      const list = Array.isArray(data) ? data : [];
      setCourses(list);
      if (list.length > 0 && !selectedCourse) {
        handleSelectCourse(list[0]);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to load your assigned courses.",
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (user && canAccess) {
      loadAssignedCourses();
    }
  }, [user]);

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    setRoster([]);
    setIsLoadingRoster(true);
    setFeedback(null);

    try {
      const students = await getCourseRoster(course.id);
      setRoster(Array.isArray(students) ? students : []);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || `Could not load roster for ${course.courseCode}.`,
      });
    } finally {
      setIsLoadingRoster(false);
    }
  };

  const handleGradeChange = async (enrollmentId, newGrade) => {
    setSavingGradeId(enrollmentId);
    setFeedback(null);

    try {
      await assignGrade(enrollmentId, newGrade);
      setRoster((prev) =>
        prev.map((entry) =>
          entry.enrollmentId === enrollmentId
            ? { ...entry, grade: newGrade || null }
            : entry
        )
      );
      setFeedback({
        type: "success",
        text: newGrade
          ? `Grade "${newGrade}" saved to student record.`
          : "Grade cleared back to In Progress.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to submit grade.",
      });
    } finally {
      setSavingGradeId(null);
    }
  };

  if (!user || !canAccess) {
    return (
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto text-xl">
            <i className="fa-solid fa-chalkboard-user"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Faculty Clearance Required</h2>
          <p className="text-sm text-slate-600">
            This gradebook is restricted to assigned Faculty Instructors.
          </p>
          <button
            onClick={() => navigate("auth-preview")}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
          >
            Sign In as Faculty
          </button>
        </div>
      </main>
    );
  }

  const displayName = user.fullName || user.email;
  const nameParts = displayName.trim().split(/\s+/);
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

  const enrolledStudents = roster.filter((r) => r.status === "ENROLLED");
  const gradedCount = enrolledStudents.filter((r) => Boolean(r.grade)).length;

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="space-y-6">

        {/* Faculty Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-100 text-sky-800">
                  Faculty Instructor
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user.email} • Section Roster &amp; Official Gradebook
              </p>
            </div>
          </div>

          <div className="flex gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500">Assigned Sections</div>
              <div className="text-lg font-extrabold text-sky-700">{courses.length}</div>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500">Graded in Section</div>
              <div className="text-lg font-extrabold text-emerald-700">
                {selectedCourse ? `${gradedCount} / ${enrolledStudents.length}` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN: Assigned Courses (4 Columns) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">My Teaching Sections</h3>
                <p className="text-xs text-slate-500">Select a course to open its gradebook</p>
              </div>
              <button
                onClick={loadAssignedCourses}
                disabled={isLoadingCourses}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-sky-700 hover:bg-sky-50 transition"
              >
                <i className="fa-solid fa-rotate mr-1"></i>Refresh
              </button>
            </div>

            {isLoadingCourses ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Loading assigned sections...
              </div>
            ) : courses.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                No courses are assigned to your faculty account yet. Ask a Registrar Admin to assign your sections.
              </div>
            ) : (
              <div className="space-y-2.5">
                {courses.map((course) => {
                  const isSelected = selectedCourse?.id === course.id;
                  return (
                    <button
                      key={course.id}
                      onClick={() => handleSelectCourse(course)}
                      className={`w-full text-left p-3.5 rounded-xl border transition ${
                        isSelected
                          ? "bg-sky-50/80 border-sky-400 shadow-xs"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-sky-700">
                          {course.courseCode}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {course.enrolledCount ?? 0} / {course.maxCapacity ?? 30} Enrolled
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {course.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
                        {course.termCode && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">
                            {course.termCode}
                          </span>
                        )}
                        {course.meetingDays && course.startTime && course.endTime && (
                          <span>
                            {course.meetingDays} • {course.startTime.slice(0, 5)}–{course.endTime.slice(0, 5)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Section Gradebook (8 Columns) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            {!selectedCourse ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Select a teaching section on the left to view its roster and enter grades.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                      Official Section Gradebook
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedCourse.courseCode} — {selectedCourse.title}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {enrolledStudents.length} Active Students
                  </span>
                </div>

                {isLoadingRoster ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Loading class roster...
                  </div>
                ) : roster.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No students enrolled in this section yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                          <th className="py-2.5 px-2">Student</th>
                          <th className="py-2.5 px-2">Email</th>
                          <th className="py-2.5 px-2">Status</th>
                          <th className="py-2.5 px-2 text-right">Final Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {roster.map((entry, idx) => {
                          const isEnrolled = entry.status === "ENROLLED";
                          const isSaving = savingGradeId === entry.enrollmentId;
                          return (
                            <tr key={entry.enrollmentId || idx} className="hover:bg-slate-50">
                              <td className="py-3 px-2 font-medium text-slate-900">
                                {entry.studentName || entry.fullName || "—"}
                              </td>
                              <td className="py-3 px-2 text-slate-600">
                                {entry.studentEmail || entry.email}
                              </td>
                              <td className="py-3 px-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    isEnrolled
                                      ? "bg-emerald-100 text-emerald-800"
                                      : entry.status === "WAITLISTED"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {entry.status}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-right">
                                {isEnrolled ? (
                                  <select
                                    value={entry.grade || ""}
                                    disabled={isSaving}
                                    onChange={(e) =>
                                      handleGradeChange(entry.enrollmentId, e.target.value)
                                    }
                                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                                  >
                                    {GRADE_OPTIONS.map((g) => (
                                      <option key={g || "IP"} value={g}>
                                        {g ? g : "In Progress"}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">
                                    {entry.status.replace("_", " ")}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </section>
    </main>
  );
}