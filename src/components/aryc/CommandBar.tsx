import { useNavigate } from "@tanstack/react-router";
import { Loader2, Mic, SendHorizonal } from "lucide-react";
import { useState } from "react";
import { useArycCommand } from "@/lib/use-aryc-command";

export function CommandBar() {
  const [text, setText] = useState("");
  const { send, thinking, reply } = useArycCommand();
  const navigate = useNavigate();

  const submit = () => {
    const value = text.trim();
    if (!value || thinking) return;
    setText("");
    void send(value);
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-md px-5">
      {(reply || thinking) && (
        <p className="mb-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {thinking ? "Aryc is thinking…" : reply}
        </p>
      )}
      <div className="aryc-gradient-border flex items-center gap-2 rounded-full bg-card p-1.5 pl-5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Talk to Aryc…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={submit}
          disabled={thinking}
          aria-label="Send"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground disabled:opacity-50"
        >
          {thinking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizonal className="size-4" />
          )}
        </button>
        <button
          onClick={() => navigate({ to: "/voice" })}
          aria-label="Start voice command"
          className="grid size-11 shrink-0 place-items-center rounded-full aryc-gradient"
        >
          <Mic className="size-5 text-white" />
        </button>
      </div>
    </div>
  );
}
