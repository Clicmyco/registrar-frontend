// src/components/CurriculumManagerPanel.jsx
import { useState, useEffect } from "react";
import {
  getDegreeRequirements,
  addDegreeRequirement,
  deleteDegreeRequirement,
} from "../services/api";

export default function CurriculumManagerPanel({ courses = [] }) {
  const [requirements, setRequirements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [category, setCategory] = useState("CORE");
  const [courseId, setCourseId] = useState("");
  const [creditsRequired, setCreditsRequired] = useState("6");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState(null);

  const loadRequirements = async () => {
    setIsLoading(true);
    try {
      const data = await getDegreeRequirements("BSC-CS");
      setRequirements(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to load curriculum requirements.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (category === "CORE" && !courseId) {
      setFeedback({ type: "error", text: "Please select a required core course." });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDegreeRequirement({
        programCode: "BSC-CS",
        programName: "B.Sc. Computer Science",
        category,
        courseId: category === "CORE" ? Number(courseId) : null,
        creditsRequired: category === "ELECTIVE" ? Number(creditsRequired) : 3,
        description: description.trim() || null,
      });

      setCourseId("");
      setDescription("");
      setFeedback({
        type: "success",
        text: "Degree requirement added to B.Sc. Computer Science.",
      });
      await loadRequirements();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Could not add requirement.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setFeedback(null);
    try {
      await deleteDegreeRequirement(id);
      setRequirements((prev) => prev.filter((r) => r.requirementId !== id));
      setFeedback({ type: "success", text: "Requirement removed." });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Could not remove requirement.",
      });
    }
  };

  const totalConfiguredCredits = requirements.reduce(
    (sum, r) => sum + (r.creditsRequired || 0),
    0
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Degree Curriculum &amp; Audit Requirements (BSC-CS)
          </h3>
          <p className="text-xs text-slate-500">
            Configure mandatory core courses and elective credit blocks evaluated on student degree audits
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
          Total Configured: {totalConfiguredCredits} Cr
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

      {/* Add Requirement Form */}
      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-200"
      >
        <div className="md:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
          >
            <option value="CORE">CORE Course</option>
            <option value="ELECTIVE">ELECTIVE Pool</option>
          </select>
        </div>

        {category === "CORE" ? (
          <div className="md:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Required Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="">Select a catalog course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} — {c.title} ({c.credits} Cr)
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="md:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Elective Credits Required
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={creditsRequired}
              onChange={(e) => setCreditsRequired(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            />
          </div>
        )}

        <div className="md:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Note / Label <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              category === "CORE" ? "e.g. Foundation Requirement" : "e.g. Upper-Division Electives"
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition"
          >
            {isSubmitting ? "Adding..." : "+ Add Rule"}
          </button>
        </div>
      </form>

      {/* Configured Requirements List */}
      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-500">Loading requirements...</div>
      ) : requirements.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          No degree requirements defined yet. Add core courses or elective credit blocks above.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-2 px-2">Category</th>
                <th className="py-2 px-2">Requirement</th>
                <th className="py-2 px-2 text-center">Credits</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requirements.map((req) => (
                <tr key={req.requirementId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        req.category === "CORE"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {req.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="font-medium text-slate-900">
                      {req.category === "CORE"
                        ? `${req.courseCode} — ${req.courseTitle}`
                        : req.courseTitle}
                    </div>
                    {req.description && (
                      <div className="text-[11px] text-slate-500">{req.description}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-slate-700">
                    {req.creditsRequired} Cr
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <button
                      onClick={() => handleDelete(req.requirementId)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold transition"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}