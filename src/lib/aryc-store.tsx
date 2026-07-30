import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

const iso = (dayOffset: number, hour: number, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

const seedEvents: CalendarEvent[] = [
  { id: "e1", title: "Standup", start: iso(0, 9, 30), durationMin: 15 },
  { id: "e2", title: "Design review", start: iso(0, 15), durationMin: 60, location: "Zoom" },
  { id: "e3", title: "1:1 with Priya", start: iso(1, 11), durationMin: 30 },
  { id: "e4", title: "Board prep", start: iso(2, 15), durationMin: 45 },
];

const seedTasks: Task[] = [
  { id: "t1", title: "Send Q3 numbers to Marco", due: iso(0, 18), done: false },
  { id: "t2", title: "Review vendor contract", due: iso(1, 12), done: false },
];

const seedBookings: Booking[] = [
  { id: "b1", venue: "Osteria Nord", when: iso(3, 20), party: 2, status: "confirmed" },
];

interface ArycState {
  userName: string;
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
}

const Ctx = createContext<ArycState | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

export function ArycProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState(seedEvents);
  const [tasks, setTasks] = useState(seedTasks);
  const [bookings, setBookings] = useState(seedBookings);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [pending, setPending] = useState<(ProposedAction & { entryId: string }) | null>(null);

  const logHeard = useCallback((text: string) => {
    setActivity((prev) => [
      { id: uid(), at: new Date().toISOString(), heard: text, summary: "Command heard", status: "done" },
      ...prev,
    ]);
  }, []);

  const propose = useCallback((a: Omit<ProposedAction, "id">, heard?: string) => {
    const entryId = uid();
    setActivity((prev) => [
      {
        id: entryId,
        at: new Date().toISOString(),
        heard,
        summary: a.summary,
        status: "awaiting",
      },
      ...prev,
    ]);
    setPending({ ...a, id: uid(), entryId });
  }, []);

  // Execution is private to this module and only reachable from confirmPending.
  const execute = useCallback((action: ProposedAction): string => {
    const p = action.payload as Record<string, string | number>;
    switch (action.kind) {
      case "calendar.move":
        setEvents((prev) =>
          prev.map((e) => (e.id === p.eventId ? { ...e, start: String(p.newStart) } : e)),
        );
        return "Moved.";
      case "calendar.create":
        setEvents((prev) => [
          ...prev,
          {
            id: uid(),
            title: String(p.title),
            start: String(p.start),
            durationMin: Number(p.durationMin ?? 30),
          },
        ]);
        return "Added to your calendar.";
      case "calendar.cancel":
        setEvents((prev) => prev.filter((e) => e.id !== p.eventId));
        return "Cancelled.";
      case "task.create":
        setTasks((prev) => [
          { id: uid(), title: String(p.title), due: p.due ? String(p.due) : undefined, done: false },
          ...prev,
        ]);
        return "Task saved.";
      case "booking.create":
        setBookings((prev) => [
          {
            id: uid(),
            venue: String(p.venue),
            when: String(p.when),
            party: Number(p.party ?? 2),
            status: "confirmed",
          },
          ...prev,
        ]);
        return "Booking confirmed.";
      default:
        return "Done.";
    }
  }, []);

  const confirmPending = useCallback(() => {
    setPending((current) => {
      if (!current) return null;
      let outcome: string;
      let status: ActionStatus = "done";
      try {
        outcome = execute(current);
      } catch {
        outcome = "Something went wrong — nothing was changed.";
        status = "failed";
      }
      setActivity((prev) =>
        prev.map((e) => (e.id === current.entryId ? { ...e, status, outcome } : e)),
      );
      return null;
    });
  }, [execute]);

  const declinePending = useCallback(() => {
    setPending((current) => {
      if (!current) return null;
      setActivity((prev) =>
        prev.map((e) =>
          e.id === current.entryId
            ? { ...e, status: "declined", outcome: "You declined — nothing was changed." }
            : e,
        ),
      );
      return null;
    });
  }, []);

  const flagEntry = useCallback((id: string) => {
    setActivity((prev) => prev.map((e) => (e.id === id ? { ...e, flagged: true } : e)));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const value = useMemo<ArycState>(
    () => ({
      userName: "Alex",
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
    }),
    [
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
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAryc() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAryc must be used inside ArycProvider");
  return ctx;
}