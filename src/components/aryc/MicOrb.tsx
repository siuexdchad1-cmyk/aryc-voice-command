import { cn } from "@/lib/utils";

type OrbState = "idle" | "listening" | "processing";

export function MicOrb({
  state = "idle",
  size = 180,
  className,
  onClick,
}: {
  state?: OrbState;
  size?: number;
  className?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      aria-label={onClick ? "Talk to Aryc" : undefined}
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full aryc-gradient blur-3xl",
          state === "listening" ? "animate-glow-pulse opacity-80" : "opacity-40",
          state === "processing" && "animate-spin-slow opacity-60",
        )}
      />
      <span
        className={cn(
          "absolute rounded-full aryc-gradient",
          state === "idle" && "animate-breathe",
          state === "processing" && "animate-spin-slow",
          state === "listening" && "animate-glow-pulse",
        )}
        style={{ width: size * 0.72, height: size * 0.72, filter: "blur(2px)" }}
      />
      <span
        className="absolute rounded-full bg-background/70"
        style={{ width: size * 0.34, height: size * 0.34, filter: "blur(6px)" }}
      />
    </Tag>
  );
}