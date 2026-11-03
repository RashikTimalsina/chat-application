import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:8088/api";
const WS_URL = "ws://localhost:8088/ws/chat";
const GROUP_ID = "Java";

export default function App() {
  const [sender, setSender] = useState("Abdul");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load message history
  useEffect(() => {
    axios
      .get(`${BASE_URL}/messages/${GROUP_ID}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Failed to load messages:", err));
  }, []);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket setup
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/${GROUP_ID}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle typing indicator
        if (data.type === "typing") {
          if (data.sender !== sender) {
            setTypingUser(data.sender);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(
              () => setTypingUser(null),
              2000,
            );
          }
          return;
        }

        // Handle regular message
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      } catch (err) {
        console.error("Parse error:", err);
      }
    };

    return () => ws.close();
  }, [sender]);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "typing", sender, groupId: GROUP_ID }),
      );
    }
  }, [sender]);

  const sendMessage = () => {
    if (!content.trim() || !sender.trim()) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ sender, groupId: GROUP_ID, content }),
      );
      setContent("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-lg flex flex-col"
        style={{ height: "90vh" }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Reactive Chat</h1>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500" : "bg-red-400"}`}
            />
            <span className="text-sm text-gray-500">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg, idx) => {
            const isOwn = msg.sender === sender;
            return (
              <div
                key={msg.id ?? idx}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-3 shadow-sm
                  ${isOwn ? "bg-green-100 rounded-br-sm" : "bg-white rounded-bl-sm border border-gray-200"}`}
                >
                  <p
                    className={`text-xs font-semibold mb-1 ${isOwn ? "text-green-700 text-right" : "text-gray-500"}`}
                  >
                    {msg.sender}
                  </p>
                  <p className="text-gray-800 text-sm">{msg.content}</p>
                  <p
                    className={`text-xs text-gray-400 mt-1 ${isOwn ? "text-right" : ""}`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingUser && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                <p className="text-xs text-gray-400 italic">
                  {typingUser} is typing
                  <span className="inline-flex gap-0.5 ml-1">
                    <span className="animate-bounce">●</span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    >
                      ●
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    >
                      ●
                    </span>
                  </span>
                </p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="px-5 py-4 border-t border-gray-200 flex items-center gap-3">
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="Your name"
            className="w-28 border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 transition"
          />
          <input
            type="text"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              sendTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message...."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition"
          />
          <button
            onClick={sendMessage}
            disabled={!content.trim() || !connected}
            className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  ); 
}
