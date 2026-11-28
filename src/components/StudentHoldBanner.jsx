// src/components/StudentHoldBanner.jsx
import { useState, useEffect } from "react";
import { getMyActiveHolds } from "../services/api";

export default function StudentHoldBanner() {
  const [holds, setHolds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    getMyActiveHolds()
      .then((data) => {
        if (isMounted) {
          setHolds(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        // Silently ignore if endpoint is unavailable for non-student roles
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (holds.length === 0) return null;

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center text-sm font-bold">
            !
          </span>
          <div>
            <h3 className="text-sm font-bold text-rose-900">
              Active Registration Hold{holds.length > 1 ? "s" : ""} on Your Account ({holds.length})
            </h3>
            <p className="text-xs text-rose-700">
              New course enrollment requests are blocked until the hold{holds.length > 1 ? "s" : ""} below{" "}
              {holds.length > 1 ? "are" : "is"} cleared by Advising or the Registrar.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-rose-200/70 bg-white/80 rounded-xl border border-rose-200 px-4">
        {holds.map((hold) => (
          <div
            key={hold.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold uppercase text-[11px]">
                  {hold.holdType} HOLD
                </span>
                <span className="font-semibold text-slate-900">{hold.reason}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Placed by {hold.placedByEmail}
                {hold.placedAt ? ` on ${new Date(hold.placedAt).toLocaleDateString()}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}