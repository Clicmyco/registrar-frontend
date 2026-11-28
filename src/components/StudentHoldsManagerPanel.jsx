// src/components/StudentHoldsManagerPanel.jsx
import { useState, useEffect } from "react";
import {
  searchStudentsForHolds,
  getStudentHolds,
  getAllActiveHolds,
  placeAcademicHold,
  liftAcademicHold,
  getStudentTranscriptForStaff,
  getStudentDegreeAuditForStaff,
} from "../services/api";

const HOLD_TYPES = ["ADVISING", "FINANCIAL", "ACADEMIC", "ADMINISTRATIVE"];

const AUDIT_STATUS_STYLES = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  REMAINING: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function StudentHoldsManagerPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("HOLDS"); // "HOLDS" | "TRANSCRIPT" | "AUDIT"

  // Holds State
  const [studentHolds, setStudentHolds] = useState([]);
  const [isLoadingHolds, setIsLoadingHolds] = useState(false);
  const [activeHoldsOverview, setActiveHoldsOverview] = useState([]);

  // Transcript & Degree Audit Drawer State (v2.5)
  const [transcript, setTranscript] = useState(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [degreeAudit, setDegreeAudit] = useState(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Place Hold Form State
  const [holdType, setHoldType] = useState("ADVISING");
  const [reason, setReason] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);

  // Lift Hold State
  const [liftingHoldId, setLiftingHoldId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState({});

  const [feedback, setFeedback] = useState(null);

  const loadStudentsAndOverview = async (query = searchQuery) => {
    setIsSearching(true);
    try {
      const [studentList, activeList] = await Promise.all([
        searchStudentsForHolds(query),
        getAllActiveHolds(),
      ]);
      setStudents(Array.isArray(studentList) ? studentList : []);
      setActiveHoldsOverview(Array.isArray(activeList) ? activeList : []);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to load student directory.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadStudentsAndOverview("");
  }, []);

  const loadStudentHolds = async (studentId) => {
    setIsLoadingHolds(true);
    try {
      const holds = await getStudentHolds(studentId);
      setStudentHolds(Array.isArray(holds) ? holds : []);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Could not load student hold history.",
      });
    } finally {
      setIsLoadingHolds(false);
    }
  };

  const loadStudentTranscript = async (studentId) => {
    setIsLoadingTranscript(true);
    try {
      const data = await getStudentTranscriptForStaff(studentId);
      setTranscript(data);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Could not load student transcript.",
      });
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  const loadStudentAudit = async (studentId) => {
    setIsLoadingAudit(true);
    try {
      const data = await getStudentDegreeAuditForStaff(studentId);
      setDegreeAudit(data);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Could not load student degree audit.",
      });
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStudentHolds([]);
    setTranscript(null);
    setDegreeAudit(null);
    setFeedback(null);

    if (activeTab === "TRANSCRIPT") {
      await loadStudentTranscript(student.id);
    } else if (activeTab === "AUDIT") {
      await loadStudentAudit(student.id);
    } else {
      await loadStudentHolds(student.id);
    }
  };

  const handleTabChange = async (nextTab) => {
    setActiveTab(nextTab);
    setFeedback(null);
    if (!selectedStudent) return;

    if (nextTab === "HOLDS" && studentHolds.length === 0 && !isLoadingHolds) {
      await loadStudentHolds(selectedStudent.id);
    } else if (nextTab === "TRANSCRIPT" && !transcript && !isLoadingTranscript) {
      await loadStudentTranscript(selectedStudent.id);
    } else if (nextTab === "AUDIT" && !degreeAudit && !isLoadingAudit) {
      await loadStudentAudit(selectedStudent.id);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStudentsAndOverview(searchQuery);
  };

  const handlePlaceHold = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!reason.trim()) {
      setFeedback({ type: "error", text: "Please enter a reason for placing this hold." });
      return;
    }

    setIsPlacing(true);
    setFeedback(null);
    try {
      await placeAcademicHold({
        studentId: selectedStudent.id,
        holdType,
        reason: reason.trim(),
      });
      setReason("");
      setFeedback({
        type: "success",
        text: `${holdType} hold placed on ${selectedStudent.fullName}.`,
      });
      await Promise.all([
        loadStudentHolds(selectedStudent.id),
        loadStudentsAndOverview(searchQuery),
      ]);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to place registration hold.",
      });
    } finally {
      setIsPlacing(false);
    }
  };

  const handleLiftHold = async (hold) => {
    setLiftingHoldId(hold.id);
    setFeedback(null);
    try {
      const note = resolutionNotes[hold.id] || "";
      await liftAcademicHold(hold.id, note);
      setResolutionNotes((prev) => ({ ...prev, [hold.id]: "" }));
      setFeedback({
        type: "success",
        text: `${hold.holdType} hold cleared for ${hold.studentName || hold.studentEmail}.`,
      });

      const refreshTasks = [loadStudentsAndOverview(searchQuery)];
      if (selectedStudent && selectedStudent.id === hold.studentId) {
        refreshTasks.push(loadStudentHolds(selectedStudent.id));
      }
      await Promise.all(refreshTasks);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to lift hold.",
      });
    } finally {
      setLiftingHoldId(null);
    }
  };

  const renderStandingBadge = (standing) => {
    if (!standing) return null;
    if (standing === "Dean's List") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {standing}
        </span>
      );
    }
    if (standing === "Academic Probation") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {standing}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        {standing}
      </span>
    );
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Student Lookup, Advising Review &amp; Registration Holds
          </h3>
          <p className="text-xs text-slate-500">
            Inspect student holds, official transcripts, and degree audit progress before clearing advising blocks
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            activeHoldsOverview.length > 0
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {activeHoldsOverview.length} Active Hold{activeHoldsOverview.length === 1 ? "" : "s"} Campus-Wide
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Student Directory Search (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name or email..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition"
            >
              Search
            </button>
          </form>

          {isSearching ? (
            <div className="py-6 text-center text-xs text-slate-500">Searching students...</div>
          ) : students.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No student accounts matched your search.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {students.map((st) => {
                const isSelected = selectedStudent?.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectStudent(st)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition ${
                      isSelected ? "bg-indigo-50/80" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {st.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{st.email}</div>
                    </div>
                    {st.activeHoldCount > 0 ? (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">
                        {st.activeHoldCount} Hold{st.activeHoldCount > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                        Clear
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Selected Student Inspection Drawer (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedStudent ? (
            <div className="space-y-3">
              <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                Select a student on the left to manage registration holds, review their official transcript, or inspect degree audit progress.
              </div>

              {activeHoldsOverview.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Currently Active Holds
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                    {activeHoldsOverview.map((h) => (
                      <div
                        key={h.id}
                        className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {h.studentName || h.studentEmail}{" "}
                            <span className="ml-1.5 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px]">
                              {h.holdType}
                            </span>
                          </div>
                          <div className="text-slate-600 mt-0.5">{h.reason}</div>
                        </div>
                        <button
                          type="button"
                          disabled={liftingHoldId === h.id}
                          onClick={() => handleLiftHold(h)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50"
                        >
                          {liftingHoldId === h.id ? "Clearing..." : "Lift Hold"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Student Header + Tab Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {selectedStudent.fullName}
                    </div>
                    <div className="text-xs text-slate-500">{selectedStudent.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs text-slate-600 hover:text-slate-900 font-semibold"
                  >
                    Back to Overview
                  </button>
                </div>

                {/* 3-Tab Switcher */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => handleTabChange("HOLDS")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTab === "HOLDS"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Registration Holds
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("TRANSCRIPT")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTab === "TRANSCRIPT"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Official Transcript
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange("AUDIT")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTab === "AUDIT"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Degree Audit
                  </button>
                </div>
              </div>

              {/* TAB 1: REGISTRATION HOLDS */}
              {activeTab === "HOLDS" && (
                <div className="space-y-4">
                  <form
                    onSubmit={handlePlaceHold}
                    className="p-4 rounded-xl bg-white border border-slate-200 space-y-3"
                  >
                    <div className="text-xs font-bold text-slate-800">
                      Place New Registration Hold
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-4">
                        <select
                          value={holdType}
                          onChange={(e) => setHoldType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                        >
                          {HOLD_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason (e.g. Mandatory advising check-in)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <button
                          type="submit"
                          disabled={isPlacing}
                          className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                        >
                          {isPlacing ? "Placing..." : "+ Place Hold"}
                        </button>
                      </div>
                    </div>
                  </form>

                  {isLoadingHolds ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      Loading hold history...
                    </div>
                  ) : studentHolds.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No active or historical holds on file for this student.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {studentHolds.map((h) => (
                        <div
                          key={h.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                            h.active
                              ? "bg-rose-50/50 border-rose-200"
                              : "bg-slate-50 border-slate-200 opacity-80"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                  h.active
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {h.holdType}
                              </span>
                              <span className="font-semibold text-slate-900">{h.reason}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                h.active
                                  ? "bg-rose-600 text-white"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {h.active ? "ACTIVE" : "CLEARED"}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500">
                            Placed by {h.placedByEmail}
                            {h.placedAt ? ` • ${new Date(h.placedAt).toLocaleString()}` : ""}
                            {!h.active && h.resolvedByEmail && (
                              <>
                                {" "}
                                | Cleared by {h.resolvedByEmail}
                                {h.resolutionNote ? ` (${h.resolutionNote})` : ""}
                              </>
                            )}
                          </div>

                          {h.active && (
                            <div className="flex gap-2 pt-1">
                              <input
                                type="text"
                                value={resolutionNotes[h.id] || ""}
                                onChange={(e) =>
                                  setResolutionNotes((prev) => ({
                                    ...prev,
                                    [h.id]: e.target.value,
                                  }))
                                }
                                placeholder="Optional clearance note..."
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                              />
                              <button
                                type="button"
                                disabled={liftingHoldId === h.id}
                                onClick={() => handleLiftHold(h)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50"
                              >
                                {liftingHoldId === h.id ? "Clearing..." : "Lift Hold"}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: OFFICIAL TRANSCRIPT */}
              {activeTab === "TRANSCRIPT" && (
                <div className="space-y-4">
                  {isLoadingTranscript ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Loading official academic transcript...
                    </div>
                  ) : !transcript ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Transcript data unavailable.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
                          <div className="text-[11px] text-indigo-700 font-medium">
                            Cumulative GPA
                          </div>
                          <div className="text-lg font-extrabold text-indigo-950">
                            {(transcript.cumulativeGpa ?? 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-[11px] text-slate-500">Earned / Attempted</div>
                          <div className="text-base font-extrabold text-slate-900">
                            {transcript.earnedCredits} / {transcript.attemptedCredits} Cr
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-[11px] text-slate-500">Quality Points</div>
                          <div className="text-base font-extrabold text-slate-900">
                            {(transcript.totalQualityPoints ?? 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                          <div className="text-[11px] text-slate-500">Academic Standing</div>
                          <div className="pt-1">{renderStandingBadge(transcript.standing)}</div>
                        </div>
                      </div>

                      {!transcript.records || transcript.records.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                          No actively enrolled or graded courses on record for this student.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
                                <th className="py-2.5 px-3">Term</th>
                                <th className="py-2.5 px-3">Course</th>
                                <th className="py-2.5 px-3 text-center">Credits</th>
                                <th className="py-2.5 px-3 text-right">Grade</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {transcript.records.map((rec) => (
                                <tr key={rec.id} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-3 text-slate-500 font-mono">
                                    {rec.termCode || "—"}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="font-bold text-slate-900">
                                      {rec.courseCode}
                                    </span>{" "}
                                    <span className="text-slate-600">— {rec.title}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                                    {rec.credits} Cr
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    {rec.grade ? (
                                      <span
                                        className={`px-2 py-0.5 rounded font-bold ${
                                          rec.grade === "F"
                                            ? "bg-rose-100 text-rose-800"
                                            : "bg-emerald-100 text-emerald-800"
                                        }`}
                                      >
                                        {rec.grade}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 italic">In Progress</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: DEGREE AUDIT */}
              {activeTab === "AUDIT" && (
                <div className="space-y-4">
                  {isLoadingAudit ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Evaluating degree audit checklist...
                    </div>
                  ) : !degreeAudit ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Degree audit data unavailable.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-bold mr-2">
                            {degreeAudit.programCode}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {degreeAudit.programName}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            degreeAudit.eligibleForGraduation
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          {degreeAudit.eligibleForGraduation
                            ? "Eligible for Graduation"
                            : `${Math.min(100, degreeAudit.completionPercentage || 0)}% Complete`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-[11px] text-slate-500">Required</div>
                          <div className="text-sm font-extrabold text-slate-900">
                            {degreeAudit.totalRequiredCredits} Cr
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                          <div className="text-[11px] text-emerald-700">Completed</div>
                          <div className="text-sm font-extrabold text-emerald-900">
                            {degreeAudit.completedCredits} Cr
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                          <div className="text-[11px] text-amber-700">In Progress</div>
                          <div className="text-sm font-extrabold text-amber-900">
                            {degreeAudit.inProgressCredits} Cr
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="text-[11px] text-slate-500">Remaining</div>
                          <div className="text-sm font-extrabold text-indigo-700">
                            {degreeAudit.remainingCredits} Cr
                          </div>
                        </div>
                      </div>

                      {!degreeAudit.requirements || degreeAudit.requirements.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                          No curriculum requirements configured for {degreeAudit.programCode} yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
                                <th className="py-2 px-3">Type</th>
                                <th className="py-2 px-3">Requirement</th>
                                <th className="py-2 px-3 text-center">Credits</th>
                                <th className="py-2 px-3 text-center">Grade</th>
                                <th className="py-2 px-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {degreeAudit.requirements.map((item) => (
                                <tr key={item.requirementId} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        item.category === "CORE"
                                          ? "bg-indigo-50 text-indigo-700"
                                          : "bg-purple-50 text-purple-700"
                                      }`}
                                    >
                                      {item.category}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                                    {item.category === "CORE"
                                      ? `${item.courseCode} — ${item.courseTitle}`
                                      : item.courseTitle}
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-slate-700">
                                    {item.creditsEarned} / {item.creditsRequired} Cr
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold">
                                    {item.gradeAchieved || "—"}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                        AUDIT_STATUS_STYLES[item.status] ||
                                        AUDIT_STATUS_STYLES.REMAINING
                                      }`}
                                    >
                                      {item.status.replace("_", " ")}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}