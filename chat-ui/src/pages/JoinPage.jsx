import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStoredName, setStoredName } from "../lib/identity";
import { DEFAULT_GROUPS, getLastGroup, setLastGroup } from "../lib/groups";

export default function JoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectGroup = searchParams.get("redirect");
  const switching = searchParams.get("switch") === "1";

  const [name, setName] = useState(() => getStoredName() ?? "");
  const [group, setGroup] = useState(
    () => redirectGroup ?? getLastGroup() ?? DEFAULT_GROUPS[0],
  );

  // Already have an identity and not explicitly switching -skip straight
  // to the chat instead of making a returning user re-enter their name.
  useEffect(() => {
    if (switching) return;
    const stored = getStoredName();
    if (stored) {
      const target = redirectGroup ?? getLastGroup() ?? DEFAULT_GROUPS[0];
      navigate(`/chat/${encodeURIComponent(target)}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setStoredName(trimmed);
    setLastGroup(group);
    navigate(`/chat/${encodeURIComponent(group)}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-gray-950 flex items-center justify-center p-10 font-sans">
      <div className="w-full max-w-[420px] bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-[0_20px_40px_-12px_rgba(17,24,39,0.10)] px-10 py-12 flex flex-col gap-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 4h16v12H8l-4 4V4z" stroke="white" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="m-0 text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              ProgChat
            </h1>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              The Programmers Community Hub
            </p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
              Enter your name:
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rashik"
              autoFocus
              className="h-12 rounded-xl border border-gray-200 dark:border-gray-700 px-4 text-[15px] text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-indigo-400 transition"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="group" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">
              Enter the group:
            </label>
            <select
              id="group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="h-12 rounded-xl border border-gray-200 dark:border-gray-700 px-4 text-[15px] text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-indigo-400 transition"
            >
              {DEFAULT_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="h-[50px] rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition"
          >
            Join chat
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>

        <p className="m-0 text-center text-xs text-gray-400 dark:text-gray-500">
            Free to use for now
        </p>
      </div>
    </div>
  );
}
