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
import { Burst, GameStage, Hud, Runner } from "./GameStage";
import { imgBombArena } from "./images";

export function BombArenaGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed + 606);
    const duration = pickDuration(rng, 45, 75, players.length);
    const order = shuffle(players, rng);
    const winner = order[order.length - 1]!;
    const eliminated = order.slice(0, -1);
    const interval = (duration - 5) / Math.max(eliminated.length, 1);
    const units = players.map((name) => ({
      name,
      x: rng(),
      y: rng(),
      vx: 0.08 + rng() * 0.18,
      vy: 0.06 + rng() * 0.16,
      phase: rng() * 8,
      death: eliminated.indexOf(name) >= 0 ? 2.4 + eliminated.indexOf(name) * interval : duration + 8,
    }));
    const blasts = Array.from({ length: 14 }, () => ({
      at: 2 + rng() * (duration - 8),
      x: rng(),
      y: rng(),
    }));
    return {
      units,
      blasts,
      duration,
      ranking: lastStandingRanking([winner], eliminated),
      visual: takeVisual(units),
    };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));
  const dead = new Set(sim.units.filter((u) => t >= u.death).map((u) => u.name));
  const active = sim.blasts.filter((b) => t - b.at >= 0 && t - b.at < 1.4);

  return (
    <GameStage
      image={imgBombArena}
      title="Bomb Arena"
      subtitle="Le sol explose · reste en mouvement"
      aspect="4/3"
      shake={active.length > 0}
      status={
        <>
          <Hud tone="live">{players.length - dead.size} en vie</Hud>
          <Hud tone="danger">{active.length} impacts</Hud>
        </>
      }
      caption="Bombes en rafale : lis le terrain, le dernier survivant remporte le giveaway."
    >
      {sim.blasts.map((b, i) => {
        const age = t - b.at;
        if (age < -1 || age > 1.4) return null;
        if (age < 0)
          return (
            <span
              key={`w${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-destructive/70"
              style={{
                left: `${b.x * 100}%`,
                top: `${b.y * 100}%`,
                width: "16%",
                height: "16%",
                opacity: 0.3 + 0.7 * Math.abs(Math.sin(age * 14)),
              }}
            />
          );
        return <Burst key={i} x={b.x} y={b.y} progress={age / 1.4} size={70} />;
      })}
      {sim.visual.map((u) => {
        const out = dead.has(u.name);
        const x = clamp(u.x + Math.sin(t * u.vx + u.phase) * 0.22, 0.05, 0.95);
        const y = clamp(u.y + Math.cos(t * u.vy + u.phase) * 0.2, 0.05, 0.95);
        return (
          <div
            key={u.name}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
          >
            <Runner name={u.name} size={22} dead={out} trail={out ? 0 : 10} />
          </div>
        );
      })}
    </GameStage>
  );
}
