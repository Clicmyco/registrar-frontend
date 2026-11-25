import { useState, useEffect } from "react";
import { getPendingEnrollments, reviewEnrollment } from "../services/api";

export default function AdvisorApprovalQueue({ onDecision }) {
  const [requests, setRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadQueue = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await getPendingEnrollments();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to load pending enrollment requests.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleReview = async (req, approve) => {
    const note = (notes[req.enrollmentId] || "").trim();

    if (!approve && !note) {
      setFeedback({
        type: "error",
        text: `Please enter a brief reason before rejecting ${req.studentEmail}.`,
      });
      return;
    }

    setBusyId(req.enrollmentId);
    setFeedback(null);
    try {
      await reviewEnrollment(req.enrollmentId, approve, note);
      setRequests((prev) => prev.filter((item) => item.enrollmentId !== req.enrollmentId));
      setFeedback({
        type: "success",
        text: approve
          ? `Approved ${req.studentName || req.studentEmail} for ${req.courseCode}.`
          : `Rejected ${req.studentName || req.studentEmail} for ${req.courseCode}.`,
      });
      if (onDecision) onDecision();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Could not process review decision.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Advisor Enrollment Approval Queue
          </h2>
          <p className="text-xs text-slate-500">
            Review student course requests, verify seat availability, and record decisions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {requests.length} Pending
          </span>
          <button
            onClick={loadQueue}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* Queue Body */}
      <div className="p-5">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading pending requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No pending enrollment requests. All caught up!
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const isFull = req.currentEnrolled >= req.maxCapacity;
              return (
                <div
                  key={req.enrollmentId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {req.courseCode}
                      </span>
                      <span className="font-semibold text-sm text-slate-900">
                        {req.courseTitle}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          isFull
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        Seats: {req.currentEnrolled}/{req.maxCapacity}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Student:{" "}
                      <span className="font-semibold text-slate-800">
                        {req.studentName || "Unnamed Student"}
                      </span>{" "}
                      ({req.studentEmail}) • Requested{" "}
                      {new Date(req.requestedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:w-1/2">
                    <input
                      type="text"
                      value={notes[req.enrollmentId] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [req.enrollmentId]: e.target.value,
                        }))
                      }
                      placeholder="Advisor note (required to reject)..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === req.enrollmentId || isFull}
                        onClick={() => handleReview(req, true)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyId === req.enrollmentId}
                        onClick={() => handleReview(req, false)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}