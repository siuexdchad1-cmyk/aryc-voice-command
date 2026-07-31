import { createFileRoute } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";
import { CommandBar } from "@/components/aryc/CommandBar";
import { Shell } from "@/components/aryc/Shell";
import { fmtTime, fmtWhen } from "@/lib/aryc-intent";
import { useAryc } from "@/lib/aryc-store";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — Aryc" },
      { name: "description", content: "Aryc proposes options and books only after you confirm." },
      { property: "og:title", content: "Bookings — Aryc" },
      {
        property: "og:description",
        content: "Restaurant and appointment bookings, confirmed by you.",
      },
    ],
  }),
  component: BookingsPage,
});

const options = [
  { venue: "Café Lumen", hoursAhead: 30, party: 2 },
  { venue: "Osteria Nord", hoursAhead: 32, party: 2 },
  { venue: "Kō Sushi", hoursAhead: 54, party: 4 },
];

function BookingsPage() {
  const { bookings, propose } = useAryc();
  return (
    <Shell>
      <h1 className="text-3xl font-extrabold tracking-tight">Bookings</h1>

      <h2 className="mt-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Proposed options
      </h2>
      <ul className="mt-3 space-y-3">
        {options.map((o) => {
          const when = new Date(Date.now() + o.hoursAhead * 3600_000);
          when.setMinutes(0, 0, 0);
          const whenIso = when.toISOString();
          return (
            <li
              key={o.venue}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border">
                <UtensilsCrossed className="size-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{o.venue}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtWhen(whenIso)} · {o.party} people
                </p>
              </div>
              <button
                onClick={() =>
                  propose({
                    kind: "booking.create",
                    summary: `Book ${o.venue} — ${fmtWhen(whenIso)}, ${o.party} people`,
                    detail: `If that slot is gone, nearest alternative is ${fmtTime(
                      new Date(+when + 45 * 60000).toISOString(),
                    )}.`,
                    payload: { venue: o.venue, when: whenIso, party: o.party },
                  })
                }
                className="aryc-gradient-border h-9 shrink-0 rounded-full bg-accent px-4 text-xs font-semibold"
              >
                Propose
              </button>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Confirmed
      </h2>
      <ul className="mt-3 space-y-3">
        {bookings.map((b) => (
          <li key={b.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{b.venue}</p>
            <p className="text-xs text-muted-foreground">
              {fmtWhen(b.when)} · {b.party} people · {b.status}
            </p>
          </li>
        ))}
      </ul>

      <CommandBar />
    </Shell>
  );
}
