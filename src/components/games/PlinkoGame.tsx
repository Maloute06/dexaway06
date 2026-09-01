import { useMemo } from "react";
import { clamp, makeRng, type MiniGameProps } from "@/lib/game-utils";
import { useClock, useFinishAt } from "@/lib/use-clock";
import { GameStage, Hud, Runner } from "./GameStage";
import { imgPlinko } from "./images";

const ROWS = 10;
const MULTIPLIERS = [1.5, 2, 3.5, 7, 12, 7, 3.5, 2, 1.5];

export function PlinkoGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed);
    const stagger = Math.min(0.45, 18 / Math.max(players.length, 1));
    const balls = players.map((name, i) => {
      const path: number[] = [0.5];
      for (let r = 0; r < ROWS; r++) {
        const step = (rng() < 0.5 ? -1 : 1) * (0.95 / ROWS);
        path.push(clamp(path[path.length - 1]! + step, 0.04, 0.96));
      }
      const slot = clamp(Math.floor(path[path.length - 1]! * MULTIPLIERS.length), 0, MULTIPLIERS.length - 1);
      const delay = 1 + i * stagger;
      const fall = 8 + rng() * 3;
      return { name, path, slot, delay, fall, score: MULTIPLIERS[slot]! * 100 + rng() };
    });
    const duration = Math.max(...balls.map((b) => b.delay + b.fall)) + 2.5;
    const ranking = [...balls].sort((a, b) => b.score - a.score).map((b) => b.name);
    return { balls, duration, ranking };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));

  const landed = sim.balls.filter((b) => t >= b.delay + b.fall).length;
  const best = [...sim.balls]
    .filter((b) => t >= b.delay + b.fall)
    .sort((a, b) => b.score - a.score)[0];

  return (
    <GameStage
      image={imgPlinko}
      title="Plinko"
      subtitle="Chute libre · multiplicateurs x1.5 → x12"
      aspect="4/3"
      status={
        <>
          <Hud tone="live">{landed}/{players.length} arrivées</Hud>
          {best && <Hud tone="gold">🥇 {best.name}</Hud>}
        </>
      }
      caption="Chaque viewer est une bille. Le multiplicateur touché détermine son score."
    >
      {Array.from({ length: ROWS }).map((_, r) => (
        <div
          key={r}
          className="absolute flex w-full justify-center gap-[3.2%]"
          style={{ top: `${((r + 0.7) / (ROWS + 2)) * 100}%` }}
        >
          {Array.from({ length: r % 2 === 0 ? 8 : 9 }).map((_, c) => (
            <span
              key={c}
              className="size-2 rounded-full"
              style={{
                background: "var(--color-primary)",
                boxShadow: "0 0 10px oklch(0.743 0.085 116.6 / 80%)",
                opacity: 0.65 + 0.35 * Math.abs(Math.sin(t * 1.6 + r + c)),
              }}
            />
          ))}
        </div>
      ))}

      {sim.balls.map((ball) => {
        const local = clamp((t - ball.delay) / ball.fall, 0, 1);
        if (t < ball.delay) return null;
        const row = local * ROWS;
        const i = Math.floor(row);
        const frac = row - i;
        const x = ball.path[i]! + (ball.path[Math.min(i + 1, ROWS)]! - ball.path[i]!) * frac;
        const done = local >= 1;
        return (
          <div
            key={ball.name}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${x * 100}%`,
              top: `${((local * ROWS + 0.4) / (ROWS + 2)) * 100}%`,
              transition: "left 0.08s linear",
            }}
          >
            <Runner name={ball.name} size={24} lead={done && ball.slot === 4} />
          </div>
        );
      })}

      <div className="absolute inset-x-0 bottom-0 z-10 flex">
        {MULTIPLIERS.map((m, i) => (
          <div
            key={i}
            className="flex-1 border-t border-border/70 py-1.5 text-center font-mono text-[10px] font-bold sm:text-xs"
            style={{
              background: `linear-gradient(0deg, oklch(0.828 0.14 88 / ${0.1 + (m / 12) * 0.55}), transparent)`,
              color: m >= 7 ? "var(--color-gold)" : "var(--color-foreground)",
              textShadow: m >= 7 ? "0 0 14px oklch(0.828 0.14 88 / 80%)" : undefined,
            }}
          >
            x{m}
          </div>
        ))}
      </div>
    </GameStage>
  );
}
