// src/components/RegistrationWaitlistTracker.jsx
const STATUS_ORDER = {
  WAITLISTED: 1,
  PENDING_APPROVAL: 2,
  REJECTED: 3,
};

export default function RegistrationWaitlistTracker({
  enrollments,
  courses,
  actionLoadingId,
  onDrop,
  onEnroll,
}) {
  const trackedItems = enrollments
    .filter((e) =>
      ["WAITLISTED", "PENDING_APPROVAL", "REJECTED"].includes(e.status)
    )
    .sort(
      (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
    );

  const waitlistCount = trackedItems.filter(
    (e) => e.status === "WAITLISTED"
  ).length;
  const pendingCount = trackedItems.filter(
    (e) => e.status === "PENDING_APPROVAL"
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs shrink-0">
            <i className="fa-solid fa-list-check"></i>
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Registration &amp; Waitlist Tracker
            </h3>
            <p className="text-[11px] text-slate-500">
              Live queue positions, pending requests &amp; advisor notes
            </p>
          </div>
        </div>

        {trackedItems.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            {waitlistCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                {waitlistCount} waitlisted
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                {pendingCount} pending
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {trackedItems.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-500">
          <i className="fa-solid fa-circle-check text-emerald-600 text-sm shrink-0"></i>
          <span>
            No waitlisted, pending, or declined requests right now.
          </span>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {trackedItems.map((item) => {
            const isBusy = actionLoadingId === item.courseId;
            const catalogCourse = courses.find((c) => c.id === item.courseId);
            const isFull = catalogCourse
              ? (catalogCourse.enrolledCount ?? 0) >=
                (catalogCourse.maxCapacity ?? 30)
              : false;

            const isWaitlisted = item.status === "WAITLISTED";
            const isPending = item.status === "PENDING_APPROVAL";
            const isRejected = item.status === "REJECTED";

            return (
              <div
                key={item.enrollmentId}
                className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isWaitlisted
                    ? "bg-purple-50/40 border-purple-200"
                    : isPending
                    ? "bg-amber-50/40 border-amber-200"
                    : "bg-rose-50/40 border-rose-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.courseCode} — {item.courseTitle || item.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <span>{item.credits} Cr</span>
                      {item.termCode && (
                        <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 font-mono text-[10px]">
                          {item.termCode}
                        </span>
                      )}
                      {item.meetingDays && item.startTime && (
                        <span>
                          • {item.meetingDays} {item.startTime.slice(0, 5)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status / Queue Pill */}
                  {isWaitlisted ? (
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                      {item.waitlistPosition
                        ? `Queue #${item.waitlistPosition}`
                        : "Waitlisted"}
                    </span>
                  ) : isPending ? (
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      Pending Approval
                    </span>
                  ) : (
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                      Declined
                    </span>
                  )}
                </div>

                {/* Advisor Note / Auto-Promotion Callout */}
                {item.advisorNote && (
                  <div
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] leading-relaxed ${
                      isRejected
                        ? "bg-white/90 border-rose-200 text-rose-900"
                        : "bg-white/80 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="font-semibold">
                      {isRejected ? "Advisor reason: " : "Advisor note: "}
                    </span>
                    {item.advisorNote}
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-slate-500">
                    {isWaitlisted
                      ? "Auto-promotes to approval when a seat opens"
                      : isPending
                      ? "Awaiting advisor / registrar review"
                      : "You may submit a new request if eligible"}
                  </span>

                  {isWaitlisted && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onDrop(item.enrollmentId, item.courseId)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white text-purple-700 border border-purple-200 hover:bg-purple-100 disabled:opacity-50 transition"
                    >
                      {isBusy ? "Leaving..." : "Leave Waitlist"}
                    </button>
                  )}

                  {isPending && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onDrop(item.enrollmentId, item.courseId)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 disabled:opacity-50 transition"
                    >
                      {isBusy ? "Cancelling..." : "Cancel Request"}
                    </button>
                  )}

                  {isRejected && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onEnroll(item.courseId)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border disabled:opacity-50 transition ${
                        isFull
                          ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                          : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      {isBusy
                        ? "Submitting..."
                        : isFull
                        ? "Join Waitlist"
                        : "Re-Request"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}