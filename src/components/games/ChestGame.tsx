import { useMemo } from "react";
import { makeRng, type MiniGameProps } from "@/lib/game-utils";
import { useClock, useFinishAt } from "@/lib/use-clock";
import { GameStage, Hud, Runner } from "./GameStage";
import { imgCoffre } from "./images";

const ROUND = 5.5;
const CHESTS = 3;

interface Round {
  picks: Record<string, number>;
  trapped: number;
  eliminated: string[];
  survivors: string[];
}

export function ChestGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed + 7);
    let alive = [...players];
    const rounds: Round[] = [];
    const eliminationOrder: string[] = [];

    while (alive.length > 1 && rounds.length < 14) {
      const picks: Record<string, number> = {};
      alive.forEach((n) => (picks[n] = Math.floor(rng() * CHESTS)));
      const trapped = Math.floor(rng() * CHESTS);
      let eliminated = alive.filter((n) => picks[n] === trapped);
      if (eliminated.length === alive.length) eliminated = eliminated.slice(1);
      const survivors = alive.filter((n) => !eliminated.includes(n));
      eliminated.forEach((n) => eliminationOrder.push(n));
      rounds.push({ picks, trapped, eliminated, survivors });
      alive = survivors;
    }

    const ranking = [...alive, ...eliminationOrder.reverse()];
    return { rounds, ranking, duration: rounds.length * ROUND + 2.5 };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));

  const index = Math.min(Math.floor(t / ROUND), sim.rounds.length - 1);
  const round = sim.rounds[index]!;
  const inRound = t - index * ROUND;
  const revealed = inRound > 2.8;

  return (
    <GameStage
      image={imgCoffre}
      title="Coffres piégés"
      subtitle={`Manche ${index + 1} / ${sim.rounds.length}`}
      minHeight={340}
      aspect="auto"
      shake={revealed && inRound < 3.1}
      status={
        <>
          <Hud tone="live">{round.survivors.length + round.eliminated.length} en lice</Hud>
          <Hud tone={revealed ? "danger" : "muted"}>
            {revealed ? "Ouverture" : "Choix en cours"}
          </Hud>
        </>
      }
      caption="Un coffre sur trois est piégé. Ceux qui l'ouvrent quittent la partie."
    >
      <div className="absolute inset-0 grid gap-3 p-3 sm:grid-cols-3">
        {Array.from({ length: CHESTS }).map((_, c) => {
          const isTrap = revealed && round.trapped === c;
          const names = Object.keys(round.picks).filter((n) => round.picks[n] === c);
          return (
            <div
              key={c}
              className="overflow-y-auto rounded-xl border border-border/70 p-3 transition-colors"
              style={{
                background: revealed
                  ? isTrap
                    ? "oklch(0.577 0.245 27.3 / 28%)"
                    : "oklch(0.633 0.079 115.2 / 24%)"
                  : "oklch(0.164 0.016 210.9 / 55%)",
                boxShadow: revealed
                  ? isTrap
                    ? "inset 0 0 50px oklch(0.577 0.245 27.3 / 45%)"
                    : "inset 0 0 50px oklch(0.633 0.079 115.2 / 35%)"
                  : undefined,
              }}
            >
              <div className={`text-center text-3xl ${revealed ? "animate-pop" : "animate-float"}`}>
                {revealed ? (isTrap ? "💀" : "💎") : "🎁"}
              </div>
              <div className="mt-1 text-center font-display text-lg tracking-widest">
                Coffre {c + 1}
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {names.slice(0, 40).map((n) => (
                  <Runner key={n} name={n} size={24} dead={revealed && isTrap} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GameStage>
  );
}
