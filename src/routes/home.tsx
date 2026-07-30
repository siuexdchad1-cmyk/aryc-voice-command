import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, Crown, UtensilsCrossed, XCircle } from "lucide-react";
import { CommandBar } from "@/components/aryc/CommandBar";
import { Shell } from "@/components/aryc/Shell";
import { fmtTime, interpret } from "@/lib/aryc-intent";
import { useAryc } from "@/lib/aryc-store";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — Aryc" },
      { name: "description", content: "Your day at a glance and one tap to talk to Aryc." },
      { property: "og:title", content: "Home — Aryc" },
      { property: "og:description", content: "Your day at a glance, voice-first." },
    ],
  }),
  component: HomePage,
});

const quickActions = [
  { label: "Move a meeting", hint: "Calendar", icon: CalendarClock, command: "Move my 3pm to Thursday at 3" },
  { label: "Book a table", hint: "Bookings", icon: UtensilsCrossed, command: "Book a table Friday at 8 for 2" },
  { label: "Capture a task", hint: "Tasks", icon: CheckCircle2, command: "Remind me to call the accountant tomorrow at 9" },
  { label: "Cancel standup", hint: "Calendar", icon: XCircle, command: "Cancel standup" },
];

function HomePage() {
  const { userName, events, propose } = useAryc();
  const navigate = useNavigate();
  const next = events.find((e) => +new Date(e.start) > Date.now()) ?? events[0];

  return (
    <Shell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="aryc-gradient-border inline-flex w-fit items-center gap-2 rounded-full bg-card px-3 py-1.5">
          <Crown className="size-3.5 text-aryc-orange" />
          <span className="text-xs font-medium">Try Premium</span>
        </div>
        <button
          onClick={() => navigate({ to: "/activity" })}
          className="grid size-10 shrink-0 place-items-center rounded-full aryc-gradient text-sm font-bold text-white"
        >
          {userName[0]}
        </button>
      </header>

      <h1 className="mt-8 text-4xl font-extrabold tracking-tight">
        Hi {userName},
        <span className="block text-muted-foreground">what should I handle?</span>
      </h1>

      <div className="relative mt-8 h-40 overflow-hidden rounded-3xl border border-border bg-card">
        <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="swirl" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="45%" stopColor="#D946EF" />
              <stop offset="100%" stopColor="#F97316" />
            </radialGradient>
          </defs>
          <g opacity="0.85" style={{ filter: "blur(18px)" }}>
            <ellipse cx="200" cy="100" rx="150" ry="46" fill="url(#swirl)" />
            <ellipse cx="200" cy="100" rx="46" ry="120" fill="url(#swirl)" opacity="0.7" />
          </g>
          <ellipse cx="200" cy="100" rx="52" ry="20" fill="#000" opacity="0.75" style={{ filter: "blur(10px)" }} />
        </svg>
        {next && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 text-sm">
            <span className="truncate font-medium">Next: {next.title}</span>
            <span className="shrink-0 text-muted-foreground">{fmtTime(next.start)}</span>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {quickActions.map(({ label, hint, icon: Icon, command }) => (
          <button
            key={label}
            onClick={() => {
              const result = interpret(command, events);
              if (!("reply" in result)) propose(result, command);
            }}
            className="flex h-32 flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left"
          >
            <span className="grid size-9 place-items-center rounded-full aryc-gradient">
              <Icon className="size-4 text-white" />
            </span>
            <span>
              <span className="block text-sm font-semibold leading-tight">{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      <CommandBar />
    </Shell>
  );
}