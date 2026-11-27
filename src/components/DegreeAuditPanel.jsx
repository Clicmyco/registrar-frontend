// src/components/DegreeAuditPanel.jsx
import { useState, useEffect } from "react";
import { getMyDegreeAudit } from "../services/api";

const statusStyles = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  REMAINING: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function DegreeAuditPanel({ refreshTrigger }) {
  const [audit, setAudit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAudit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyDegreeAudit();
      setAudit(data);
    } catch (err) {
      setError(err.message || "Failed to load degree audit.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [refreshTrigger]);

  if (isLoading && !audit) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-xs text-slate-500 text-center">
        Evaluating graduation requirements...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 rounded-2xl border border-rose-200 p-4 text-xs text-rose-800">
        {error}
      </div>
    );
  }

  if (!audit) return null;

  const completedPct = Math.min(100, audit.completionPercentage || 0);
  const inProgressPct =
    audit.totalRequiredCredits > 0
      ? Math.min(
          100 - completedPct,
          Math.round((audit.inProgressCredits / audit.totalRequiredCredits) * 1000) / 10
        )
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Degree Audit &amp; Graduation Progress
            </h3>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-semibold">
              {audit.programCode}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{audit.programName}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              audit.eligibleForGraduation
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}
          >
            {audit.eligibleForGraduation
              ? "Eligible for Graduation"
              : `${completedPct}% Complete`}
          </span>
          <button
            onClick={loadAudit}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition"
          >
            <i className="fa-solid fa-rotate mr-1"></i>Refresh
          </button>
        </div>
      </div>

      {/* Multi-Segment Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${completedPct}%` }}
            title={`Completed: ${audit.completedCredits} Cr`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-300"
            style={{ width: `${inProgressPct}%` }}
            title={`In Progress: ${audit.inProgressCredits} Cr`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500">Required Credits</div>
            <div className="text-base font-extrabold text-slate-900">
              {audit.totalRequiredCredits} Cr
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-[11px] text-emerald-700 font-medium">Completed</div>
            <div className="text-base font-extrabold text-emerald-900">
              {audit.completedCredits} Cr
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="text-[11px] text-amber-700 font-medium">In Progress</div>
            <div className="text-base font-extrabold text-amber-900">
              {audit.inProgressCredits} Cr
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500">Remaining</div>
            <div className="text-base font-extrabold text-indigo-700">
              {audit.remainingCredits} Cr
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Table */}
      {audit.requirements.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
          No curriculum requirements have been configured for {audit.programCode} yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2">Requirement</th>
                <th className="py-2.5 px-2 text-center">Credits</th>
                <th className="py-2.5 px-2 text-center">Grade</th>
                <th className="py-2.5 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {audit.requirements.map((item) => (
                <tr key={item.requirementId} className="hover:bg-slate-50">
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.category === "CORE"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-semibold text-slate-900">
                      {item.category === "CORE"
                        ? `${item.courseCode} — ${item.courseTitle}`
                        : item.courseTitle}
                    </div>
                    {item.description && (
                      <div className="text-[11px] text-slate-500">{item.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center font-semibold text-slate-700">
                    {item.creditsEarned} / {item.creditsRequired} Cr
                  </td>
                  <td className="py-3 px-2 text-center">
                    {item.gradeAchieved ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                        {item.gradeAchieved}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        statusStyles[item.status] || statusStyles.REMAINING
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
    </div>
  );
}