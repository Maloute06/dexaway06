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
    return { marbles, duration, ranking, visual: takeVisual(marbles, 80) };
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

  const leader = states
    .filter((s) => !s.dead)
    .reduce<Marble3DState | null>((best, s) => (!best || s.p > best.p ? s : best), null);

  return (
    <GameStage
      image={imgMarbleDrop}
      title="Marble Drop"
      subtitle="Descente 3D en spirale · pièges & accélérateurs"
      aspect="video"
      minHeight={460}
      status={
        <>
          <Hud tone="live">{players.length - out} billes</Hud>
          <Hud tone="danger">{out} éjectées</Hud>
        </>
      }
      caption="Les billes dévalent la spirale en 3D. Celles qui décrochent sont éjectées dans le vide — le cœur doré, tout en bas, est l'arrivée."
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
            <MarbleDrop3D marbles={states} leader={leader?.name} />
          </div>
        </Suspense>
      )}
    </GameStage>
  );
}
