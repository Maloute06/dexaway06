import { useMemo } from "react";
import { clamp, makeRng, pickDuration, takeVisual, type MiniGameProps } from "@/lib/game-utils";
import { useClock, useFinishAt } from "@/lib/use-clock";
import { GameStage, Hud, Runner } from "./GameStage";
import { imgCoinDrop } from "./images";

const SLOTS = [50, 120, 300, 800, 2000, 800, 300, 120, 50];
const ROWS = 8;

export function CoinDropGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed + 808);
    const duration = pickDuration(rng, 30, 60, players.length);
    const coins = players.map((name, i) => {
      const path: number[] = [0.5];
      for (let r = 0; r < ROWS; r++) {
        path.push(clamp(path[path.length - 1]! + (rng() < 0.5 ? -1 : 1) * 0.08, 0.05, 0.95));
      }
      const slot = clamp(Math.floor(path[path.length - 1]! * SLOTS.length), 0, SLOTS.length - 1);
      const delay = 0.4 + i * Math.min(0.12, 8 / Math.max(players.length, 1));
      const fall = duration * 0.55 + rng() * 4;
      return { name, path, slot, delay, fall, score: SLOTS[slot]! + rng() * 10 };
    });
    const ranking = [...coins].sort((a, b) => b.score - a.score).map((c) => c.name);
    return { coins, duration, ranking, visual: takeVisual(coins, 56) };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));
  const landed = sim.coins.filter((c) => t >= c.delay + c.fall);
  const best = [...landed].sort((a, b) => b.score - a.score)[0];

  return (
    <GameStage
      image={imgCoinDrop}
      title="Coin Drop"
      subtitle="Machine à sous géante · jusqu'à 2000 pts"
      aspect="4/3"
      status={
        <>
          <Hud tone="live">{landed.length}/{players.length} tombés</Hud>
          {best && <Hud tone="gold">🥇 {best.name}</Hud>}
        </>
      }
      caption="Chaque viewer est une pièce. La case touchée en bas fixe son score."
    >
      {Array.from({ length: ROWS }).map((_, r) => (
        <div
          key={r}
          className="absolute flex w-full justify-center gap-[4%]"
          style={{ top: `${((r + 0.6) / (ROWS + 2)) * 100}%` }}
        >
          {Array.from({ length: 7 + (r % 2) }).map((_, c) => (
            <span
              key={c}
              className="size-1.5 rounded-full"
              style={{
                background: "var(--color-gold)",
                boxShadow: "0 0 10px oklch(0.828 0.14 88 / 75%)",
                opacity: 0.5 + 0.5 * Math.abs(Math.sin(t * 2 + r * 0.7 + c)),
              }}
            />
          ))}
        </div>
      ))}
      {sim.visual.map((coin) => {
        if (t < coin.delay) return null;
        const local = clamp((t - coin.delay) / coin.fall, 0, 1);
        const row = local * ROWS;
        const i = Math.floor(row);
        const frac = row - i;
        const x = coin.path[i]! + (coin.path[Math.min(i + 1, ROWS)]! - coin.path[i]!) * frac;
        return (
          <div
            key={coin.name}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${x * 100}%`,
              top: `${((local * ROWS + 0.35) / (ROWS + 2)) * 100}%`,
              transition: "left 0.08s linear",
            }}
          >
            <Runner name={coin.name} size={20} lead={local >= 1 && coin.slot === 4} />
          </div>
        );
      })}
      <div className="absolute inset-x-0 bottom-0 z-10 flex">
        {SLOTS.map((v, i) => (
          <div
            key={i}
            className="flex-1 border-t border-border/70 py-1 text-center font-mono text-[10px] font-bold sm:text-xs"
            style={{
              background: `linear-gradient(0deg, oklch(0.828 0.14 88 / ${0.1 + v / 4000}), transparent)`,
              color: v >= 800 ? "var(--color-gold)" : "var(--color-foreground)",
              textShadow: v >= 800 ? "0 0 14px oklch(0.828 0.14 88 / 80%)" : undefined,
            }}
          >
            {v}
          </div>
        ))}
      </div>
    </GameStage>
  );
}
