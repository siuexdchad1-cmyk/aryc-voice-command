import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MicOrb } from "@/components/aryc/MicOrb";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Aryc" },
      {
        name: "description",
        content:
          "Sign in to Aryc to sync your calendar, tasks, bookings and activity log across devices.",
      },
      { property: "og:title", content: "Sign in — Aryc" },
      { property: "og:description", content: "Access your voice-first assistant." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/home", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    if (mode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: name || email.split("@")[0] },
        },
      });
      if (err) setError(err.message);
      else if (!data.session) setMessage("Check your email to confirm your account, then sign in.");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    }
    setBusy(false);
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(result.error.message ?? "Google sign-in failed.");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 bg-background px-6 py-14">
      <div className="flex flex-col items-center gap-6 text-center">
        <MicOrb size={120} />
        <h1 className="text-3xl font-extrabold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your Aryc"}
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Your calendar, tasks and bookings — synced securely to your account.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-13 rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none placeholder:text-muted-foreground"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none placeholder:text-muted-foreground"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none placeholder:text-muted-foreground"
        />
        {error && <p className="text-sm text-aryc-orange">{error}</p>}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <button
          type="submit"
          disabled={busy}
          className="aryc-gradient-border mt-1 flex h-14 items-center justify-center rounded-full bg-card text-base font-semibold disabled:opacity-60"
        >
          {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <button
        onClick={google}
        className="flex h-14 items-center justify-center gap-3 rounded-full border border-border text-base font-medium"
      >
        Continue with Google
      </button>

      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        <Link to="/">Back</Link>
      </div>
    </main>
  );
}
