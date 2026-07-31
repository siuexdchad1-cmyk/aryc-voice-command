import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EventInput = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(),
  durationMin: z.number(),
});

const Input = z.object({
  text: z.string().min(1).max(500),
  events: z.array(EventInput).max(50),
});

export type ParsedIntent = {
  kind:
    | "calendar.move"
    | "calendar.create"
    | "calendar.cancel"
    | "task.create"
    | "booking.create"
    | "reply";
  summary: string;
  detail?: string;
  warning?: string;
  reply?: string;
  payload: Record<string, string | number>;
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "summary", "payload"],
  properties: {
    kind: {
      type: "string",
      enum: [
        "calendar.move",
        "calendar.create",
        "calendar.cancel",
        "task.create",
        "booking.create",
        "reply",
      ],
    },
    summary: { type: "string" },
    detail: { type: "string" },
    warning: { type: "string" },
    reply: { type: "string" },
    payload: {
      type: "object",
      additionalProperties: false,
      properties: {
        eventId: { type: "string" },
        newStart: { type: "string" },
        title: { type: "string" },
        start: { type: "string" },
        durationMin: { type: "number" },
        due: { type: "string" },
        venue: { type: "string" },
        when: { type: "string" },
        party: { type: "number" },
      },
    },
  },
} as const;

/** Turns a spoken/typed request into a structured proposal. Never executes anything. */
export const parseCommand = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ParsedIntent> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const now = new Date();
    const system = [
      "You are Aryc, a voice assistant that PLANS actions but never executes them.",
      `The current date and time is ${now.toISOString()} (local offset ${-now.getTimezoneOffset() / 60}h).`,
      "Return exactly one structured action for the user's request.",
      "All date/time values must be full ISO 8601 strings.",
      "Use calendar.move with payload.eventId + payload.newStart (pick eventId from the calendar list).",
      "Use calendar.cancel with payload.eventId. Use calendar.create with title/start/durationMin.",
      "Use task.create with title and optional due. Use booking.create with venue, when, party.",
      "If a proposed time is within 30 minutes of an existing event, set `warning` describing the clash.",
      "If the request is unclear or not one of these, use kind 'reply' and put a short friendly answer in `reply`.",
      "`summary` is a short human sentence shown on a confirmation card, e.g. 'Move \"Design review\" to Thursday, Mar 6, 3:00 PM'.",
      `Calendar: ${JSON.stringify(data.events)}`,
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        reasoning_effort: "none",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.text },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "aryc_action", strict: true, schema },
        },
      }),
    });

    if (res.status === 429) throw new Error("Aryc is busy right now — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");
    const parsed = JSON.parse(content) as ParsedIntent;
    return { ...parsed, payload: parsed.payload ?? {} };
  });
