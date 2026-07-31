import { Link, createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { MicOrb } from "@/components/aryc/MicOrb";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aryc — Effortless control with Aryc" },
      {
        name: "description",
        content:
          "Meet Aryc, the voice-first assistant that plans and executes across your calendar, tasks, and bookings — always with your confirmation.",
      },
      { property: "og:title", content: "Aryc — Effortless control with Aryc" },
      {
        property: "og:description",
        content: "A voice-first AI assistant for calendar, tasks, and bookings.",
      },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-between bg-background px-6 py-14">
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        <MicOrb size={210} />
        <div className="aryc-gradient-border inline-flex items-center gap-2 rounded-full bg-card px-4 py-2">
          <Sparkles className="size-3.5 text-aryc-magenta" />
          <span className="text-xs font-medium">AI Voice Command</span>
        </div>
        <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-muted-foreground">
          Effortless
          <br />
          control with <span className="text-foreground">Aryc</span>
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Delegate real work by voice — meetings moved, tasks captured, tables booked. Nothing
          happens until you say yes.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex gap-2">
          <span className="h-1.5 w-6 rounded-full aryc-gradient" />
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
        </div>
        <Link
          to="/auth"
          className="aryc-gradient-border flex h-14 w-full items-center justify-center rounded-full bg-card text-base font-semibold"
        >
          Sign Up
        </Link>
        <Link
          to="/auth"
          className="flex h-14 w-full items-center justify-center rounded-full border border-border text-base font-medium text-muted-foreground"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
