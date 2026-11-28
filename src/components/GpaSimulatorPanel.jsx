// src/components/GpaSimulatorPanel.jsx
export default function GpaSimulatorPanel({
  coursesInScope,
  gradePointsMap,
  simulatedGrades,
  onUpdateGrade,
  onApplyPreset,
  onResetGrades,
  simScope,
  onChangeScope,
  viewedTermName,
  includePending,
  onToggleIncludePending,
  pendingCountInScope,
  scopeOfficialGpa,
  scopeGradedCredits,
  simulatedGpa,
  simTotalCredits,
  simTotalQualityPoints,
}) {
  const numericSimGpa = simTotalCredits > 0 ? parseFloat(simulatedGpa) : null;
  const delta =
    scopeOfficialGpa !== null && numericSimGpa !== null
      ? Number((numericSimGpa - scopeOfficialGpa).toFixed(2))
      : null;

  const adjustableCourses = coursesInScope.filter(
    (item) => !(item.grade && gradePointsMap[item.grade] !== undefined)
  );

  return (
    <div
      id="gpa-simulator-panel"
      className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
            <i className="fa-solid fa-sliders"></i>
          </span>
          <h3 className="text-base font-bold text-slate-900">
            Official Grades &amp; GPA Simulator
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Official Registrar grades lock in automatically; adjust in-progress courses to project your GPA
        </p>
      </div>

      {/* Live Projection Summary Strip */}
      <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-emerald-50/70 border border-slate-200">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
          <div className="text-[10px] font-medium text-slate-500">Official GPA</div>
          <div className="text-base font-extrabold text-indigo-900 mt-0.5">
            {scopeOfficialGpa !== null ? scopeOfficialGpa.toFixed(2) : "—"}
          </div>
          <div className="text-[10px] text-slate-400">{scopeGradedCredits} graded Cr</div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
          <div className="text-[10px] font-medium text-emerald-700">Projected GPA</div>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span className="text-base font-extrabold text-emerald-700">
              {simulatedGpa}
            </span>
            {delta !== null && delta !== 0 && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  delta > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">{simTotalCredits} total Cr</div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
          <div className="text-[10px] font-medium text-slate-500">Quality Pts</div>
          <div className="text-base font-extrabold text-slate-900 mt-0.5">
            {simTotalQualityPoints.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400">Projected pts</div>
        </div>
      </div>

      {/* Scope Toggle & One-Click Presets */}
      <div className="space-y-2.5 pb-3 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeScope("TERM")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                simScope === "TERM"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {viewedTermName ? `Term (${viewedTermName})` : "Current Term"}
            </button>
            <button
              type="button"
              onClick={() => onChangeScope("CUMULATIVE")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                simScope === "CUMULATIVE"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cumulative
            </button>
          </div>

          {adjustableCourses.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onApplyPreset("A")}
                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition"
              >
                All A&apos;s
              </button>
              <button
                type="button"
                onClick={() => onApplyPreset("B")}
                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-semibold transition"
              >
                All B&apos;s
              </button>
              <button
                type="button"
                onClick={onResetGrades}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includePending}
            onChange={(e) => onToggleIncludePending(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>
            Include pending approval courses
            {pendingCountInScope > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {pendingCountInScope} pending
              </span>
            )}
          </span>
        </label>
      </div>

      {/* Course Grade List */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {coursesInScope.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
            No active courses found for this view. Enroll in a course on the left or switch to{" "}
            <button
              type="button"
              onClick={() => onChangeScope("CUMULATIVE")}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Cumulative
            </button>
            .
          </div>
        ) : (
          coursesInScope.map((item) => {
            const hasOfficialGrade =
              item.grade && gradePointsMap[item.grade] !== undefined;
            const currentGrade = hasOfficialGrade
              ? item.grade
              : simulatedGrades[item.courseId] || "A";
            const isPending = item.status === "PENDING_APPROVAL";

            return (
              <div
                key={item.enrollmentId}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                  hasOfficialGrade
                    ? "bg-indigo-50/50 border-indigo-200"
                    : isPending
                    ? "bg-amber-50/40 border-amber-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {item.courseCode} — {item.courseTitle || item.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <span>{item.credits} Cr</span>
                    {item.termCode && (
                      <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 font-mono text-[10px]">
                        {item.termCode}
                      </span>
                    )}
                    {hasOfficialGrade ? (
                      <span className="text-indigo-700 font-semibold">• Official</span>
                    ) : isPending ? (
                      <span className="text-amber-700 font-semibold">• Pending</span>
                    ) : (
                      <span>• Simulated</span>
                    )}
                  </div>
                </div>

                {hasOfficialGrade ? (
                  <span className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                    {item.grade} ({gradePointsMap[item.grade].toFixed(2)})
                  </span>
                ) : (
                  <select
                    value={currentGrade}
                    onChange={(e) => onUpdateGrade(item.courseId, e.target.value)}
                    className="shrink-0 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {Object.keys(gradePointsMap).map((gradeLetter) => (
                      <option key={gradeLetter} value={gradeLetter}>
                        {gradeLetter} ({gradePointsMap[gradeLetter].toFixed(2)})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Note */}
      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
        Simulated grades are local only and never alter official records.
      </div>
    </div>
  );
}