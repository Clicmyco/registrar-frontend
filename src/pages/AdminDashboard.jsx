// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import {
  getAllCourses,
  createCourse,
  getCourseRoster,
  assignGrade,
  getAllTerms,
  getAdminUsers,
  assignCourseInstructor,
} from "../services/api";
import AdminGovernancePanel from "../components/AdminGovernancePanel";
import AdvisorApprovalQueue from "../components/AdvisorApprovalQueue";
import TermManagementPanel from "../components/TermManagementPanel";
import CurriculumManagerPanel from "../components/CurriculumManagerPanel";

export default function AdminDashboard({ user, navigate }) {
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Create Course Form State
  const [courseCode, setCourseCode] = useState("");
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState("3");
  const [maxCapacity, setMaxCapacity] = useState("30");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prerequisiteCourseId, setPrerequisiteCourseId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [instructors, setInstructors] = useState([]);
  const [assigningInstructorCourseId, setAssigningInstructorCourseId] = useState(null);

  const [terms, setTerms] = useState([]);
  const [termId, setTermId] = useState("");
  const [filterTermId, setFilterTermId] = useState("");

  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [room, setRoom] = useState("");

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Roster Inspector State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [roster, setRoster] = useState([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [savingGradeId, setSavingGradeId] = useState(null);
  const GRADE_OPTIONS = ["", "A", "A-", "B+", "B", "C+", "C", "D", "F"];

  // Feedback Banner
  const [feedback, setFeedback] = useState(null);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const isRegistrar = user?.roles?.includes("ROLE_REGISTRAR");
  const isAdvisor = user?.roles?.includes("ROLE_ADVISOR");
  const isStaff = isAdmin || isRegistrar || isAdvisor;
  const canAssignGrades = isAdmin || isRegistrar;

  const roleLabel = isAdmin
    ? "Registrar Admin"
    : isRegistrar
    ? "Academic Registrar"
    : "Academic Advisor";

  const loadCourses = async (selectedFilter = filterTermId) => {
    setIsLoadingCourses(true);
    try {
      const [catalog, termList, usersList] = await Promise.all([
        getAllCourses(selectedFilter || null),
        getAllTerms().catch(() => []),
        canAssignGrades ? getAdminUsers().catch(() => []) : Promise.resolve([]),
      ]);
      setCourses(catalog);
      const safeTerms = Array.isArray(termList) ? termList : [];
      setTerms(safeTerms);
      if (!termId && safeTerms.length > 0) {
        const active = safeTerms.find((t) => t.active);
        if (active) setTermId(String(active.id));
      }

      const safeUsers = Array.isArray(usersList) ? usersList : [];
      setInstructors(
        safeUsers.filter((u) => u.active && u.roles?.includes("ROLE_INSTRUCTOR"))
      );
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to load course catalog." });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!courseCode.trim() || !title.trim() || !credits) {
      setFeedback({ type: "error", text: "Please fill in course code, title, and credits." });
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedCode = courseCode.trim().toUpperCase();
      await createCourse({
        courseCode: normalizedCode,
        title: title.trim(),
        credits: Number(credits),
        maxCapacity: Number(maxCapacity) || 30,
        prerequisiteCourseId: prerequisiteCourseId ? Number(prerequisiteCourseId) : null,
        termId: termId ? Number(termId) : null,
        instructorId: instructorId ? Number(instructorId) : null,
        meetingDays: selectedDays.length > 0 ? selectedDays.join(",") : null,
        startTime: startTime || null,
        endTime: endTime || null,
        room: room.trim() || null,
      });

      setFeedback({
        type: "success",
        text: `Course ${normalizedCode} created and published to the catalog.`,
      });

      setCourseCode("");
      setTitle("");
      setCredits("3");
      setMaxCapacity("30");
      setPrerequisiteCourseId("");
      setInstructorId("");
      setSelectedDays([]);
      setStartTime("");
      setEndTime("");
      setRoom("");

      await loadCourses();
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to create course." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignInstructor = async (course, newInstructorId) => {
    setAssigningInstructorCourseId(course.id);
    setFeedback(null);
    try {
      const updated = await assignCourseInstructor(
        course.id,
        newInstructorId ? Number(newInstructorId) : null
      );
      setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
      setFeedback({
        type: "success",
        text: updated.instructorName || updated.instructorEmail
          ? `Assigned ${updated.instructorName || updated.instructorEmail} to ${course.courseCode}.`
          : `Unassigned instructor from ${course.courseCode}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to assign instructor.",
      });
    } finally {
      setAssigningInstructorCourseId(null);
    }
  };

  const handleInspectRoster = async (course) => {
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
          ? `Official grade "${newGrade}" recorded.`
          : "Grade cleared back to In Progress.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to update grade.",
      });
    } finally {
      setSavingGradeId(null);
    }
  };

  // --- GUARD: Staff Only ---
  if (!user || !isStaff) {
    return (
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl">
            <i className="fa-solid fa-user-shield"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Staff Clearance Required</h2>
          <p className="text-sm text-slate-600">
            This portal is restricted to Registrar Staff and Administrators.
          </p>
          <button
            onClick={() => navigate("auth-preview")}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
          >
            Sign In as Staff
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

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="space-y-6">

        {/* Staff Summary Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-xl">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user.email} • Course Management &amp; Live Roster Control
              </p>
            </div>
          </div>

          <div className="flex gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500">Published Courses</div>
              <div className="text-lg font-extrabold text-indigo-700">{courses.length}</div>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <div className="text-xs text-slate-500">Active Roster View</div>
              <div className="text-lg font-extrabold text-amber-700">
                {selectedCourse ? selectedCourse.courseCode : "None"}
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

          {/* LEFT COLUMN: Create New Course Form (4 Columns) */}
          {isAdmin && (
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Publish New Course</h3>
                <p className="text-xs text-slate-500">
                  Add a course directly to the PostgreSQL catalog
                </p>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label htmlFor="courseCode" className="block text-xs font-semibold text-slate-700 mb-1">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="courseCode"
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. CS301"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="courseTitle" className="block text-xs font-semibold text-slate-700 mb-1">
                    Course Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="courseTitle"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Operating Systems"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="credits" className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Hours <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="credits"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5].map((cr) => (
                      <option key={cr} value={cr}>
                        {cr} Credit {cr === 1 ? "Hour" : "Hours"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="maxCapacity" className="block text-xs font-semibold text-slate-700 mb-1">
                    Seat Capacity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="maxCapacity"
                    type="number"
                    min="1"
                    max="500"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="prerequisiteCourseId" className="block text-xs font-semibold text-slate-700 mb-1">
                    Prerequisite Course <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    id="prerequisiteCourseId"
                    value={prerequisiteCourseId}
                    onChange={(e) => setPrerequisiteCourseId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None (Open to all students)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.courseCode} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="instructorId" className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Instructor <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    id="instructorId"
                    value={instructorId}
                    onChange={(e) => setInstructorId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned (TBA)</option>
                    {instructors.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.fullName || inst.email} ({inst.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="termId" className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Term
                  </label>
                  <select
                    id="termId"
                    value={termId}
                    onChange={(e) => setTermId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Active Semester (Default)</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="text-xs font-semibold text-slate-700">
                    Class Schedule <span className="text-slate-400 font-normal">(Optional)</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Meeting Days
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {["MON", "TUE", "WED", "THU", "FRI"].map((day) => {
                        const active = selectedDays.includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => toggleDay(day)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                              active
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="startTime" className="block text-[11px] font-medium text-slate-500 mb-1">
                        Start Time
                      </label>
                      <input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-[11px] font-medium text-slate-500 mb-1">
                        End Time
                      </label>
                      <input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="room" className="block text-[11px] font-medium text-slate-500 mb-1">
                      Room / Location
                    </label>
                    <input
                      id="room"
                      type="text"
                      placeholder="e.g. Science Bldg 204"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition shadow-sm"
                >
                  <i className="fa-solid fa-plus mr-1.5"></i>
                  {isSubmitting ? "Publishing..." : "Create Course"}
                </button>
              </form>
            </div>
          )}

          {/* RIGHT COLUMN: Course Catalog & Roster Inspector */}
          <div className={`${isAdmin ? "lg:col-span-8" : "lg:col-span-12"} space-y-6`}>

            {/* Course Catalog Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Active Course Catalog</h3>
                  <p className="text-xs text-slate-500">
                    Click &ldquo;View Roster&rdquo; on any course to inspect enrolled students
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterTermId}
                    onChange={(e) => {
                      setFilterTermId(e.target.value);
                      loadCourses(e.target.value);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
                  >
                    <option value="">All Terms</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => loadCourses()}
                    disabled={isLoadingCourses}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <i className="fa-solid fa-rotate mr-1"></i>Refresh
                  </button>
                </div>
              </div>

              {isLoadingCourses ? (
                <div className="py-8 text-center text-xs text-slate-500">Loading catalog...</div>
              ) : courses.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No courses published yet. Use the form on the left to add your first course.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                        <th className="py-2.5 px-2">Code</th>
                        <th className="py-2.5 px-2">Course Title</th>
                        <th className="py-2.5 px-2">Instructor</th>
                        <th className="py-2.5 px-2 text-center">Cr.</th>
                        <th className="py-2.5 px-2 text-center">Seats</th>
                        <th className="py-2.5 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {courses.map((course) => {
                        const isSelected = selectedCourse?.id === course.id;
                        const enrolledCount = course.enrolledCount ?? 0;
                        const capacity = course.maxCapacity ?? 30;
                        const isAssigning = assigningInstructorCourseId === course.id;

                        return (
                          <tr
                            key={course.id}
                            className={isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"}
                          >
                            <td className="py-3 px-2 font-mono font-semibold text-indigo-700">
                              {course.courseCode}
                            </td>
                            <td className="py-3 px-2 font-medium text-slate-900">
                              <div>{course.title}</div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                {course.termCode && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono">
                                    {course.termCode}
                                  </span>
                                )}
                                {course.meetingDays && course.startTime && course.endTime && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-medium">
                                    {course.meetingDays} • {course.startTime.slice(0, 5)}–{course.endTime.slice(0, 5)}
                                    {course.room ? ` • ${course.room}` : ""}
                                  </span>
                                )}
                                {course.prerequisiteCourseCode && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                                    Prereq: {course.prerequisiteCourseCode}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-xs">
                              {canAssignGrades ? (
                                <select
                                  value={course.instructorId || ""}
                                  disabled={isAssigning}
                                  onChange={(e) => handleAssignInstructor(course, e.target.value)}
                                  className="max-w-[165px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                                >
                                  <option value="">Unassigned (TBA)</option>
                                  {instructors.map((inst) => (
                                    <option key={inst.id} value={inst.id}>
                                      {inst.fullName || inst.email}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-slate-600">
                                  {course.instructorName || course.instructorEmail || "TBA"}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center text-slate-600">
                              {course.credits}
                            </td>
                            <td className="py-3 px-2 text-center text-xs font-semibold">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full ${
                                    enrolledCount >= capacity
                                      ? "bg-rose-100 text-rose-700"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {enrolledCount} / {capacity}
                                </span>
                                {(course.waitlistCount ?? 0) > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                                    {course.waitlistCount} waitlisted
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <button
                                onClick={() => handleInspectRoster(course)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                  isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                }`}
                              >
                                View Roster
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Live Class Roster Panel */}
            {selectedCourse && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      Live Student Roster
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedCourse.courseCode} — {selectedCourse.title}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {roster.filter((r) => r.status === "ENROLLED").length} Active / {roster.length} Total
                  </span>
                </div>

                {isLoadingRoster ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Fetching enrolled students...
                  </div>
                ) : roster.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No students have enrolled in this course yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                          <th className="py-2 px-2">Student</th>
                          <th className="py-2 px-2">Email</th>
                          <th className="py-2 px-2">Status</th>
                          <th className="py-2 px-2 text-right">Official Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {roster.map((entry, idx) => {
                          const isEnrolled = entry.status === "ENROLLED";
                          const isSaving = savingGradeId === entry.enrollmentId;
                          return (
                            <tr key={entry.enrollmentId || idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-2 font-medium text-slate-900">
                                {entry.studentName || entry.fullName || "—"}
                              </td>
                              <td className="py-2.5 px-2 text-slate-600">
                                {entry.studentEmail || entry.email}
                              </td>
                              <td className="py-2.5 px-2">
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
                              <td className="py-2.5 px-2 text-right">
                                {isEnrolled ? (
                                  canAssignGrades ? (
                                    <select
                                      value={entry.grade || ""}
                                      disabled={isSaving}
                                      onChange={(e) => handleGradeChange(entry.enrollmentId, e.target.value)}
                                      className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                      {GRADE_OPTIONS.map((g) => (
                                        <option key={g || "IP"} value={g}>
                                          {g ? g : "In Progress"}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                                      {entry.grade || "In Progress"}
                                    </span>
                                  )
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
              </div>
            )}

          </div>
        </div>

        {canAssignGrades && <TermManagementPanel />}
        <AdvisorApprovalQueue onDecision={loadCourses} />
        {isAdmin && <AdminGovernancePanel />}
        {canAssignGrades && <CurriculumManagerPanel courses={courses}/>}
      </section>
    </main>
  );
}