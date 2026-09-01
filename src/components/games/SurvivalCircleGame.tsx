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
import { imgSurvivalCircle } from "./images";

export function SurvivalCircleGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed + 303);
    const duration = pickDuration(rng, 60, 90, players.length);
    const order = shuffle(players, rng);
    const winner = order[order.length - 1]!;
    const eliminated = order.slice(0, -1);
    const interval = (duration - 6) / Math.max(eliminated.length, 1);
    const units = players.map((name) => ({
      name,
      ang: rng() * Math.PI * 2,
      orbit: 0.18 + rng() * 0.28,
      spin: 0.4 + rng() * 0.9,
      death: eliminated.indexOf(name) >= 0 ? 3 + eliminated.indexOf(name) * interval : duration + 10,
    }));
    return {
      units,
      duration,
      ranking: lastStandingRanking([winner], eliminated),
      visual: takeVisual(units),
      events: [
        { at: duration * 0.25, label: "Tempête de zone" },
        { at: duration * 0.5, label: "Salve aléatoire" },
        { at: duration * 0.75, label: "Le cercle se referme" },
      ],
    };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));
  const radius = clamp(1 - (t - 2) / (sim.duration - 4), 0.12, 1);
  const dead = new Set(sim.units.filter((u) => t >= u.death).map((u) => u.name));
  const event = [...sim.events].reverse().find((e) => t >= e.at);

  return (
    <GameStage
      image={imgSurvivalCircle}
      title="Survival Circle"
      subtitle={event?.label ?? "Zone ouverte"}
      aspect="square"
      shake={Boolean(event) && radius < 0.4}
      status={
        <>
          <Hud tone="live">{players.length - dead.size} survivants</Hud>
          <Hud tone="danger">zone {Math.round(radius * 100)}%</Hud>
        </>
      }
      caption="L'arène rétrécit sans arrêt. Il faut tenir jusqu'à ce qu'il n'en reste plus qu'un."
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-destructive/80"
        style={{
          width: `${radius * 88}%`,
          height: `${radius * 88}%`,
          boxShadow:
            "0 0 60px oklch(0.577 0.245 27.3 / 55%), inset 0 0 60px oklch(0.577 0.245 27.3 / 25%)",
          transition: "width 0.2s linear, height 0.2s linear",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border border-primary/25"
        style={{ width: `${radius * 104}%`, height: `${radius * 104}%` }}
      />
      {sim.visual.map((u) => {
        const out = dead.has(u.name);
        const r = out ? u.orbit * 1.15 : u.orbit * radius * 1.6 + 0.04;
        const a = u.ang + t * u.spin;
        return (
          <div
            key={u.name}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${50 + Math.cos(a) * r * 100}%`,
              top: `${50 + Math.sin(a) * r * 100}%`,
            }}
          >
            <Runner name={u.name} size={22} dead={out} trail={out ? 0 : 12} />
          </div>
        );
      })}
    </GameStage>
  );
}
