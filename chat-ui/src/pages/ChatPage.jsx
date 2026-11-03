import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useChatSocket } from "../hooks/useChatSocket";
import { getStoredName } from "../lib/identity";
import { setLastGroup } from "../lib/groups";
import { formatSmartTime } from "../lib/time";

export default function ChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [name] = useState(() => getStoredName());
  const [content, setContent] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!name) {
      navigate(`/?redirect=${encodeURIComponent(groupId)}`, { replace: true });
      return;
    }
    setLastGroup(groupId);
  }, [name, groupId, navigate]);

  const { messages, connected, typingUser, sendTyping, sendMessage } = useChatSocket(groupId, name);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // Redirecting to the join screen -render nothing for this one frame.
  if (!name) return null;

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage(content);
    setContent("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex font-sans bg-white dark:bg-gray-950">
      <Sidebar name={name} activeGroup={groupId} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-7">
          <span className="text-base font-bold text-gray-900 dark:text-white"># {groupId}</span>
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full ${
              connected
                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${connected ? "bg-green-500" : "bg-red-500"}`} aria-hidden="true" />
            {connected ? "Live" : "Reconnecting…"}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-7 flex flex-col gap-[18px] bg-white dark:bg-gray-950">
          {messages.map((msg, idx) => {
            const isOwn = msg.sender === name;
            const prev = messages[idx - 1];
            const grouped = prev && prev.sender === msg.sender;

            if (isOwn) {
              return (
                <div key={msg.id ?? idx} className="flex justify-end">
                  <div className="max-w-[70%] flex flex-col items-end">
                    {!grouped && (
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">
                        {formatSmartTime(msg.timestamp)}
                      </span>
                    )}
                    <div className="bg-indigo-600 text-white text-sm leading-relaxed px-3.5 py-2.5 rounded-[16px_4px_16px_16px]">
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id ?? idx} className={`flex items-start gap-2.5 max-w-[70%] ${grouped ? "pl-[42px]" : ""}`}>
                {!grouped && (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                    {msg.sender?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  {!grouped && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{msg.sender}</span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatSmartTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <div className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm leading-relaxed px-3.5 py-2.5 rounded-[4px_16px_16px_16px]">
                    {msg.content}
                  </div>
                  {grouped && (
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      {formatSmartTime(msg.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {typingUser && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-pink-500 text-white text-[13px] font-bold flex items-center justify-center shrink-0">
                {typingUser.charAt(0).toUpperCase()}
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-[4px_16px_16px_16px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block animate-bounce [animation-delay:0.1s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="px-7 py-5 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 shrink-0">
          <label htmlFor="composer" className="sr-only">
            Message
          </label>
          <input
            id="composer"
            type="text"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              sendTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${groupId}`}
            className="flex-1 h-12 rounded-full border border-gray-200 dark:border-gray-700 px-5 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 outline-none focus:border-indigo-400 transition"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!content.trim() || !connected}
            aria-label="Send message"
            className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
