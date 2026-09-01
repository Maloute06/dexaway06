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
import { imgTrainSwitch } from "./images";

const RAILS = 4;

export function TrainSwitchGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed + 404);
    const duration = pickDuration(rng, 45, 60, players.length);
    const trains = players.map((name) => {
      const switches = [0.28, 0.52, 0.76].map((at) => ({
        at,
        from: Math.floor(rng() * RAILS),
        survive: rng() > 0.38,
      }));
      const doomed = switches.find((s) => !s.survive);
      return {
        name,
        rail: Math.floor(rng() * RAILS),
        finish: duration * (0.7 + rng() * 0.25),
        dieAt: doomed ? doomed.at * duration : duration + 5,
      };
    });
    const alive = trains.filter((tr) => tr.dieAt > duration).sort((a, b) => a.finish - b.finish);
    const dead = trains.filter((tr) => tr.dieAt <= duration).sort((a, b) => a.dieAt - b.dieAt);
    const ranking =
      alive.length > 0
        ? lastStandingRanking(
            alive.map((tr) => tr.name),
            dead.map((tr) => tr.name),
          )
        : lastStandingRanking(
            [dead[dead.length - 1]!.name],
            dead.slice(0, -1).map((tr) => tr.name),
          );
    return { trains, duration, ranking, visual: takeVisual(trains, 48) };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));
  const progress = clamp(t / sim.duration, 0, 1);
  const crashed = sim.trains.filter((tr) => t >= tr.dieAt).length;

  return (
    <GameStage
      image={imgTrainSwitch}
      title="Train Switch"
      subtitle="Aiguillages · un mauvais rail et c'est fini"
      minHeight={330}
      aspect="auto"
      status={
        <>
          <Hud tone="live">{Math.round(progress * 100)}%</Hud>
          <Hud tone="danger">{crashed} déraillés</Hud>
        </>
      }
      caption="Les rails changent sans prévenir. Les survivants s'affrontent à l'arrivée."
    >
      <div className="absolute inset-0 flex flex-col justify-center gap-3 p-3">
        {Array.from({ length: RAILS }).map((_, rail) => (
          <div
            key={rail}
            className="relative h-14 overflow-hidden rounded-lg border border-border/70 bg-background/45"
          >
            <div className="absolute inset-y-3 inset-x-2 border-y-2 border-dashed border-primary/35" />
            <div
              className="absolute inset-y-0 w-24"
              style={{
                left: `${((t * 34 + rail * 25) % 130) - 15}%`,
                background:
                  "linear-gradient(90deg, transparent, oklch(0.828 0.14 88 / 22%), transparent)",
              }}
            />
            <div
              className="absolute top-1/2 h-0.5 w-10 -translate-y-1/2 bg-gold"
              style={{
                left: `${18 + ((rail + Math.floor(t * 2)) % 3) * 22}%`,
                boxShadow: "0 0 16px oklch(0.828 0.14 88 / 80%)",
              }}
            />
            {sim.visual
              .filter((tr) => tr.rail === rail)
              .map((tr) => {
                const dead = t >= tr.dieAt;
                const p = clamp(t / tr.finish, 0, 1);
                return (
                  <div
                    key={tr.name}
                    className="absolute z-10"
                    style={{
                      left: `${dead ? p * 40 : p * 86}%`,
                      top: dead ? "120%" : "50%",
                      transform: "translateY(-50%)",
                      transition: "top 0.4s ease",
                    }}
                  >
                    <Runner name={tr.name} size={24} dead={dead} trail={dead ? 0 : 22} lead={p > 0.92} />
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </GameStage>
  );
}
