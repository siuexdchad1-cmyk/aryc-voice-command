import type { CalendarEvent, ProposedAction } from "./aryc-store";

const fmtDay = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
export const fmtTime = (isoStr: string) =>
  new Date(isoStr).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
export const fmtWhen = (isoStr: string) => `${fmtDay(new Date(isoStr))}, ${fmtTime(isoStr)}`;

const nextWeekday = (name: string, hour: number) => {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const target = days.indexOf(name.toLowerCase());
  const d = new Date();
  const delta = (target - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const parseHour = (text: string, fallback: number) => {
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return fallback;
  let h = parseInt(m[1], 10);
  const pm = (m[3] ?? "").toLowerCase() === "pm";
  if (pm && h < 12) h += 12;
  if (!m[3] && h < 8) h += 12;
  return h;
};

/** Very small mocked NLU: maps a spoken phrase to a proposed action. */
export function interpret(
  text: string,
  events: CalendarEvent[],
): Omit<ProposedAction, "id"> | { reply: string } {
  const t = text.toLowerCase();
  const weekday = t.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)?.[1];

  if (/(move|reschedule|push)/.test(t)) {
    const target =
      events.find((e) => t.includes(e.title.toLowerCase().split(" ")[0])) ??
      events.find((e) => t.includes(String(new Date(e.start).getHours() % 12 || 12))) ??
      events[0];
    if (!target) return { reply: "I couldn't find that event on your calendar." };
    const hour = parseHour(t.replace(/\d{1,2}\s*(am|pm)?\s*(to|→)/, ""), 15);
    const newStart = weekday
      ? nextWeekday(weekday, hour)
      : (() => {
          const d = new Date(target.start);
          d.setHours(hour, 0, 0, 0);
          return d.toISOString();
        })();
    const clash = events.find(
      (e) => e.id !== target.id && Math.abs(+new Date(e.start) - +new Date(newStart)) < 30 * 60000,
    );
    return {
      kind: "calendar.move",
      summary: `Move "${target.title}" to ${fmtWhen(newStart)}`,
      detail: `Currently ${fmtWhen(target.start)} · ${target.durationMin} min`,
      warning: clash ? `Conflict: "${clash.title}" is at ${fmtTime(clash.start)}.` : undefined,
      payload: { eventId: target.id, newStart },
    };
  }

  if (/(cancel|delete|drop)/.test(t)) {
    const target = events.find((e) => t.includes(e.title.toLowerCase().split(" ")[0]));
    if (!target) return { reply: "Which meeting should I cancel?" };
    return {
      kind: "calendar.cancel",
      summary: `Cancel "${target.title}" on ${fmtWhen(target.start)}`,
      detail: "Attendees will be notified once you confirm.",
      payload: { eventId: target.id },
    };
  }

  if (/(book|table|reserve|reservation|dinner)/.test(t)) {
    const hour = parseHour(t, 20);
    const when = weekday ? nextWeekday(weekday, hour) : nextWeekday("friday", hour);
    const party = Number(t.match(/(\d+)\s*(people|guests|of us)/)?.[1] ?? 2);
    const venue = /osteria/.test(t) ? "Osteria Nord" : "Café Lumen";
    return {
      kind: "booking.create",
      summary: `Book ${venue} — ${fmtWhen(when)}, ${party} people`,
      detail: `Nearest availability. Alternative: ${fmtTime(
        new Date(+new Date(when) + 45 * 60000).toISOString(),
      )} same night.`,
      payload: { venue, when, party },
    };
  }

  if (/(remind|task|todo|to-do|remember)/.test(t)) {
    const title = text.replace(/^.*?(remind me to|remember to|add a task to|task:)\s*/i, "").trim();
    const d = new Date();
    d.setHours(parseHour(t, 18), 0, 0, 0);
    if (/tomorrow/.test(t)) d.setDate(d.getDate() + 1);
    return {
      kind: "task.create",
      summary: `Add task "${title || text}"`,
      detail: `Due ${fmtWhen(d.toISOString())}`,
      payload: { title: title || text, due: d.toISOString() },
    };
  }

  if (/(schedule|set up|create|meeting|block)/.test(t)) {
    const hour = parseHour(t, 10);
    const start = weekday ? nextWeekday(weekday, hour) : nextWeekday("monday", hour);
    const title = /lunch/.test(t) ? "Lunch" : /call/.test(t) ? "Call" : "Meeting";
    const clash = events.find((e) => Math.abs(+new Date(e.start) - +new Date(start)) < 30 * 60000);
    return {
      kind: "calendar.create",
      summary: `Schedule "${title}" on ${fmtWhen(start)}`,
      detail: "30 minutes",
      warning: clash ? `Conflict: "${clash.title}" at ${fmtTime(clash.start)}.` : undefined,
      payload: { title, start, durationMin: 30 },
    };
  }

  return {
    reply: "I can move meetings, schedule time, capture tasks, or book a table. Try one of those.",
  };
}
