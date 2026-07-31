import { AlertTriangle, Check, X } from "lucide-react";
import { useAryc } from "@/lib/aryc-store";

/**
 * The single confirmation gate. Nothing in the app executes a consequential
 * action except through store.propose() -> this component -> confirmPending().
 */
export function ConfirmationGate() {
  const { pending, confirmPending, declinePending } = useAryc();
  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-6 backdrop-blur-sm">
      <div className="animate-rise w-full max-w-md rounded-3xl border border-border bg-card p-5 aryc-halo">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Confirm before Aryc acts
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-tight">{pending.summary}</h2>
        {pending.detail && <p className="mt-2 text-sm text-muted-foreground">{pending.detail}</p>}
        {pending.warning && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-border bg-background p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-aryc-orange" />
            <span className="text-muted-foreground">{pending.warning}</span>
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <button
            onClick={declinePending}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-muted-foreground"
          >
            <X className="size-4" /> No, cancel
          </button>
          <button
            onClick={confirmPending}
            className="aryc-gradient-border flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold"
          >
            <Check className="size-4" /> Yes, do it
          </button>
        </div>
      </div>
    </div>
  );
}
