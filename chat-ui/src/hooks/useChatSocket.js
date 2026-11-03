import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8088/api";
const WS_URL = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8088/ws/chat";

export function useChatSocket(groupId, sender) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // A late response from a group the user has since switched away from
  // must not overwrite the messages of the group they're now viewing.
  useEffect(() => {
    let ignore = false;
    axios
      .get(`${BASE_URL}/messages/${encodeURIComponent(groupId)}`)
      .then((res) => {
        if (!ignore) setMessages(res.data);
      })
      .catch((err) => console.error("Failed to load messages:", err));
    return () => {
      ignore = true;
    };
  }, [groupId]);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/${encodeURIComponent(groupId)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "typing") {
          if (data.sender !== sender) {
            setTypingUser(data.sender);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
          }
          return;
        }

        setMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      } catch (err) {
        console.error("Parse error:", err);
      }
    };

    return () => {
      clearTimeout(typingTimeoutRef.current);
      ws.close();
    };
  }, [groupId, sender]);

  const sendTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", sender, groupId }));
    }
  }, [sender, groupId]);

  const sendMessage = useCallback(
    (content) => {
      if (!content.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify({ sender, groupId, content }));
    },
    [sender, groupId],
  );

  return { messages, connected, typingUser, sendTyping, sendMessage };
}
