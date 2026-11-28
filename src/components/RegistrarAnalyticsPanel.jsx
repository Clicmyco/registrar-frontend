// src/components/RegistrarAnalyticsPanel.jsx
import { useState, useEffect } from "react";
import { getRegistrarAnalytics } from "../services/api";

const BUCKET_STYLES = {
  "Dean's List": {
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  "Good Standing": {
    bar: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  Satisfactory: {
    bar: "bg-amber-400",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  "Probation Risk": {
    bar: "bg-rose-500",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
  },
};

export default function RegistrarAnalyticsPanel({
  selectedTermId = "",
  terms = [],
  onSelectTerm,
  refreshTrigger = 0,
}) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [localRefresh, setLocalRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadAnalytics = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getRegistrarAnalytics(selectedTermId || null);
        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load registrar analytics.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [selectedTermId, refreshTrigger, localRefresh]);

  const activeTermObj = terms.find(
    (t) => String(t.id) === String(selectedTermId)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center text-sm">
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Registrar Operations &amp; Academic Analytics
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Enrollment throughput, hold distribution, student GPA standing &amp; course demand
              {activeTermObj ? ` • ${activeTermObj.name}` : " • All Semesters"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSelectTerm && (
            <select
              value={selectedTermId}
              onChange={(e) => onSelectTerm(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="">All Semesters</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.active ? "(Active)" : ""}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setLocalRefresh((n) => n + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition"
          >
            <i className="fa-solid fa-rotate mr-1"></i>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          {error}
        </div>
      )}

      {!analytics && isLoading ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Aggregating registrar metrics...
        </div>
      ) : (
        analytics && (
          <>
            {/* KPI Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Active Enrollments */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-800">
                  <span>Active Enrollments</span>
                  <i className="fa-solid fa-user-check text-indigo-600"></i>
                </div>
                <div className="text-2xl font-extrabold text-indigo-950 mt-1">
                  {analytics.activeEnrollments}
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {analytics.activeStudents} active / {analytics.totalStudents} total students
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                  <span>Pending Approvals</span>
                  <i className="fa-solid fa-clock text-amber-600"></i>
                </div>
                <div className="text-2xl font-extrabold text-amber-950 mt-1">
                  {analytics.pendingApprovals}
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Awaiting advisor / registrar review
                </div>
              </div>

              {/* Waitlisted Demand */}
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-900">
                  <span>Waitlisted Seats</span>
                  <i className="fa-solid fa-hourglass-half text-purple-600"></i>
                </div>
                <div className="text-2xl font-extrabold text-purple-950 mt-1">
                  {analytics.totalWaitlisted}
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Across {analytics.totalCourses} published courses
                </div>
              </div>

              {/* Active Academic Holds */}
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-900">
                  <span>Active Account Holds</span>
                  <i className="fa-solid fa-ban text-rose-600"></i>
                </div>
                <div className="text-2xl font-extrabold text-rose-950 mt-1">
                  {analytics.activeHoldsCount}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {analytics.holdsByType &&
                    Object.entries(analytics.holdsByType).map(([type, count]) => (
                      <span
                        key={type}
                        className="px-1.5 py-0.2 rounded bg-white border border-rose-200 text-[10px] font-semibold text-slate-700"
                      >
                        {type.slice(0, 4)}: {count}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {/* Bottom 2-Column Analytical Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
              {/* Left: GPA Distribution (5 Columns) */}
              <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Student GPA Distribution
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Based on {analytics.gradedStudentCount} graded students
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">
                      Mean GPA
                    </div>
                    <div className="text-base font-extrabold text-indigo-700">
                      {analytics.averageStudentGpa !== null
                        ? analytics.averageStudentGpa.toFixed(2)
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {(analytics.gpaDistribution || []).map((bucket) => {
                    const style = BUCKET_STYLES[bucket.label] || {
                      bar: "bg-slate-500",
                      badge: "bg-slate-100 text-slate-700 border-slate-200",
                    };
                    return (
                      <div key={bucket.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">
                              {bucket.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({bucket.range})
                            </span>
                          </div>
                          <span className="font-bold text-slate-700 text-[11px]">
                            {bucket.studentCount} ({bucket.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, bucket.percentage)}%` }}
                            className={`h-full rounded-full transition-all duration-300 ${style.bar}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: High-Demand Courses & Seat Utilization (7 Columns) */}
              <div className="lg:col-span-7 p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Course Seat Utilization &amp; Waitlist Demand
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Ranked by waitlist pressure, pending requests &amp; seat fill rate
                    </p>
                  </div>
                </div>

                {!analytics.highDemandCourses ||
                analytics.highDemandCourses.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No courses available for the selected term.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {analytics.highDemandCourses.map((course) => {
                      const pct = Math.min(100, course.fillRatePercent || 0);
                      const isFull = course.enrolledCount >= course.maxCapacity;

                      return (
                        <div
                          key={course.courseId}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-indigo-700">
                                {course.courseCode}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 truncate">
                                {course.title}
                              </span>
                              {course.termCode && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">
                                  {course.termCode}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {course.waitlistCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                                  +{course.waitlistCount} waitlisted
                                </span>
                              )}
                              {course.pendingCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  {course.pendingCount} pending
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isFull
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {course.enrolledCount}/{course.maxCapacity} ({pct}%)
                              </span>
                            </div>
                          </div>

                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                isFull
                                  ? "bg-rose-500"
                                  : pct >= 75
                                  ? "bg-amber-500"
                                  : "bg-indigo-600"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}