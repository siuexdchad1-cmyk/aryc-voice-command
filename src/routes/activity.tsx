import { createFileRoute } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { Shell } from "@/components/aryc/Shell";
import { useAryc, type ActionStatus } from "@/lib/aryc-store";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity log — Aryc" },
      {
        name: "description",
        content: "Every command heard and every action Aryc proposed or completed, in one place.",
      },
      { property: "og:title", content: "Activity log — Aryc" },
      { property: "og:description", content: "Transparent history of commands and actions." },
    ],
  }),
  component: ActivityPage,
});

const statusLabel: Record<ActionStatus, string> = {
  done: "Done",
  awaiting: "Awaiting confirmation",
  failed: "Failed",
  declined: "Declined",
};

function ActivityPage() {
  const { activity, flagEntry } = useAryc();
  return (
    <Shell>
      <h1 className="text-3xl font-extrabold tracking-tight">Activity</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everything Aryc heard, proposed and did.
      </p>

      {activity.length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">
          Nothing yet — give Aryc a command and it will show up here.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {activity.map((a) => (
          <li key={a.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 text-sm font-semibold">{a.summary}</p>
              <span
                className={`shrink-0 rounded-full border border-border px-2.5 py-1 text-[10px] font-medium ${
                  a.status === "done" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {statusLabel[a.status]}
              </span>
            </div>
            {a.heard && (
              <p className="mt-1 text-xs text-muted-foreground">Heard: “{a.heard}”</p>
            )}
            {a.outcome && <p className="mt-1 text-xs text-muted-foreground">{a.outcome}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {new Date(a.at).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <button
                onClick={() => flagEntry(a.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] text-muted-foreground"
              >
                <Flag className="size-3" />
                {a.flagged ? "Reported" : "That wasn't right"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}