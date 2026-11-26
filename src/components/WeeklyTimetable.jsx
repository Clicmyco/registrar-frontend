const WEEKDAYS = [
  { code: "MON", label: "Monday" },
  { code: "TUE", label: "Tuesday" },
  { code: "WED", label: "Wednesday" },
  { code: "THU", label: "Thursday" },
  { code: "FRI", label: "Friday" },
];

export default function WeeklyTimetable({ enrollments = [], termLabel }) {
  const scheduled = enrollments.filter(
    (e) =>
      (e.status === "ENROLLED" || e.status === "PENDING_APPROVAL") &&
      e.meetingDays &&
      e.startTime &&
      e.endTime
  );

  const unscheduled = enrollments.filter(
    (e) =>
      (e.status === "ENROLLED" || e.status === "PENDING_APPROVAL") &&
      (!e.meetingDays || !e.startTime || !e.endTime)
  );

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Weekly Class Timetable
          </h3>
          <p className="text-xs text-slate-500">
            {termLabel ? `Schedule for ${termLabel}` : "Current enrolled & pending classes"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Enrolled
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>Pending Approval
          </span>
        </div>
      </div>

      {scheduled.length === 0 && unscheduled.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No enrolled or pending classes in this semester yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {WEEKDAYS.map((day) => {
              const dayClasses = scheduled
                .filter((item) =>
                  item.meetingDays
                    .split(",")
                    .map((d) => d.trim().toUpperCase())
                    .includes(day.code)
                )
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <div
                  key={day.code}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col min-h-[170px]"
                >
                  <div className="px-3 py-2 border-b border-slate-200 bg-slate-100/80 rounded-t-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{day.label}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {dayClasses.length}
                    </span>
                  </div>

                  <div className="p-2.5 space-y-2 flex-1">
                    {dayClasses.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-slate-400 py-6">
                        No classes
                      </div>
                    ) : (
                      dayClasses.map((cls) => {
                        const isEnrolled = cls.status === "ENROLLED";
                        return (
                          <div
                            key={`${day.code}-${cls.enrollmentId}`}
                            className={`p-2.5 rounded-lg border text-xs shadow-xs ${
                              isEnrolled
                                ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                                : "bg-amber-50/80 border-amber-200 text-amber-950"
                            }`}
                          >
                            <div className="font-mono text-[11px] font-bold">
                              {cls.startTime.slice(0, 5)} – {cls.endTime.slice(0, 5)}
                            </div>
                            <div className="font-bold mt-0.5">{cls.courseCode}</div>
                            <div className="text-[11px] text-slate-700 line-clamp-1">
                              {cls.courseTitle}
                            </div>
                            {cls.room && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                <i className="fa-solid fa-location-dot mr-1"></i>
                                {cls.room}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {unscheduled.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">TBA / Unscheduled:</span>
              {unscheduled.map((item) => (
                <span
                  key={item.enrollmentId}
                  className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium"
                >
                  {item.courseCode} — {item.courseTitle}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}