import { useMemo } from "react";
import { clamp, makeRng, takeVisual, type MiniGameProps } from "@/lib/game-utils";
import { useClock, useFinishAt } from "@/lib/use-clock";
import { GameStage, Hud, Runner } from "./GameStage";
import { imgCourse } from "./images";

export function RaceGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed);
    const racers = players.map((name) => ({
      name,
      finish: 24 + rng() * 12,
      wiggle: 0.05 + rng() * 0.12,
      freq: 0.6 + rng() * 1.4,
      phase: rng() * Math.PI * 2,
    }));
    const duration = Math.max(...racers.map((r) => r.finish)) + 2;
    const ranking = [...racers].sort((a, b) => a.finish - b.finish).map((r) => r.name);
    return { racers, duration, ranking, visual: takeVisual(racers, 24) };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));

  const start = 2;
  const done = sim.racers.filter((r) => t - start >= r.finish).length;

  return (
    <GameStage
      image={imgCourse}
      title="Course"
      subtitle="Sprint automatique · photo-finish"
      minHeight={420}
      aspect="auto"
      status={
        <>
          <Hud tone="live">{done}/{players.length} arrivés</Hud>
          {done > 0 && <Hud tone="gold">🥇 {sim.ranking[0]}</Hud>}
        </>
      }
      caption="Accélérations, coups de mou et photo-finish : la ligne dorée départage tout le monde."
    >
      <div className="absolute inset-0 space-y-2 overflow-y-auto p-3">
        {sim.visual.map((r) => {
          const raw = clamp((t - start) / r.finish, 0, 1);
          const noise = Math.sin(t * r.freq + r.phase) * r.wiggle * (1 - raw);
          const p = clamp(raw + noise, 0, 1);
          const arrived = t - start >= r.finish;
          return (
            <div
              key={r.name}
              className="relative h-11 overflow-hidden rounded-lg border border-border/70 bg-background/45"
            >
              <div
                className="absolute inset-y-0 right-0 w-1.5"
                style={{ background: "var(--color-gold)", boxShadow: "0 0 20px oklch(0.828 0.14 88 / 80%)" }}
              />
              <div
                className="absolute inset-y-0 w-20"
                style={{
                  left: `${((t * 40 + r.phase * 20) % 130) - 15}%`,
                  background:
                    "linear-gradient(90deg, transparent, oklch(0.743 0.085 116.6 / 12%), transparent)",
                }}
              />
              <div
                className="absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-2"
                style={{ left: `calc(${p * 88}% + 6px)` }}
              >
                <Runner name={r.name} size={28} trail={arrived ? 0 : 26} lead={p > 0.95} />
                <span className="max-w-28 truncate text-xs font-semibold sm:max-w-40 sm:text-sm">
                  {r.name}
                </span>
                {arrived && <span className="text-xs">🏁</span>}
              </div>
            </div>
          );
        })}
      </div>
    </GameStage>
  );
}
