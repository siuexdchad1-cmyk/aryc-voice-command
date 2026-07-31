import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

export type ActionKind =
  | "calendar.move"
  | "calendar.create"
  | "calendar.cancel"
  | "task.create"
  | "booking.create"
  | "message.send";

export type ActionStatus = "awaiting" | "done" | "failed" | "declined";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  durationMin: number;
  location?: string;
}

export interface Task {
  id: string;
  title: string;
  due?: string;
  done: boolean;
}

export interface Booking {
  id: string;
  venue: string;
  when: string;
  party: number;
  status: "confirmed" | "proposed";
}

export interface ProposedAction {
  id: string;
  kind: ActionKind;
  summary: string;
  detail?: string;
  warning?: string;
  payload: Record<string, unknown>;
}

export interface ActivityEntry {
  id: string;
  at: string;
  heard?: string;
  summary: string;
  status: ActionStatus;
  outcome?: string;
  flagged?: boolean;
}

interface ArycState {
  userName: string;
  loading: boolean;
  events: CalendarEvent[];
  tasks: Task[];
  bookings: Booking[];
  activity: ActivityEntry[];
  pending: ProposedAction | null;
  /** The ONLY way to run a consequential action: propose it, then confirm. */
  propose: (a: Omit<ProposedAction, "id">, heard?: string) => void;
  confirmPending: () => void;
  declinePending: () => void;
  flagEntry: (id: string) => void;
  toggleTask: (id: string) => void;
  logHeard: (text: string) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<ArycState | null>(null);

export function ArycProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("there");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [pending, setPending] = useState<(ProposedAction & { entryId: string }) | null>(null);

