import { useState, useEffect, useRef } from "react";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/api";

const TYPE_STYLES = {
  WAITLIST_PROMOTED: {
    label: "Waitlist",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "fa-solid fa-arrow-up-right-dots text-emerald-600",
  },
  ENROLLMENT_UPDATE: {
    label: "Enrollment",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: "fa-solid fa-graduation-cap text-indigo-600",
  },
  HOLD_ALERT: {
    label: "Hold Alert",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "fa-solid fa-circle-exclamation text-rose-600",
  },
  SYSTEM: {
    label: "System",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "fa-solid fa-bell text-slate-600",
  },
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadNotificationCount();
      setUnreadCount(data?.unreadCount ?? 0);
    } catch {
      // Silently ignore transient polling errors
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const list = await getMyNotifications();
      const items = Array.isArray(list) ? list : [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch {
      // Keep existing state if fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleToggleDropdown = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      await fetchNotifications();
    }
  };

  const handleItemClick = async (item) => {
    if (item.read) return;
    try {
      await markNotificationAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore error and allow retry
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore error
    } finally {
      setIsMarkingAll(false);
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggleDropdown}
        aria-label="Notifications"
        className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <i className="fa-solid fa-bell text-sm"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={isMarkingAll}
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                {isMarkingAll ? "Updating..." : "Mark all as read"}
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-500">
                No notifications yet. Waitlist promotions and enrollment updates will appear here.
              </div>
            ) : (
              notifications.map((item) => {
                const style = TYPE_STYLES[item.type] || TYPE_STYLES.SYSTEM;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left px-4 py-3 transition flex items-start gap-3 ${
                      item.read ? "bg-white hover:bg-slate-50" : "bg-indigo-50/40 hover:bg-indigo-50/70"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                      <i className={`${style.icon} text-xs`}></i>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] font-bold ${style.badge}`}
                        >
                          {style.label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatTimestamp(item.createdAt)}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="truncate">{item.title}</span>
                        {!item.read && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-indigo-600"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}