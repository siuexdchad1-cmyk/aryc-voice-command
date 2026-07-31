import { useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { parseCommand } from "./aryc-ai.functions";
import { interpret } from "./aryc-intent";
import { useAryc, type ProposedAction } from "./aryc-store";

/**
 * Sends a request to Aryc's AI planner, then routes the result through the
 * confirmation gate. Falls back to the offline parser if the AI is unavailable.
 */
export function useArycCommand() {
  const { events, propose, logHeard } = useAryc();
  const run = useServerFn(parseCommand);
  const [thinking, setThinking] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const value = text.trim();
      if (!value) return;
      setThinking(true);
      setReply(null);
      try {
        const result = await run({
          data: {
            text: value,
            events: events.map((e) => ({
              id: e.id,
              title: e.title,
              start: e.start,
              durationMin: e.durationMin,
            })),
          },
        });
        if (result.kind === "reply") {
          logHeard(value);
          setReply(result.reply || result.summary);
        } else {
          propose(
            {
              kind: result.kind,
              summary: result.summary,
              detail: result.detail,
              warning: result.warning,
              payload: result.payload,
            } as Omit<ProposedAction, "id">,
            value,
          );
        }
      } catch {
        const local = interpret(value, events);
        if ("reply" in local) {
          logHeard(value);
          setReply(local.reply);
        } else {
          propose(local, value);
        }
      } finally {
        setThinking(false);
      }
    },
    [events, propose, logHeard, run],
  );

  return { send, thinking, reply, setReply };
}
