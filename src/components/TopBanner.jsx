// src/components/TopBanner.jsx

export default function TopBanner({ user, navigate }) {
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Left Side: Live API Status Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <i className="fa-solid fa-circle text-[8px] mr-1.5 animate-pulse"></i>
            SPRING BOOT API CONNECTED
          </span>
          <span className="text-slate-400 hidden sm:inline">
            HSIS Academic Registrar • JWT Stateless Session
          </span>
        </div>

        {/* Right Side: Live Authenticated User Info */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <span className="text-slate-300">
                <i className="fa-regular fa-user mr-1.5 text-slate-400"></i>
                {user.fullName || user.email}
              </span>
              <span
                className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                  isAdmin
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                }`}
              >
                {isAdmin ? "ADMIN" : "STUDENT"}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Public Visitor</span>
              <button
                type="button"
                onClick={() => navigate("auth-preview")}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}