import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConfirmationGate } from "@/components/aryc/ConfirmationGate";
import { MicOrb } from "@/components/aryc/MicOrb";
import { interpret } from "@/lib/aryc-intent";
import { useAryc } from "@/lib/aryc-store";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "Listening — Aryc" },
      { name: "description", content: "Speak your request; Aryc plans it and asks before acting." },
      { property: "og:title", content: "Listening — Aryc" },
      { property: "og:description", content: "Hands-free command capture with live transcript." },
    ],
  }),
  component: VoicePage,
});

// Mocked speech recognition until real STT is wired in.
const PHRASES = [
  "Move my design review to Thursday at 3",
  "Book a table Friday at 8 for 2",
  "Remind me to send the Q3 numbers tomorrow at 9",
  "Cancel standup",
];

function VoicePage() {
  const navigate = useNavigate();
  const { events, propose, pending } = useAryc();
  const [phrase, setPhrase] = useState(PHRASES[0]);
  const [transcript, setTranscript] = useState("");
  const [state, setState] = useState<"idle" | "listening" | "processing">("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    if (state !== "idle") return;
    const next = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    setPhrase(next);
    setTranscript("");
    setState("listening");
    const words = next.split(" ");
    words.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => setTranscript(words.slice(0, i + 1).join(" ")), 180 * (i + 1)),
      );
    });
    timers.current.push(
      setTimeout(() => setState("processing"), 180 * words.length + 300),
    );
    timers.current.push(
      setTimeout(() => {
        const result = interpret(next, events);
        if (!("reply" in result)) propose(result, next);
        setState("idle");
      }, 180 * words.length + 1200),
    );
  };

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-between overflow-hidden bg-background px-6 py-10">
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          state === "idle" ? "opacity-30" : "opacity-100"
        }`}
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, rgba(139,92,246,0.35), transparent 60%), radial-gradient(120% 70% at 50% 100%, rgba(249,115,22,0.28), transparent 60%)",
        }}
      />

      <header className="relative flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/home" })}
          aria-label="Back"
          className="grid size-10 place-items-center rounded-full border border-border"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          onClick={start}
          aria-label="Simulate a command"
          className="grid size-10 place-items-center rounded-full aryc-gradient"
        >
          <Sparkles className="size-4 text-white" />
        </button>
      </header>

      <div className="relative flex flex-1 items-center">
        <p className="text-3xl font-bold leading-tight">
          {transcript || (
            <span className="text-muted-foreground">
              Tap the orb and Aryc will listen…
            </span>
          )}
          {state === "listening" && transcript && (
            <span className="ml-1 inline-block h-7 w-0.5 animate-glow-pulse align-middle aryc-gradient" />
          )}
        </p>
      </div>

      <div className="relative flex flex-col items-center gap-5">
        <span className="text-sm text-muted-foreground">
          {state === "listening"
            ? "Listening…"
            : state === "processing"
              ? "Thinking…"
              : pending
                ? "Waiting for your confirmation"
                : `Try: "${phrase}"`}
        </span>
        <MicOrb size={170} state={state} onClick={start} />
        <span className="h-1.5 w-32 rounded-full aryc-gradient opacity-70" />
      </div>

      <ConfirmationGate />
    </main>
  );
}