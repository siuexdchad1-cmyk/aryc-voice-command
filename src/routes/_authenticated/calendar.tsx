import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { CommandBar } from "@/components/aryc/CommandBar";
import { Shell } from "@/components/aryc/Shell";
import { fmtWhen } from "@/lib/aryc-intent";
import { useAryc } from "@/lib/aryc-store";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Aryc" },
      {
        name: "description",
        content: "See, move, and cancel meetings by voice with conflict checks.",
      },
      { property: "og:title", content: "Calendar — Aryc" },
      { property: "og:description", content: "Voice-managed calendar with conflict detection." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { events, propose } = useAryc();
  return (
    <Shell>
      <h1 className="text-3xl font-extrabold tracking-tight">Calendar</h1>
      <p className="mt-1 text-sm text-muted-foreground">Upcoming across the next few days.</p>
      <ul className="mt-6 space-y-3">
        {events.map((e) => (
          <li key={e.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-border">
                <CalendarDays className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtWhen(e.start)} · {e.durationMin} min{e.location ? ` · ${e.location}` : ""}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  const d = new Date(e.start);
                  d.setDate(d.getDate() + 1);
                  propose({
                    kind: "calendar.move",
                    summary: `Move "${e.title}" to ${fmtWhen(d.toISOString())}`,
                    detail: `Currently ${fmtWhen(e.start)}`,
                    payload: { eventId: e.id, newStart: d.toISOString() },
                  });
                }}
                className="h-9 flex-1 rounded-full border border-border text-xs font-medium text-muted-foreground"
              >
                Move +1 day
              </button>
              <button
                onClick={() =>
                  propose({
                    kind: "calendar.cancel",
                    summary: `Cancel "${e.title}" on ${fmtWhen(e.start)}`,
                    detail: "Attendees will be notified once you confirm.",
                    payload: { eventId: e.id },
                  })
                }
                className="h-9 flex-1 rounded-full border border-border text-xs font-medium text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </li>
        ))}
      </ul>
      <CommandBar />
    </Shell>
  );
}
