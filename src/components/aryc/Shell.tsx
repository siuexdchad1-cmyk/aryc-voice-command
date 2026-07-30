import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { ConfirmationGate } from "./ConfirmationGate";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background px-5 pb-32 pt-10">
      {children}
      <BottomNav />
      <ConfirmationGate />
    </div>
  );
}