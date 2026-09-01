import { useMemo } from "react";
import { clamp, makeRng, shuffle, takeVisual, type MiniGameProps } from "@/lib/game-utils";
import { useClock, useFinishAt } from "@/lib/use-clock";
import { GameStage, Hud, Runner } from "./GameStage";
import { imgExplosion } from "./images";

export function ExplosionGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed + 21);
    const order = shuffle(players, rng);
    const eliminationOrder = order.slice(0, Math.max(order.length - 1, 0));
    const interval = clamp(45 / Math.max(eliminationOrder.length, 1), 1.2, 4.5);
    const duration = 2 + eliminationOrder.length * interval + 2.5;
    const ranking = [order[order.length - 1], ...[...eliminationOrder].reverse()].filter(
      (n): n is string => Boolean(n),
    );
    return { order, eliminationOrder, interval, duration, ranking, visual: takeVisual(order, 48) };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));

  const blown = Math.max(0, Math.min(sim.eliminationOrder.length, Math.floor((t - 2) / sim.interval) + 1));
  const dead = new Set(sim.eliminationOrder.slice(0, blown));
  const fuse = clamp(((t - 2) % sim.interval) / sim.interval, 0, 1);
  const critical = fuse > 0.85;

  return (
    <GameStage
      image={imgExplosion}
      title="Explosion"
      subtitle="La bombe saute à intervalle régulier"
      minHeight={400}
      aspect="auto"
      shake={critical}
      status={
        <>
          <Hud tone="live">{sim.order.length - dead.size} survivants</Hud>
          <Hud tone="danger">mèche {Math.round((1 - fuse) * 100)}%</Hud>
        </>
      }
      caption="Mode explosion : le dernier debout remporte le giveaway."
    >
      <div className="absolute inset-0 flex flex-col p-3">
        <div className="h-2 shrink-0 overflow-hidden rounded-full bg-background/70">
          <div
            className="h-full"
            style={{
              width: `${(1 - fuse) * 100}%`,
              background: "var(--color-destructive)",
              boxShadow: "0 0 18px oklch(0.577 0.245 27.3 / 85%)",
              transition: "width 0.08s linear",
            }}
          />
        </div>
        <div className="mt-3 grid flex-1 grid-cols-4 content-start gap-2 overflow-y-auto sm:grid-cols-6 lg:grid-cols-8">
          {sim.visual.map((name) => {
            const out = dead.has(name);
            const justOut = sim.eliminationOrder[blown - 1] === name && fuse < 0.25;
            return (
              <div
                key={name}
                className="flex flex-col items-center gap-1 rounded-lg border border-border/70 bg-background/45 p-2"
                style={{
                  boxShadow: justOut ? "0 0 30px oklch(0.577 0.245 27.3 / 70%)" : undefined,
                  transition: "box-shadow 0.3s ease",
                }}
              >
                <div className="relative">
                  <Runner name={name} size={34} dead={out} />
                  {out && (
                    <span className={`absolute -right-2 -top-2 text-lg ${justOut ? "animate-pop" : ""}`}>
                      💥
                    </span>
                  )}
                </div>
                <span className="w-full truncate text-center text-[11px]">{name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </GameStage>
  );
}
