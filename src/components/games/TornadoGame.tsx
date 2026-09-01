import { useMemo } from "react";
import {
  clamp,
  lastStandingRanking,
  makeRng,
  pickDuration,
  shuffle,
  takeVisual,
  type MiniGameProps,
} from "@/lib/game-utils";
import { useClock, useFinishAt } from "@/lib/use-clock";
import { GameStage, Hud, Runner } from "./GameStage";
import { imgTornado } from "./images";

export function TornadoGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed + 707);
    const duration = pickDuration(rng, 30, 60, players.length);
    const order = shuffle(players, rng);
    const winner = order[order.length - 1]!;
    const eliminated = order.slice(0, -1);
    const interval = (duration - 4) / Math.max(eliminated.length, 1);
    const units = players.map((name) => ({
      name,
      x: rng(),
      y: rng(),
      wander: 0.1 + rng() * 0.2,
      phase: rng() * 10,
      death: eliminated.indexOf(name) >= 0 ? 1.8 + eliminated.indexOf(name) * interval : duration + 8,
    }));
    return {
      units,
      duration,
      ranking: lastStandingRanking([winner], eliminated),
      visual: takeVisual(units),
    };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));
  const tx = 0.5 + Math.sin(t * 0.85) * 0.34;
  const ty = 0.5 + Math.cos(t * 0.62) * 0.28;
  const dead = new Set(sim.units.filter((u) => t >= u.death).map((u) => u.name));

  return (
    <GameStage
      image={imgTornado}
      title="Tornado"
      subtitle="Ne reste jamais immobile"
      aspect="4/3"
      shake
      status={
        <>
          <Hud tone="live">{players.length - dead.size} debout</Hud>
          <Hud tone="danger">{dead.size} aspirés</Hud>
        </>
      }
      caption="La tornade se déplace et aspire tout sur son passage. Le dernier debout gagne."
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border border-primary/30"
          style={{
            left: `${tx * 100}%`,
            top: `${ty * 100}%`,
            width: `${20 + i * 14}%`,
            height: `${20 + i * 14}%`,
            animationDuration: `${3 + i}s`,
          }}
        />
      ))}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: `${tx * 100}%`,
          top: `${ty * 100}%`,
          width: "30%",
          height: "30%",
          background:
            "radial-gradient(circle, oklch(0.95 0.02 118 / 75%), oklch(0.371 0.083 320 / 30%) 55%, transparent 72%)",
          boxShadow: "0 0 90px oklch(0.371 0.083 320 / 65%)",
        }}
      />
      {sim.visual.map((u) => {
        const out = dead.has(u.name);
        let x = clamp(u.x + Math.sin(t * u.wander + u.phase) * 0.28, 0.04, 0.96);
        let y = clamp(u.y + Math.cos(t * u.wander * 1.1 + u.phase) * 0.24, 0.04, 0.96);
        if (out) {
          x += (tx - x) * 0.7;
          y += (ty - y) * 0.7;
        }
        return (
          <div
            key={u.name}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              transform: out ? `translate(-50%,-50%) rotate(${t * 320}deg) scale(0.75)` : undefined,
              transition: "left 0.12s linear, top 0.12s linear",
            }}
          >
            <Runner name={u.name} size={22} dead={out} trail={out ? 0 : 10} />
          </div>
        );
      })}
    </GameStage>
  );
}
