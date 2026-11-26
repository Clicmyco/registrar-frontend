import { useState, useEffect } from "react";
import { getMyTranscript } from "../services/api";

const standingStyles = {
  "Dean's List": "bg-indigo-50 text-indigo-800 border-indigo-200",
  "Good Standing": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Academic Probation": "bg-rose-50 text-rose-800 border-rose-200",
};

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

function groupRecordsByTerm(records) {
  const groups = new Map();

  records.forEach((rec) => {
    const key = rec.termName
      ? `${rec.termName}${rec.termCode ? ` (${rec.termCode})` : ""}`
      : "General / Unassigned Term";

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(rec);
  });

  return Array.from(groups.entries()).map(([termLabel, items]) => {
    let attempted = 0;
    let earned = 0;
    let points = 0;

    items.forEach((item) => {
      if (item.grade && gradePointsMap[item.grade] !== undefined) {
        attempted += item.credits;
        points += gradePointsMap[item.grade] * item.credits;
        if (item.grade !== "F") {
          earned += item.credits;
        }
      }
    });

    const termGpa = attempted > 0 ? (points / attempted).toFixed(2) : "—";
    return { termLabel, items, earned, termGpa };
  });
}

export default function OfficialTranscript({ onBack }) {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTranscript = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyTranscript();
        setTranscript(data);
      } catch (err) {
        setError(err.message || "Failed to load official transcript.");
      } finally {
        setLoading(false);
      }
    };
    loadTranscript();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
        Generating official academic transcript...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs">
        {error}
      </div>
    );
  }

  if (!transcript) return null;

  const badgeClass =
    standingStyles[transcript.academicStanding] ||
    "bg-slate-100 text-slate-700 border-slate-200";

  const termSections = groupRecordsByTerm(transcript.records || []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-400">
      {/* Action Bar */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          ← Back to Course Registration
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
        >
          <i className="fa-solid fa-print mr-1.5"></i>Print / Save as PDF
        </button>
      </div>

      {/* Transcript Body */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-700">
              Office of the University Registrar
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Official Academic Transcript
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Student: <strong className="text-slate-800">{transcript.studentName}</strong> ({transcript.studentEmail})
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-500">
            <div>
              Student ID:{" "}
              <span className="font-mono font-semibold text-slate-800">
                HSIS-{String(transcript.studentId).padStart(5, "0")}
              </span>
            </div>
            <div>Issued: {new Date(transcript.generatedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Cumulative Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Cumulative GPA</div>
            <div className="text-xl font-extrabold text-indigo-900 mt-0.5">
              {transcript.attemptedCredits > 0 ? transcript.cumulativeGpa.toFixed(2) : "—"}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Total Earned Credits</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {transcript.earnedCredits} Cr
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">Attempted Credits</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {transcript.attemptedCredits} Cr
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="text-xs text-slate-500">Academic Standing</div>
            <span className={`mt-1 inline-block w-fit px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeClass}`}>
              {transcript.academicStanding}
            </span>
          </div>
        </div>

        {/* Semester-by-Semester Coursework */}
        {termSections.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No enrolled coursework on record yet.
          </div>
        ) : (
          <div className="space-y-5">
            {termSections.map((section) => (
              <div
                key={section.termLabel}
                className="rounded-xl border border-slate-200 overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-800">{section.termLabel}</span>
                  <div className="flex items-center gap-4 text-slate-600">
                    <span>
                      Term Earned: <strong className="text-slate-900">{section.earned} Cr</strong>
                    </span>
                    <span>
                      Term GPA: <strong className="text-indigo-800">{section.termGpa}</strong>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                        <th className="py-2 px-4">Course Code</th>
                        <th className="py-2 px-4">Course Title</th>
                        <th className="py-2 px-4 text-center">Credits</th>
                        <th className="py-2 px-4 text-center">Final Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {section.items.map((rec) => (
                        <tr key={rec.enrollmentId}>
                          <td className="py-2.5 px-4 font-mono text-xs font-semibold text-slate-800">
                            {rec.courseCode}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">
                            {rec.courseTitle}
                          </td>
                          <td className="py-2.5 px-4 text-center text-slate-700">
                            {rec.credits}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold">
                            {rec.grade ? (
                              <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-800 text-xs">
                                {rec.grade}
                              </span>
                            ) : (
                              <span className="text-xs font-normal text-slate-400 italic">
                                In Progress
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Verification Line */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>HSIS Academic Registrar Management System</span>
          <span>Total Quality Points: {transcript.totalQualityPoints.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}