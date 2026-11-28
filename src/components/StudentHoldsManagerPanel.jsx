// src/components/StudentHoldsManagerPanel.jsx
import { useState, useEffect } from "react";
import {
  searchStudentsForHolds,
  getStudentHolds,
  getAllActiveHolds,
  placeAcademicHold,
  liftAcademicHold,
} from "../services/api";

const HOLD_TYPES = ["ADVISING", "FINANCIAL", "ACADEMIC", "ADMINISTRATIVE"];

export default function StudentHoldsManagerPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHolds, setStudentHolds] = useState([]);
  const [isLoadingHolds, setIsLoadingHolds] = useState(false);

  const [activeHoldsOverview, setActiveHoldsOverview] = useState([]);

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

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStudentHolds([]);
    setIsLoadingHolds(true);
    setFeedback(null);

    try {
      const holds = await getStudentHolds(student.id);
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
        handleSelectStudent(selectedStudent),
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
        refreshTasks.push(handleSelectStudent(selectedStudent));
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

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Student Lookup &amp; Registration Holds
          </h3>
          <p className="text-xs text-slate-500">
            Inspect student hold records and place or clear registration blocks (Advising, Financial, Academic)
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
        {/* LEFT: Student Directory Search (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
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
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
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

        {/* RIGHT: Selected Student Hold Management (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!selectedStudent ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                Select a student on the left to place a new hold or inspect their hold history.
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
              {/* Place Hold Form */}
              <form
                onSubmit={handlePlaceHold}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Place Registration Hold — {selectedStudent.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500">{selectedStudent.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Back to Overview
                  </button>
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

              {/* Student Hold History */}
              {isLoadingHolds ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  Loading hold history...
                </div>
              ) : studentHolds.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
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
        </div>
      </div>
    </section>
  );
}