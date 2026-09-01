import { useCallback, useEffect, useRef, useState } from "react";

export type ChatStatus = "idle" | "connecting" | "connected" | "error" | "closed";

interface Options {
  channel: string;
  enabled: boolean;
  onMessage: (user: string, message: string) => void;
}

/**
 * Read-only anonymous connection to Twitch chat (justinfan account).
 * No token needed: viewers simply type !play in the channel.
 */
export function useTwitchChat({ channel, enabled, onMessage }: Options) {
  const [status, setStatus] = useState<ChatStatus>("idle");
  const handler = useRef(onMessage);
  handler.current = onMessage;

  useEffect(() => {
    if (!enabled || !channel) {
      setStatus("idle");
      return;
    }
    if (typeof window === "undefined") return;

    setStatus("connecting");
    const socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    socket.onopen = () => {
      socket.send(`NICK justinfan${Math.floor(Math.random() * 90000) + 10000}`);
      socket.send(`JOIN #${channel.toLowerCase()}`);
      setStatus("connected");
    };

    socket.onmessage = (event) => {
      const raw = String(event.data);
      for (const line of raw.split("\r\n")) {
        if (!line) continue;
        if (line.startsWith("PING")) {
          socket.send("PONG :tmi.twitch.tv");
          continue;
        }
        const match = /^:(\w+)!\S+ PRIVMSG #\S+ :(.*)$/.exec(line);
        if (match) handler.current(match[1]!, match[2]!.trim());
      }
    };

    socket.onerror = () => setStatus("error");
    socket.onclose = () => setStatus((s) => (s === "error" ? s : "closed"));

    return () => socket.close();
  }, [channel, enabled]);

  const reset = useCallback(() => setStatus("idle"), []);
  return { status, reset };
}
