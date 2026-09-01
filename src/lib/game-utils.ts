export interface MiniGameProps {
  players: string[];
  seed: number;
  onFinish: (ranking: string[]) => void;
}

export type GameKind = "Course" | "Élimination" | "Score";

export interface MiniGameMeta {
  id: string;
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  kind: GameKind;
  playersMin: number;
  playersMax: number;
  durationMin: number;
  durationMax: number;
}

/** Deterministic pseudo-random generator (mulberry32). */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable hue per player, used with oklch tokens for avatars. */
export function playerHue(name: string) {
  return hashString(name) % 360;
}

export function initials(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "??";
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Spectacle length inside a game's advertised window, slightly longer with more players. */
export function pickDuration(rng: () => number, min: number, max: number, crowd: number) {
  const t = clamp((crowd - 2) / 48, 0, 1);
  return min + (max - min) * (0.28 + 0.52 * t + 0.2 * rng());
}

/** Cap DOM nodes so 1000-player lobbies stay smooth. */
export function takeVisual<T>(items: T[], cap = 64): T[] {
  if (items.length <= cap) return items;
  const out: T[] = [];
  const step = (items.length - 1) / (cap - 1);
  for (let i = 0; i < cap; i++) out.push(items[Math.round(i * step)]!);
  return out;
}

export function lastStandingRanking(alive: string[], eliminated: string[]) {
  return [...alive, ...[...eliminated].reverse()];
}
