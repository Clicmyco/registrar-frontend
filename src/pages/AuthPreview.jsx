// src/pages/AuthPreview.jsx
import { useState } from "react";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  saveSession,
} from "../services/api";

export default function AuthPreview({ user, onLoginSuccess, onLogout }) {
  // 4-mode state machine: 'login' | 'register' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState("login");

  // Profile & Auth fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Network UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const switchMode = (nextMode) => {
    setAuthMode(nextMode);
    setStatusMessage("");
    setIsError(false);
    setPassword("");
    setConfirmPassword("");
    if (nextMode !== "reset") {
      setOtpCode("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    setIsError(false);

    // --- 1. LOGIN ---
    if (authMode === "login") {
      if (!email.trim() || !password) {
        setIsError(true);
        setStatusMessage("Please enter both your email and password.");
        return;
      }

      setIsLoading(true);
      try {
        const response = await loginUser(email.trim(), password);
        const decodedUser = saveSession(response);
        if (!decodedUser) {
          throw new Error("Login succeeded, but the server returned an invalid token.");
        }
        onLoginSuccess(decodedUser);
      } catch (err) {
        setIsError(true);
        setStatusMessage(err.message || "Authentication failed. Please check your credentials.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // --- 2. REGISTER ---
    if (authMode === "register") {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
        setIsError(true);
        setStatusMessage("Please fill in all required fields.");
        return;
      }
      if (password.length < 6) {
        setIsError(true);
        setStatusMessage("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setIsError(true);
        setStatusMessage("Passwords do not match.");
        return;
      }

      setIsLoading(true);
      try {
        await registerUser({
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        });
        setIsError(false);
        setStatusMessage("Account created successfully! Please sign in with your new credentials.");
        setAuthMode("login");
        setPassword("");
        setConfirmPassword("");
      } catch (err) {
        setIsError(true);
        setStatusMessage(err.message || "Registration failed.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // --- 3. FORGOT PASSWORD (Request 6-digit OTP) ---
    if (authMode === "forgot") {
      if (!email.trim()) {
        setIsError(true);
        setStatusMessage("Please enter your registered email address.");
        return;
      }

      setIsLoading(true);
      try {
        const msg = await requestPasswordReset(email.trim());
        setIsError(false);
        setStatusMessage(msg || "A 6-digit OTP has been sent to your Gmail.");
        setAuthMode("reset");
      } catch (err) {
        setIsError(true);
        setStatusMessage(err.message || "Could not send reset code.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // --- 4. RESET PASSWORD (Verify OTP & Save New Password) ---
    if (authMode === "reset") {
      if (otpCode.trim().length !== 6) {
        setIsError(true);
        setStatusMessage("Please enter the 6-digit confirmation code sent to your email.");
        return;
      }
      if (password.length < 6) {
        setIsError(true);
        setStatusMessage("New password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setIsError(true);
        setStatusMessage("Passwords do not match.");
        return;
      }

      setIsLoading(true);
      try {
        const msg = await resetPassword(email.trim(), otpCode.trim(), password);
        setIsError(false);
        setStatusMessage(msg || "Password updated! You can now sign in.");
        setAuthMode("login");
        setOtpCode("");
        setPassword("");
        setConfirmPassword("");
      } catch (err) {
        setIsError(true);
        setStatusMessage(err.message || "Failed to reset password.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Dynamic header text & icon based on current mode
  const headerConfig = {
    login: {
      icon: "fa-lock",
      title: "Sign in to HSIS Portal",
      subtitle: "Enter your university credentials to access course registration.",
    },
    register: {
      icon: "fa-user-plus",
      title: "Create Student Account",
      subtitle: "Enter your academic profile details to register as a student.",
    },
    forgot: {
      icon: "fa-envelope-open-text",
      title: "Reset Your Password",
      subtitle: "Enter your Gmail address and we will send you a 6-digit OTP.",
    },
    reset: {
      icon: "fa-key",
      title: "Enter Confirmation OTP",
      subtitle: `Enter the 6-digit code sent to ${email} and choose a new password.`,
    },
  }[authMode];

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: Auth Card (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1.5 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold shadow-sm">
                <i className={`fa-solid ${user ? "fa-shield-halved" : headerConfig.icon}`}></i>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Secure Portal
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 pt-2">
              {user ? "Active Session" : headerConfig.title}
            </h2>
            <p className="text-xs text-slate-500">
              {user
                ? "You are currently authenticated with a verified JWT session."
                : headerConfig.subtitle}
            </p>
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Signed In As
                </div>
                <div className="text-base font-bold text-slate-900">
                  {user.fullName || user.email}
                </div>
                <div className="text-xs text-slate-600">{user.email}</div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition shadow-sm"
              >
                <i className="fa-solid fa-right-from-bracket mr-2"></i>Sign Out
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* REGISTER ONLY: Name Fields */}
                {authMode === "register" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="firstName" className="block text-xs font-semibold text-slate-700 mb-1">
                          First Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="e.g. Abebe"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="middleName" className="block text-xs font-semibold text-slate-700 mb-1">
                          Middle Name <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          id="middleName"
                          type="text"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          placeholder="e.g. Tadesse"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-xs font-semibold text-slate-700 mb-1">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Bikila"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* LOGIN, REGISTER, FORGOT: Email Input */}
                {authMode !== "reset" && (
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address {authMode === "register" && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* RESET ONLY: 6-Digit OTP Input */}
                {authMode === "reset" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="otpCode" className="block text-xs font-semibold text-slate-700">
                        6-Digit Confirmation OTP <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Resend / Change Email
                      </button>
                    </div>
                    <input
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-lg tracking-[0.4em] font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* LOGIN, REGISTER, RESET: Password Input */}
                {authMode !== "forgot" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                        {authMode === "reset" ? "New Password" : "Password"}{" "}
                        {(authMode === "register" || authMode === "reset") && (
                          <span className="text-rose-500">*</span>
                        )}
                      </label>
                     
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                          authMode === "login" ? "Enter your password" : "Minimum 6 characters"
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                      </button>
                    </div>

                     {authMode === "login" && (
                        <button
                          type="button"
                          onClick={() => switchMode("forgot")}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mb1"
                        >
                          Forgot password?
                        </button>
                      )}

                  </div>
                )}

                {/* REGISTER & RESET: Confirm Password */}
                {(authMode === "register" || authMode === "reset") && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm {authMode === "reset" ? "New " : ""}Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm transition shadow-sm"
                >
                  {isLoading
                    ? "Please wait..."
                    : authMode === "login"
                    ? "Sign In"
                    : authMode === "register"
                    ? "Create Account"
                    : authMode === "forgot"
                    ? "Send 6-Digit OTP"
                    : "Verify OTP & Update Password"}
                </button>
              </form>

              {/* Live Status / Error Box */}
              {statusMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    isError
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <div className="font-semibold">
                    <i
                      className={`fa-solid ${
                        isError ? "fa-circle-exclamation" : "fa-circle-check"
                      } mr-1.5`}
                    ></i>
                    {isError ? "Unable to Continue" : "Success"}
                  </div>
                  <p>{statusMessage}</p>
                </div>
              )}

              {/* Bottom Mode Navigation */}
              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
                {authMode === "login" ? (
                  <>
                    New student at HSIS?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      Create a new account
                    </button>
                  </>
                ) : (
                  <>
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      Back to Sign in
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Defensive Guide (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Defensive Engineering Reference
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              Protecting Portals Against Lookalikes
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Because SPA HTML/CSS shells are publicly visible, registrars rely on cryptographic origin binding to prevent credential harvesting.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
              <i className="fa-solid fa-key text-indigo-600 mt-1"></i>
              <div>
                <div className="font-bold text-sm text-slate-900">1. Origin-Bound WebAuthn / FIDO2</div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Hardware passkeys cryptographically bind authentication to the exact browser origin, neutralizing lookalike domains.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
              <i className="fa-solid fa-code text-emerald-600 mt-1"></i>
              <div>
                <div className="font-bold text-sm text-slate-900">2. Content Security Policy (CSP)</div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Enforcing strict frame-ancestors headers blocks unauthorized iframe embedding (clickjacking).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
              <i className="fa-solid fa-certificate text-amber-600 mt-1"></i>
              <div>
                <div className="font-bold text-sm text-slate-900">
                  3. Certificate Transparency &amp; CAA DNS Records
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Publishing DNS Certification Authority Authorization (CAA) records and monitoring Certificate Transparency logs alerts administrators when lookalike domains request TLS certificates.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3">
              <i className="fa-solid fa-shield-virus text-purple-600 mt-1"></i>
              <div>
                <div className="font-bold text-sm text-slate-900">
                  4. Cross-Origin Resource Sharing (CORS) &amp; SameSite Cookies
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Restricting API endpoints with strict CORS allowlists and{" "}
                  <code className="bg-slate-200 px-1 rounded">SameSite=Strict; HttpOnly; Secure</code>{" "}
                  session cookies prevents unauthorized third-party frontends from querying backend registrar APIs.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}