  // ---- load ---------------------------------------------------------------
  const load = useCallback(async (uid: string) => {
    const [{ data: ev }, { data: tk }, { data: bk }, { data: ac }, { data: pf }] =
      await Promise.all([
        supabase.from("events").select("*").order("start_at"),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").order("when_at"),
        supabase.from("activity").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle(),
      ]);
    setEvents(
      (ev ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start_at,
        durationMin: e.duration_min,
        location: e.location ?? undefined,
      })),
    );
    setTasks(
      (tk ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        due: t.due_at ?? undefined,
        done: t.done,
      })),
    );
    setBookings(
      (bk ?? []).map((b) => ({
        id: b.id,
        venue: b.venue,
        when: b.when_at,
        party: b.party,
        status: b.status === "proposed" ? "proposed" : "confirmed",
      })),
    );
    setActivity(
      (ac ?? []).map((a) => ({
        id: a.id,
        at: a.created_at,
        heard: a.heard ?? undefined,
        summary: a.summary,
        status: a.status as ActionStatus,
        outcome: a.outcome ?? undefined,
        flagged: a.flagged,
      })),
    );
    if (pf?.display_name) setUserName(pf.display_name);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const apply = (user: { id: string; email?: string; user_metadata?: unknown } | null) => {
      if (!active) return;
      if (!user) {
        setUserId(null);
        setEvents([]);
        setTasks([]);
        setBookings([]);
        setActivity([]);
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const meta = (user.user_metadata ?? {}) as { display_name?: string; full_name?: string };
      setUserName(meta.display_name ?? meta.full_name ?? user.email?.split("@")[0] ?? "there");
      void load(user.id);
    };

    void supabase.auth.getUser().then(({ data }) => apply(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  // ---- activity log -------------------------------------------------------
  const insertActivity = useCallback(
    async (entry: { heard?: string; summary: string; status: ActionStatus; outcome?: string }) => {
      if (!userId) return null;
      const { data } = await supabase
        .from("activity")
        .insert({ ...entry, user_id: userId })
        .select()
        .single();
      if (!data) return null;
      setActivity((prev) => [
        {
          id: data.id,
          at: data.created_at,
          heard: data.heard ?? undefined,
          summary: data.summary,
          status: data.status as ActionStatus,
          outcome: data.outcome ?? undefined,
          flagged: data.flagged,
        },
        ...prev,
      ]);
      return data.id as string;
    },
    [userId],
  );

  const logHeard = useCallback(
    (text: string) => {
      void insertActivity({ heard: text, summary: "Command heard", status: "done" });
    },
    [insertActivity],
  );

  const propose = useCallback(
    (a: Omit<ProposedAction, "id">, heard?: string) => {
      void (async () => {
        const entryId = (await insertActivity({ heard, summary: a.summary, status: "awaiting" })) ?? "";
        setPending({ ...a, id: entryId || Math.random().toString(36).slice(2), entryId });
      })();
    },
    [insertActivity],
  );

  // Execution is private to this module and only reachable from confirmPending.
  const execute = useCallback(
    async (action: ProposedAction): Promise<string> => {
      if (!userId) throw new Error("Not signed in");
      const p = action.payload as Record<string, string | number>;
      switch (action.kind) {
        case "calendar.move": {
          const { error } = await supabase
            .from("events")
            .update({ start_at: String(p.newStart) })
            .eq("id", String(p.eventId));
          if (error) throw error;
          setEvents((prev) =>
            prev.map((e) => (e.id === p.eventId ? { ...e, start: String(p.newStart) } : e)),
          );
          return "Moved.";
        }
        case "calendar.create": {
          const { data, error } = await supabase
            .from("events")
            .insert({
              user_id: userId,
              title: String(p.title),
              start_at: String(p.start),
              duration_min: Number(p.durationMin ?? 30),
            })
            .select()
            .single();
          if (error || !data) throw error ?? new Error("Insert failed");
          setEvents((prev) => [
            ...prev,
            {
              id: data.id,
              title: data.title,
              start: data.start_at,
              durationMin: data.duration_min,
            },
          ]);
          return "Added to your calendar.";
        }
        case "calendar.cancel": {
          const { error } = await supabase.from("events").delete().eq("id", String(p.eventId));
          if (error) throw error;
          setEvents((prev) => prev.filter((e) => e.id !== p.eventId));
          return "Cancelled.";
        }
        case "task.create": {
          const { data, error } = await supabase
            .from("tasks")
            .insert({
              user_id: userId,
              title: String(p.title),
              due_at: p.due ? String(p.due) : null,
            })
            .select()
            .single();
          if (error || !data) throw error ?? new Error("Insert failed");
          setTasks((prev) => [
            { id: data.id, title: data.title, due: data.due_at ?? undefined, done: data.done },
            ...prev,
          ]);
          return "Task saved.";
        }
        case "booking.create": {
          const { data, error } = await supabase
            .from("bookings")
            .insert({
              user_id: userId,
              venue: String(p.venue),
              when_at: String(p.when),
              party: Number(p.party ?? 2),
              status: "confirmed",
            })
            .select()
            .single();
          if (error || !data) throw error ?? new Error("Insert failed");
          setBookings((prev) => [
            { id: data.id, venue: data.venue, when: data.when_at, party: data.party, status: "confirmed" },
            ...prev,
          ]);
          return "Booking confirmed.";
        }
        default:
          return "Done.";
      }
    },
    [userId],
  );

  const settle = useCallback(
    async (entryId: string, status: ActionStatus, outcome: string) => {
      setActivity((prev) => prev.map((e) => (e.id === entryId ? { ...e, status, outcome } : e)));
      if (entryId) await supabase.from("activity").update({ status, outcome }).eq("id", entryId);
    },
    [],
  );

  const confirmPending = useCallback(() => {
    const current = pending;
    if (!current) return;
    setPending(null);
    void (async () => {
      try {
        const outcome = await execute(current);
        await settle(current.entryId, "done", outcome);
      } catch {
        await settle(current.entryId, "failed", "Something went wrong — nothing was changed.");
      }
    })();
  }, [pending, execute, settle]);

  const declinePending = useCallback(() => {
    const current = pending;
    if (!current) return;
    setPending(null);
    void settle(current.entryId, "declined", "You declined — nothing was changed.");
  }, [pending, settle]);

  const flagEntry = useCallback((id: string) => {
    setActivity((prev) => prev.map((e) => (e.id === id ? { ...e, flagged: true } : e)));
    void supabase.from("activity").update({ flagged: true }).eq("id", id);
  }, []);

  const toggleTask = useCallback(
    (id: string) => {
      const next = !tasks.find((t) => t.id === id)?.done;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: next } : t)));
      void supabase.from("tasks").update({ done: next }).eq("id", id);
    },
    [tasks],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<ArycState>(
    () => ({
      userName,
      loading,
      events: [...events].sort((a, b) => a.start.localeCompare(b.start)),
      tasks,
      bookings,
      activity,
      pending,
      propose,
      confirmPending,
      declinePending,
      flagEntry,
      toggleTask,
      logHeard,
      signOut,
    }),
    [
      userName,
      loading,
      events,
      tasks,
      bookings,
      activity,
      pending,
      propose,
      confirmPending,
      declinePending,
      flagEntry,
      toggleTask,
      logHeard,
      signOut,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAryc() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAryc must be used inside ArycProvider");
  return ctx;
}
