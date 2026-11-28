// src/components/BatchGradeToolbar.jsx
import { useState, useRef } from "react";
import { exportCourseRosterCsv, uploadBatchGradesCsv } from "../services/api";

export default function BatchGradeToolbar({ course, onGradesUpdated }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadReport, setUploadReport] = useState(null);
  const fileInputRef = useRef(null);

  if (!course) return null;

  const handleExport = async () => {
    setError(null);
    setIsExporting(true);
    try {
      await exportCourseRosterCsv(course.id, course.courseCode);
    } catch (err) {
      setError(err.message || "Could not download roster CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const openModal = () => {
    setSelectedFile(null);
    setUploadReport(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a .csv file first.");
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const report = await uploadBatchGradesCsv(course.id, selectedFile);
      setUploadReport(report);
      if (report.updatedCount > 0 && typeof onGradesUpdated === "function") {
        onGradesUpdated();
      }
    } catch (err) {
      setError(err.message || "Batch grade upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
        >
          {isExporting ? "Exporting..." : "Export Roster CSV"}
        </button>

        <button
          type="button"
          onClick={openModal}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
        >
          Batch Upload Grades
        </button>
      </div>

      {error && !isModalOpen && (
        <p className="text-xs text-rose-600 mt-1">{error}</p>
      )}

      {/* Batch Grade Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Batch Grade Upload — {course.courseCode}
                </h3>
                <p className="text-xs text-slate-500">{course.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-slate-700 space-y-1.5">
                <div className="font-semibold text-indigo-900">
                  CSV Format Instructions
                </div>
                <p>
                  1. Click{" "}
                  <button
                    type="button"
                    onClick={handleExport}
                    className="underline font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    Download Current Roster CSV
                  </button>{" "}
                  to get a pre-filled template with{" "}
                  <code className="bg-white px-1 rounded">enrollmentId</code> and{" "}
                  <code className="bg-white px-1 rounded">studentEmail</code>.
                </p>
                <p>
                  2. Fill in the <code className="bg-white px-1 rounded">grade</code>{" "}
                  column (<code className="bg-white px-1 rounded">A+</code> through{" "}
                  <code className="bg-white px-1 rounded">F</code>,{" "}
                  <code className="bg-white px-1 rounded">P</code>,{" "}
                  <code className="bg-white px-1 rounded">NP</code>,{" "}
                  <code className="bg-white px-1 rounded">W</code>, or{" "}
                  <code className="bg-white px-1 rounded">I</code>) and upload below.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Graded CSV File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      setSelectedFile(e.target.files?.[0] || null);
                      setUploadReport(null);
                      setError(null);
                    }}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-300 rounded-xl p-1.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                  >
                    {isUploading ? "Processing CSV..." : "Upload & Apply Grades"}
                  </button>
                </div>
              </form>

              {/* Row-by-Row Validation Report */}
              {uploadReport && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      Processed: {uploadReport.totalRowsProcessed}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Updated: {uploadReport.updatedCount}
                    </span>
                    {uploadReport.errorCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Errors: {uploadReport.errorCount}
                      </span>
                    )}
                  </div>

                  {uploadReport.results?.length > 0 && (
                    <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[11px] uppercase text-slate-500">
                          <tr>
                            <th className="py-2 px-2.5">Row</th>
                            <th className="py-2 px-2.5">Student</th>
                            <th className="py-2 px-2.5 text-center">Grade</th>
                            <th className="py-2 px-2.5">Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {uploadReport.results.map((r, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-2.5 text-slate-500">#{r.rowNumber}</td>
                              <td className="py-2 px-2.5">
                                <div className="font-semibold text-slate-900">{r.studentName}</div>
                                <div className="text-[11px] text-slate-500">{r.identifier}</div>
                              </td>
                              <td className="py-2 px-2.5 text-center font-bold">
                                {r.grade || "—"}
                              </td>
                              <td className="py-2 px-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                    r.status === "UPDATED"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {r.message}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}