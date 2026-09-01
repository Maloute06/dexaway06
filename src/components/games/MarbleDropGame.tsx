import { useMemo } from "react";
import {
  clamp,
  lastStandingRanking,
  makeRng,
  pickDuration,
  takeVisual,
  type MiniGameProps,
} from "@/lib/game-utils";
import { useClock, useFinishAt } from "@/lib/use-clock";
import { GameStage, Hud, Runner } from "./GameStage";
import { imgMarbleDrop } from "./images";

function spiral(p: number) {
  const a = p * Math.PI * 7.2;
  const r = 0.44 * (1 - p * 0.88);
  return { x: 50 + Math.cos(a) * r * 100, y: 50 + Math.sin(a) * r * 100 };
}

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
    return { marbles, duration, ranking, visual: takeVisual(marbles) };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));

  const out = sim.marbles.filter((m) => (t - m.delay) / m.fall >= m.ejectAt && m.ejectAt < 1).length;

  return (
    <GameStage
      image={imgMarbleDrop}
      title="Marble Drop"
      subtitle="Descente en spirale · pièges & accélérateurs"
      aspect="square"
      status={
        <>
          <Hud tone="live">{players.length - out} billes</Hud>
          <Hud tone="danger">{out} éjectées</Hud>
        </>
      }
      caption="Certaines billes sont éjectées dans la dernière courbe. Le cœur doré est l'arrivée."
    >
      <div
        className="absolute inset-[8%] rounded-full border border-primary/30"
        style={{ boxShadow: "inset 0 0 90px oklch(0.371 0.083 320 / 40%)" }}
      />
      <div className="absolute inset-[22%] rounded-full border border-primary/25" />
      <div className="absolute inset-[38%] rounded-full border border-gold/40" />
      <div
        className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 animate-ping-slow rounded-full"
        style={{
          background: "var(--color-gold)",
          boxShadow: "0 0 40px oklch(0.828 0.14 88 / 85%)",
        }}
      />
      {sim.visual.map((m) => {
        const local = clamp((t - m.delay) / m.fall, 0, 1);
        if (t < m.delay) return null;
        const p = Math.min(local * m.speed, m.ejectAt);
        const dead = local * m.speed >= m.ejectAt && m.ejectAt < 1;
        const pos = spiral(p);
        const kick = dead ? (local - m.ejectAt) * 40 : 0;
        return (
          <div
            key={m.name}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${pos.x + kick}%`,
              top: `${pos.y - kick * 0.4}%`,
              transition: "left 0.08s linear, top 0.08s linear",
            }}
          >
            <Runner name={m.name} size={22} dead={dead} trail={dead ? 0 : 14} lead={p > 0.85} />
          </div>
        );
      })}
    </GameStage>
  );
}
