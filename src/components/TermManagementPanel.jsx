import { useState, useEffect } from "react";
import { getAllTerms, createAcademicTerm, updateAcademicTerm } from "../services/api";

export default function TermManagementPanel() {
  const [terms, setTerms] = useState([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [addDropDeadline, setAddDropDeadline] = useState("");
  const [setActive, setSetActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadTerms = async () => {
    setLoading(true);
    try {
      const data = await getAllTerms();
      setTerms(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to load academic terms." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setFeedback({ type: "error", text: "Term code and name are required." });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await createAcademicTerm({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        registrationOpen: true,
        addDropDeadline: addDropDeadline || null,
        setActive,
      });
      setCode("");
      setName("");
      setAddDropDeadline("");
      setFeedback({ type: "success", text: "Academic term created." });
      await loadTerms();
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (term, updates) => {
    setBusy(true);
    setFeedback(null);
    try {
      await updateAcademicTerm(term.id, updates);
      setFeedback({ type: "success", text: `Updated ${term.name}.` });
      await loadTerms();
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Academic Terms &amp; Registration Windows
          </h2>
          <p className="text-xs text-slate-500">
            Control the active semester, open/close student registration, and enforce add/drop deadlines
          </p>
        </div>
        <button
          onClick={loadTerms}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
        >
          Refresh
        </button>
      </div>

      {feedback && (
        <div
          className={`mx-5 mt-4 p-3 rounded-xl text-xs font-medium border ${
            feedback.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Term Form */}
        <form onSubmit={handleCreate} className="lg:col-span-4 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            New Academic Term
          </div>
          <input
            type="text"
            placeholder="Code (e.g. 2027-SPRING)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono uppercase"
          />
          <input
            type="text"
            placeholder="Name (e.g. Spring Semester 2027)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
          />
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Add / Drop Deadline
            </label>
            <input
              type="date"
              value={addDropDeadline}
              onChange={(e) => setAddDropDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={setActive}
              onChange={(e) => setSetActive(e.target.checked)}
            />
            Set as active semester immediately
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50"
          >
            Create Term
          </button>
        </form>

        {/* Terms Table */}
        <div className="lg:col-span-8 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading terms...</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 px-2">Term</th>
                  <th className="py-2 px-2">Add/Drop Deadline</th>
                  <th className="py-2 px-2">Registration</th>
                  <th className="py-2 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terms.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {t.name}
                        {t.active && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">{t.code}</div>
                    </td>
                    <td className="py-3 px-2 text-xs text-slate-600">
                      {t.addDropDeadline || "No deadline"}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          t.registrationOpen
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {t.registrationOpen ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <button
                        disabled={busy}
                        onClick={() =>
                          handleToggle(t, { registrationOpen: !t.registrationOpen })
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        {t.registrationOpen ? "Close Reg." : "Open Reg."}
                      </button>
                      {!t.active && (
                        <button
                          disabled={busy}
                          onClick={() => handleToggle(t, { active: true })}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                        >
                          Set Active
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}