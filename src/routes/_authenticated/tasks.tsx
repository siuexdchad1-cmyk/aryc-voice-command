import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { CommandBar } from "@/components/aryc/CommandBar";
import { Shell } from "@/components/aryc/Shell";
import { fmtWhen } from "@/lib/aryc-intent";
import { useAryc } from "@/lib/aryc-store";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Aryc" },
      {
        name: "description",
        content: "Voice-captured tasks and reminders with natural due dates.",
      },
      { property: "og:title", content: "Tasks — Aryc" },
      { property: "og:description", content: "Capture tasks by voice, due dates included." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { tasks, toggleTask } = useAryc();
  return (
    <Shell>
      <h1 className="text-3xl font-extrabold tracking-tight">Tasks</h1>
      <p className="mt-1 text-sm text-muted-foreground">Say "remind me to…" to capture one.</p>
      <ul className="mt-6 space-y-3">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <button
              onClick={() => toggleTask(t.id)}
              aria-label={t.done ? "Mark not done" : "Mark done"}
              className={`grid size-7 shrink-0 place-items-center rounded-full border border-border ${
                t.done ? "aryc-gradient" : ""
              }`}
            >
              {t.done && <Check className="size-4 text-white" />}
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium ${t.done ? "text-muted-foreground line-through" : ""}`}
              >
                {t.title}
              </p>
              {t.due && <p className="text-xs text-muted-foreground">{fmtWhen(t.due)}</p>}
            </div>
          </li>
        ))}
      </ul>
      <CommandBar />
    </Shell>
  );
}
