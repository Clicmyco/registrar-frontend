// src/App.jsx
import { useState } from "react";

import TopBanner from "./components/TopBanner";
import Header from "./components/Header";
import Home from "./pages/Home";
import About from "./pages/About";
import Values from "./pages/Value";
import Services from "./pages/Services";
import Dashboard from "./pages/Dashboard";
import AuthPreview from "./pages/AuthPreview";
import Footer from "./components/Footer";
import AdminDashboard from "./pages/AdminDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import { getStoredUser, logoutUser } from "./services/api";

export default function App() {
  const [currentView, setCurrentView] = useState("home");

  // Initialize user session from localStorage if a valid JWT already exists
  const [user, setUser] = useState(() => getStoredUser());

  const isStaff = (u) =>
    u?.roles?.some((r) =>
      ["ROLE_ADMIN", "ROLE_REGISTRAR", "ROLE_ADVISOR"].includes(r)
    );

  const isInstructor = (u) => u?.roles?.includes("ROLE_INSTRUCTOR");

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setCurrentView("home");
  };

  const renderDashboardView = () => {
    if (isStaff(user)) {
      return <AdminDashboard user={user} navigate={setCurrentView} />;
    }
    if (isInstructor(user)) {
      return <InstructorDashboard user={user} navigate={setCurrentView} />;
    }
    return <Dashboard user={user} navigate={setCurrentView} />;
  };

  const renderView = () => {
    switch (currentView) {
      case "home":
        return <Home navigate={setCurrentView} user={user} />;
      case "about":
        return <About />;
      case "values":
        return <Values />;
      case "services":
        return <Services />;
      case "dashboard":
        return renderDashboardView();
      case "instructor-dashboard":
        return <InstructorDashboard user={user} navigate={setCurrentView} />;
      case "auth-preview":
        return (
          <AuthPreview
            user={user}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        );
      default:
        return <Home navigate={setCurrentView} user={user} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBanner user={user} onLogout={handleLogout} navigate={setCurrentView} />
      <Header
        navigate={setCurrentView}
        currentView={currentView}
        user={user}
        onLogout={handleLogout}
      />
      {renderView()}
      <Footer navigate={setCurrentView} />
    </div>
  );
}