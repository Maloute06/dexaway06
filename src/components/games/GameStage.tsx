import type { CSSProperties, ReactNode } from "react";
import { Avatar } from "@/components/PlayerChip";
import { playerHue } from "@/lib/game-utils";

const ASPECT: Record<string, string> = {
  video: "aspect-video",
  square: "aspect-square",
  "4/3": "aspect-4/3",
  tall: "aspect-3/4",
  auto: "",
};

/**
 * Scène cinématique commune à tous les mini-jeux :
 * illustration du jeu en toile de fond, éclairage, vignette,
 * balayage lumineux, grille néon et HUD.
 */
export function GameStage({
  image,
  title,
  subtitle,
  status,
  aspect = "video",
  minHeight,
  children,
  overlay,
  caption,
  shake = false,
}: {
  image: string;
  title: string;
  subtitle?: ReactNode;
  status?: ReactNode;
  aspect?: keyof typeof ASPECT;
  minHeight?: number;
  children: ReactNode;
  overlay?: ReactNode;
  caption?: ReactNode;
  shake?: boolean;
}) {
  return (
    <div className="panel relative overflow-hidden p-0">
      <div className="pointer-events-none absolute inset-0">
        <img
          src={image}
          alt=""
          aria-hidden
          className="animate-slow-zoom h-full w-full object-cover opacity-30 blur-[3px]"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-stage-wash" />
      <div className="pointer-events-none absolute inset-0 fx-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 fx-scan opacity-30" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-sweep absolute -inset-y-10 w-1/3 bg-light-sweep" />
      </div>

      <div className="relative flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl leading-none tracking-widest glow-text">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {status && <div className="flex shrink-0 items-center gap-2">{status}</div>}
      </div>

      <div className="relative p-3 sm:p-5">
        <div
          className={`relative overflow-hidden rounded-xl border border-border/70 bg-background/45 ${ASPECT[aspect]} ${
            shake ? "animate-shake" : ""
          }`}
          style={minHeight ? { minHeight } : undefined}
        >
          <div className="pointer-events-none absolute inset-0 fx-vignette z-20" />
          {children}
          {overlay}
        </div>
        {caption && (
          <div className="mt-3 text-center text-sm text-muted-foreground">{caption}</div>
        )}
      </div>
    </div>
  );
}

/** Avatar de joueur avec halo, traînée de vitesse et état éliminé. */
export function Runner({
  name,
  size = 26,
  dead = false,
  lead = false,
  trail = 0,
  style,
  label,
}: {
  name: string;
  size?: number;
  dead?: boolean;
  lead?: boolean;
  trail?: number;
  style?: CSSProperties;
  label?: ReactNode;
}) {
  const hue = playerHue(name);
  return (
    <span className="relative inline-flex items-center" style={style}>
      {trail > 0 && !dead && (
        <span
          className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: trail,
            height: size * 0.42,
            background: `linear-gradient(270deg, oklch(0.78 0.1 ${hue} / 65%), transparent)`,
            filter: "blur(2px)",
          }}
        />
      )}
      <span
        className="inline-flex"
        style={{
          filter: dead
            ? "grayscale(1) brightness(0.55)"
            : `drop-shadow(0 0 ${lead ? 16 : 8}px oklch(0.8 0.1 ${hue} / ${lead ? 0.9 : 0.6}))`,
          transition: "filter 0.3s ease",
        }}
      >
        <Avatar name={name} size={size} dimmed={dead} />
      </span>
      {label}
    </span>
  );
}

/** Petite pastille HUD monospace. */
export function Hud({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "live" | "danger" | "gold" }) {
  const color =
    tone === "live"
      ? "var(--color-primary)"
      : tone === "danger"
        ? "var(--color-destructive)"
        : tone === "gold"
          ? "var(--color-gold)"
          : "var(--color-muted-foreground)";
  return (
    <span className="tag" style={{ color, borderColor: `color-mix(in oklab, ${color} 45%, transparent)` }}>
      {tone === "live" && <span className="size-1.5 animate-ping-slow rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

/** Éclat lumineux ponctuel (impact, explosion, réussite). */
export function Burst({
  x,
  y,
  progress,
  size = 40,
  color = "var(--color-destructive)",
}: {
  x: number;
  y: number;
  progress: number;
  size?: number;
  color?: string;
}) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <span
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${size * (0.35 + p * 1.5)}%`,
        height: `${size * (0.35 + p * 1.5)}%`,
        background: `radial-gradient(circle, oklch(1 0 0 / ${0.55 * (1 - p)}) 0%, color-mix(in oklab, ${color} 70%, transparent) 35%, transparent 70%)`,
        opacity: 1 - p,
      }}
    />
  );
}
