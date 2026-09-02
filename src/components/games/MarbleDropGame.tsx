import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  clamp,
  lastStandingRanking,
  makeRng,
  pickDuration,
  takeVisual,
  type MiniGameProps,
} from "@/lib/game-utils";
import { useClock, useFinishAt } from "@/lib/use-clock";
import { GameStage, Hud } from "./GameStage";
import { imgMarbleDrop } from "./images";
import type { Marble3DState } from "./MarbleDrop3D";

const MarbleDrop3D = lazy(() => import("./MarbleDrop3D"));

export function MarbleDropGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed + 101);
    const duration = pickDuration(rng, 45, 75, players.length);
    const marbles = players.map((name) => {
      const fall = duration * (0.72 + rng() * 0.22);
      const ejected = rng() < 0.42;
      const ejectAt = ejected ? 0.72 + rng() * 0.22 : 1;
      const delay = rng() * 2.2;
      return { name, fall, ejectAt, delay, speed: 0.85 + rng() * 0.4 };
    });
    const finishers = marbles
      .filter((m) => m.ejectAt >= 1)
      .sort((a, b) => a.fall - b.fall)
      .map((m) => m.name);
    const ejected = marbles
      .filter((m) => m.ejectAt < 1)
      .sort((a, b) => a.ejectAt - b.ejectAt)
      .map((m) => m.name);
    const ranking = lastStandingRanking(finishers, ejected);
    return { marbles, duration, ranking, visual: takeVisual(marbles, 60) };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));

  // Le Canvas WebGL ne doit jamais être rendu côté serveur.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const out = sim.marbles.filter((m) => (t - m.delay) / m.fall >= m.ejectAt && m.ejectAt < 1).length;

  const states: Marble3DState[] = sim.visual.map((m) => {
    const local = clamp((t - m.delay) / m.fall, 0, 1);
    const raw = local * m.speed;
    const dead = raw >= m.ejectAt && m.ejectAt < 1;
    return {
      name: m.name,
      p: Math.min(raw, m.ejectAt, 1),
      dead,
      deadFor: dead ? Math.max(0, (local - m.ejectAt) * m.fall) : 0,
    };
  });

  // Classement temps réel : vivants d'abord (progression décroissante), puis éjectés.
  const live = useMemo(() => {
    const alive = states.filter((s) => !s.dead).sort((a, b) => b.p - a.p);
    const gone = states.filter((s) => s.dead).sort((a, b) => b.p - a.p);
    return [...alive, ...gone];
  }, [states]);

  const ranks = useMemo(() => {
    const r: Record<string, number> = {};
    live.forEach((s, i) => (r[s.name] = i + 1));
    return r;
  }, [live]);

  const remaining = Math.max(0, Math.ceil(sim.duration - t));

  return (
    <GameStage
      full
      image={imgMarbleDrop}
      title="Marble Drop"
      subtitle="Arène tornade 3D · pièges & accélérateurs"
      aspect="auto"
      status={
        <>
          <Hud tone="live">{players.length - out} billes</Hud>
          <Hud tone="danger">{out} aspirées</Hud>
          <Hud tone="gold">{remaining}s</Hud>
        </>
      }
    >
      {mounted && (
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Chargement de l'arène 3D…
            </div>
          }
        >
          <div className="absolute inset-0">
            <MarbleDrop3D marbles={states} ranks={ranks} />
          </div>
        </Suspense>
      )}

      {/* Classement temps réel */}
      <div className="pointer-events-none absolute left-3 top-3 z-30 w-52 rounded-xl border border-border/70 bg-background/70 p-3 backdrop-blur-md sm:w-60">
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>Classement live</span>
          <span>{live.length}</span>
        </div>
        <ol className="space-y-1">
          {live.slice(0, 10).map((s, i) => (
            <li
              key={s.name}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 font-mono text-[11px]"
              style={{
                background: i === 0 ? "oklch(0.72 0.14 95 / 14%)" : "oklch(1 0 0 / 4%)",
                opacity: s.dead ? 0.4 : 1,
              }}
            >
              <span
                className="w-4 shrink-0 text-right font-semibold"
                style={{ color: i === 0 ? "var(--color-gold)" : "var(--color-muted-foreground)" }}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {s.dead ? "✕" : `${Math.round(s.p * 100)}%`}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </GameStage>
  );
}
