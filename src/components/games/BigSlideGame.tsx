import { useMemo } from "react";
import { clamp, makeRng, pickDuration, takeVisual, type MiniGameProps } from "@/lib/game-utils";
import { useClock, useFinishAt } from "@/lib/use-clock";
import { GameStage, Hud, Runner } from "./GameStage";
import { imgBigSlide } from "./images";

export function BigSlideGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed + 202);
    const duration = pickDuration(rng, 30, 60, players.length);
    const sliders = players.map((name) => ({
      name,
      lane: rng(),
      finish: duration * (0.55 + rng() * 0.38),
      bump: 0.04 + rng() * 0.1,
      freq: 1.2 + rng() * 2.2,
      phase: rng() * Math.PI * 2,
    }));
    const ranking = [...sliders].sort((a, b) => a.finish - b.finish).map((s) => s.name);
    return { sliders, duration, ranking, visual: takeVisual(sliders, 80) };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));
  const arrived = sim.sliders.filter((s) => t >= s.finish).length;

  return (
    <GameStage
      image={imgBigSlide}
      title="Big Slide"
      subtitle="Toboggan géant · premier en bas"
      minHeight={430}
      aspect="auto"
      status={
        <>
          <Hud tone="live">{arrived}/{players.length} en bas</Hud>
          {arrived > 0 && <Hud tone="gold">🥇 {sim.ranking[0]}</Hud>}
        </>
      }
      caption="Tout le monde glisse en même temps. Le premier à toucher la ligne dorée rafle la mise."
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.371 0.083 320 / 45%), oklch(0.525 0.069 118.7 / 20%) 45%, oklch(0.633 0.079 115.2 / 34%))",
        }}
      />
      <div className="absolute inset-x-[8%] top-0 h-full border-x border-dashed border-primary/30" />
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="absolute inset-x-0 h-px bg-primary/20"
          style={{ top: `${((i * 12 + t * 26) % 100)}%` }}
        />
      ))}
      <div
        className="absolute inset-x-0 bottom-0 h-3"
        style={{
          background: "var(--color-gold)",
          boxShadow: "0 0 34px oklch(0.828 0.14 88 / 80%)",
        }}
      />
      {sim.visual.map((s) => {
        const raw = clamp(t / s.finish, 0, 1);
        const x = clamp(s.lane + Math.sin(t * s.freq + s.phase) * s.bump, 0.05, 0.95);
        const done = t >= s.finish;
        return (
          <div
            key={s.name}
            className="absolute z-10 -translate-x-1/2"
            style={{ left: `${x * 100}%`, top: `${raw * 88}%` }}
          >
            <Runner name={s.name} size={done ? 20 : 26} lead={raw > 0.9} trail={done ? 0 : 18} />
          </div>
        );
      })}
    </GameStage>
  );
}
