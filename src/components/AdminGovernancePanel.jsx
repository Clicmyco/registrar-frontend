import { useState, useEffect } from "react";
import {
  getAdminUsers,
  updateUserRoles,
  updateUserStatus,
  getAuditLogs,
} from "../services/api";

const ALL_ROLES = [
  "ROLE_STUDENT",
  "ROLE_ADVISOR",
  "ROLE_REGISTRAR",
  "ROLE_ADMIN",
  "ROLE_INSTRUCTOR",
];

export default function AdminGovernancePanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [usersData, logsData] = await Promise.all([
        getAdminUsers(),
        getAuditLogs(),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to load admin governance data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRole = async (user, roleName) => {
    const hasRole = user.roles.includes(roleName);
    const nextRoles = hasRole
      ? user.roles.filter((r) => r !== roleName)
      : [...user.roles, roleName];

    if (nextRoles.length === 0) {
      setFeedback({
        type: "error",
        text: "A user must have at least one assigned role.",
      });
      return;
    }

    setBusyId(user.id);
    setFeedback(null);
    try {
      const updated = await updateUserRoles(user.id, nextRoles);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setFeedback({
        type: "success",
        text: `Updated roles for ${updated.email}.`,
      });
      const freshLogs = await getAuditLogs();
      setLogs(Array.isArray(freshLogs) ? freshLogs : []);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Could not update user roles.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (user) => {
    setBusyId(user.id);
    setFeedback(null);
    try {
      const updated = await updateUserStatus(user.id, !user.active);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setFeedback({
        type: "success",
        text: `${updated.email} is now ${updated.active ? "Active" : "Inactive"}.`,
      });
      const freshLogs = await getAuditLogs();
      setLogs(Array.isArray(freshLogs) ? freshLogs : []);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Could not update account status.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Tabs */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            System Governance & Security
          </h2>
          <p className="text-xs text-slate-500">
            Manage RBAC permissions, account status, and immutable audit trails
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "users"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Users & Roles ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "logs"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Audit Logs ({logs.length})
          </button>
          <button
            onClick={loadData}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            title="Refresh data"
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

      {/* Body */}
      <div className="p-5">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading governance records...
          </div>
        ) : activeTab === "users" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Assigned Roles (Click to Toggle)</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900">
                        {u.fullName || "Unnamed User"}
                      </div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_ROLES.map((role) => {
                          const assigned = u.roles.includes(role);
                          return (
                            <button
                              key={role}
                              disabled={busyId === u.id}
                              onClick={() => handleToggleRole(u, role)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition disabled:opacity-50 ${
                                assigned
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                              }`}
                            >
                              {role.replace("ROLE_", "")}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        disabled={busyId === u.id}
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                          u.active
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {u.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 uppercase text-slate-500">
                  <th className="py-3 pr-4">Timestamp</th>
                  <th className="py-3 pr-4">Actor</th>
                  <th className="py-3 pr-4">Action</th>
                  <th className="py-3 pr-4">Target</th>
                  <th className="py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 pr-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-slate-800">
                        {log.actorEmail}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {log.targetEntity}
                      </td>
                      <td className="py-2.5 text-slate-700">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}