// src/components/Header.jsx
import { useState } from "react";

export default function Header({ navigate, currentView, user, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const handleNav = (viewName) => {
    navigate(viewName);
    setIsMobileMenuOpen(false);
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    onLogout();
  };

  const getBtnStyle = (viewName) => {
    return currentView === viewName
      ? "px-3.5 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700 transition"
      : "px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition";
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => navigate("home")}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-indigo-800 transition">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base leading-tight tracking-tight">
                HSIS Portal
              </div>
              <div className="text-xs text-slate-500">School of Computer Science</div>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button onClick={() => navigate("home")} className={getBtnStyle("home")}>
              Home
            </button>
            <button onClick={() => navigate("about")} className={getBtnStyle("about")}>
              About Us
            </button>
            <button onClick={() => navigate("values")} className={getBtnStyle("values")}>
              Our Values
            </button>
            <button onClick={() => navigate("services")} className={getBtnStyle("services")}>
              Services
            </button>
            <button onClick={() => navigate("dashboard")} className={getBtnStyle("dashboard")}>
              {isAdmin ? "Registrar Portal" : "Student Registrar"}
            </button>

            {/* Right Action Button: Sign Out if logged in, Sign In if guest */}
            {user ? (
              <div className="ml-2 flex items-center gap-2">
                <button
                  onClick={() => navigate("auth-preview")}
                  title="View active session & security"
                  className={getBtnStyle("auth-preview")}
                >
                  <i className="fa-solid fa-shield-halved"></i>
                </button>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                >
                  <i className="fa-solid fa-right-from-bracket mr-1.5"></i>Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("auth-preview")}
                className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
              >
                <i className="fa-solid fa-shield-halved mr-1.5"></i>Sign In
              </button>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <i
                className={
                  isMobileMenuOpen ? "fa-solid fa-xmark text-lg" : "fa-solid fa-bars text-lg"
                }
              ></i>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <button onClick={() => handleNav("home")} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Home
          </button>
          <button onClick={() => handleNav("about")} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            About Us
          </button>
          <button onClick={() => handleNav("values")} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Our Values
          </button>
          <button onClick={() => handleNav("services")} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Services
          </button>
          <button onClick={() => handleNav("dashboard")} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            {isAdmin ? "Registrar Portal" : "Student Registrar"}
          </button>

          {user ? (
            <button
              onClick={handleLogoutClick}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 bg-rose-50"
            >
              <i className="fa-solid fa-right-from-bracket mr-1.5"></i>Sign Out ({user.email})
            </button>
          ) : (
            <button
              onClick={() => handleNav("auth-preview")}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50"
            >
              <i className="fa-solid fa-shield-halved mr-1.5"></i>Sign In
            </button>
          )}
        </div>
      )}
    </header>
  );
}