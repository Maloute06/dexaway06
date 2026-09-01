import { initials, playerHue } from "@/lib/game-utils";

export function Avatar({
  name,
  size = 34,
  dimmed = false,
}: {
  name: string;
  size?: number;
  dimmed?: boolean;
}) {
  const hue = playerHue(name);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-mono font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `oklch(0.6 0.09 ${hue})`,
        color: "oklch(0.16 0.016 210)",
        border: "2px solid oklch(0.82 0.06 " + hue + " / 60%)",
        filter: dimmed ? "grayscale(1) brightness(0.6)" : undefined,
        transition: "filter 0.4s ease",
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function PlayerChip({ name, dimmed = false }: { name: string; dimmed?: boolean }) {
  return (
    <span
      className="flex items-center gap-2 rounded-full border border-border bg-surface/70 py-1 pl-1 pr-3 text-sm"
      style={{ opacity: dimmed ? 0.45 : 1 }}
    >
      <Avatar name={name} size={26} dimmed={dimmed} />
      <span className="max-w-32 truncate font-medium">{name}</span>
    </span>
  );
}
