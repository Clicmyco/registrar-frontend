// src/components/CreditStandingMeter.jsx
const MAX_SEMESTER_CREDITS = 19;

function evaluateStanding(gpa, attemptedCredits, earnedCredits) {
  if (attemptedCredits === 0 || gpa === null) {
    return {
      label: "In Progress",
      detail: "No graded credits yet",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      icon: "fa-solid fa-hourglass-half text-slate-500",
    };
  }
  if (gpa >= 3.5 && earnedCredits >= 12) {
    return {
      label: "Dean's List",
      detail: "3.50+ GPA & 12+ earned Cr",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: "fa-solid fa-award text-emerald-600",
    };
  }
  if (gpa >= 2.0) {
    const nearDeansList = gpa >= 3.5 && earnedCredits < 12;
    return {
      label: "Good Standing",
      detail: nearDeansList
        ? `3.50+ GPA (${12 - earnedCredits} more Cr for Dean's List)`
        : "2.00+ GPA requirement met",
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
      icon: "fa-solid fa-circle-check text-indigo-600",
    };
  }
  return {
    label: "Academic Probation",
    detail: "Below 2.00 GPA threshold",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    icon: "fa-solid fa-triangle-exclamation text-rose-600",
  };
}

export default function CreditStandingMeter({
  enrollments,
  activeEnrollments,
  viewedTerm,
  coursesInSimScope,
  simulatedGrades,
  gradePointsMap,
  simScope,
}) {
  // 1. Semester Credit Load (counts ENROLLED + PENDING_APPROVAL + WAITLISTED toward 19 Cr)
  const matchesTerm = (e) => {
    if (!viewedTerm || !e.termCode) return true;
    return e.termCode === viewedTerm.code;
  };

  const termEnrollments = enrollments.filter(matchesTerm);

  const enrolledCredits = termEnrollments
    .filter((e) => e.status === "ENROLLED")
    .reduce((sum, e) => sum + e.credits, 0);

  const pendingCredits = termEnrollments
    .filter((e) => e.status === "PENDING_APPROVAL")
    .reduce((sum, e) => sum + e.credits, 0);

  const waitlistedCredits = termEnrollments
    .filter((e) => e.status === "WAITLISTED")
    .reduce((sum, e) => sum + e.credits, 0);

  const totalCommittedCredits = enrolledCredits + pendingCredits + waitlistedCredits;
  const remainingCredits = Math.max(0, MAX_SEMESTER_CREDITS - totalCommittedCredits);

  const enrolledPct = Math.min(100, (enrolledCredits / MAX_SEMESTER_CREDITS) * 100);
  const pendingPct = Math.min(
    100 - enrolledPct,
    (pendingCredits / MAX_SEMESTER_CREDITS) * 100
  );
  const waitlistedPct = Math.min(
    100 - enrolledPct - pendingPct,
    (waitlistedCredits / MAX_SEMESTER_CREDITS) * 100
  );

  // 2. Official Cumulative Standing (based on graded ENROLLED records)
  let officialAttempted = 0;
  let officialEarned = 0;
  let officialQp = 0;

  activeEnrollments.forEach((item) => {
    if (item.grade && gradePointsMap[item.grade] !== undefined) {
      officialAttempted += item.credits;
      officialQp += gradePointsMap[item.grade] * item.credits;
      if (item.grade !== "F") {
        officialEarned += item.credits;
      }
    }
  });

  const officialGpa =
    officialAttempted > 0 ? officialQp / officialAttempted : null;
  const officialStanding = evaluateStanding(
    officialGpa,
    officialAttempted,
    officialEarned
  );

  // 3. Live Projected Standing (updates dynamically from GPA Simulator choices)
  let projAttempted = 0;
  let projEarned = 0;
  let projQp = 0;

  coursesInSimScope.forEach((item) => {
    const effectiveGrade =
      item.grade && gradePointsMap[item.grade] !== undefined
        ? item.grade
        : simulatedGrades[item.courseId] || "A";
    const gp = gradePointsMap[effectiveGrade] ?? 0;

    projAttempted += item.credits;
    projQp += gp * item.credits;
    if (effectiveGrade !== "F") {
      projEarned += item.credits;
    }
  });

  const projectedGpa = projAttempted > 0 ? projQp / projAttempted : null;
  const projectedStanding = evaluateStanding(
    projectedGpa,
    projAttempted,
    projEarned
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Section 1: Semester Credit Load Meter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
              <i className="fa-solid fa-gauge-high"></i>
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Semester Credit Load
              </h3>
              <p className="text-[11px] text-slate-500">
                {viewedTerm ? viewedTerm.name : "All Active Semesters"}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
              totalCommittedCredits >= MAX_SEMESTER_CREDITS
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-50 text-slate-800 border-slate-200"
            }`}
          >
            {totalCommittedCredits} / {MAX_SEMESTER_CREDITS} Cr
          </span>
        </div>

        {/* Segmented Progress Bar */}
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200/70">
          {enrolledPct > 0 && (
            <div
              style={{ width: `${enrolledPct}%` }}
              className="bg-indigo-600 h-full transition-all duration-300"
              title={`Enrolled: ${enrolledCredits} Cr`}
            />
          )}
          {pendingPct > 0 && (
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-amber-400 h-full transition-all duration-300"
              title={`Pending Approval: ${pendingCredits} Cr`}
            />
          )}
          {waitlistedPct > 0 && (
            <div
              style={{ width: `${waitlistedPct}%` }}
              className="bg-purple-500 h-full transition-all duration-300"
              title={`Waitlisted: ${waitlistedCredits} Cr`}
            />
          )}
        </div>

        {/* Credit Breakdown Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Enrolled: <strong className="text-slate-900">{enrolledCredits} Cr</strong>
            </span>
            {pendingCredits > 0 && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Pending: <strong className="text-slate-900">{pendingCredits} Cr</strong>
              </span>
            )}
            {waitlistedCredits > 0 && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                Waitlisted: <strong className="text-slate-900">{waitlistedCredits} Cr</strong>
              </span>
            )}
          </div>

          <span className="font-semibold text-emerald-700">
            {remainingCredits > 0
              ? `${remainingCredits} Cr available`
              : "At 19-Cr cap"}
          </span>
        </div>
      </div>

      {/* Section 2: Academic Standing Indicator */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800">
            Projected Academic Standing
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {simScope === "TERM" ? "Term Scope" : "Cumulative Scope"}
          </span>
        </div>

        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${projectedStanding.badgeClass}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <i className={`${projectedStanding.icon} text-base shrink-0`}></i>
            <div className="min-w-0">
              <div className="text-xs font-extrabold truncate">
                {projectedStanding.label}
              </div>
              <div className="text-[11px] opacity-85 truncate">
                {projectedStanding.detail}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-sm font-extrabold">
              {projectedGpa !== null ? projectedGpa.toFixed(2) : "—"}
            </div>
            <div className="text-[10px] opacity-80">{projEarned} earned Cr</div>
          </div>
        </div>

        {officialGpa !== null && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Current Official Standing:</span>
            <span className="font-semibold text-slate-700">
              {officialStanding.label} ({officialGpa.toFixed(2)} GPA • {officialEarned} Cr)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}