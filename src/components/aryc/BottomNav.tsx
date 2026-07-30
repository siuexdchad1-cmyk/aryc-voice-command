import { Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, History, Home, UtensilsCrossed } from "lucide-react";

const items = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/tasks", icon: CheckCircle2, label: "Tasks" },
  { to: "/bookings", icon: UtensilsCrossed, label: "Bookings" },
  { to: "/activity", icon: History, label: "Activity" },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center justify-between gap-1 border-t border-border bg-background/95 px-3 pb-6 pt-3 backdrop-blur">
      {items.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[10px] text-muted-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          <Icon className="size-5 shrink-0" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}