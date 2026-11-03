import { Link, useNavigate } from "react-router-dom";
import { DEFAULT_GROUPS } from "../lib/groups";
import { useTheme } from "../hooks/useTheme";

export default function Sidebar({ name, activeGroup }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <aside className="w-[280px] shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[9px] bg-indigo-600 flex items-center justify-center shrink-0" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 4h16v12H8l-4 4V4z" stroke="white" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-[15px] font-bold text-gray-900 dark:text-white">ProgChat</span>
      </div>

      <div className="mx-4 mb-5 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 flex flex-col">
          <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{name}</span>
          <span className="text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" aria-hidden="true" />
            Online
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/?switch=1")}
          aria-label="Log out and switch name"
          title="Log out"
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-500 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="px-4 flex-1 overflow-auto">
        <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider px-2.5 pb-2">
          GROUPS
        </div>
        <nav className="flex flex-col gap-0.5" aria-label="Groups">
          {DEFAULT_GROUPS.map((g) => {
            const isActive = g === activeGroup;
            return (
              <Link
                key={g}
                to={`/chat/${encodeURIComponent(g)}`}
                className={`flex items-center gap-2 px-2.5 py-2.5 rounded-[10px] text-sm transition ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span
                  className={isActive ? "text-indigo-300 dark:text-indigo-400" : "text-gray-300 dark:text-gray-600"}
                  aria-hidden="true"
                >
                  #
                </span>
                {g}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-gray-400 font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          Dark mode
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label="Toggle dark mode"
          onClick={toggleTheme}
          className={`w-10 h-[22px] rounded-full relative shrink-0 transition-colors ${
            isDark ? "bg-indigo-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
              isDark ? "translate-x-[20px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </aside>
  );
}
