import { useMemo } from "react";
import {
  lastStandingRanking,
  makeRng,
  pickDuration,
  type MiniGameProps,
} from "@/lib/game-utils";
import { useClock, useFinishAt } from "@/lib/use-clock";
import { GameStage, Hud, Runner } from "./GameStage";
import { imgHundredDoors } from "./images";

const SHOWN = 10;
const ROUND = 6.2;

interface Round {
  picks: Record<string, number>;
  safe: number;
  eliminated: string[];
  survivors: string[];
}

export function HundredDoorsGame({ players, seed, onFinish }: MiniGameProps) {
  const sim = useMemo(() => {
    const rng = makeRng(seed + 505);
    const duration = pickDuration(rng, 45, 75, players.length);
    let alive = [...players];
    const rounds: Round[] = [];
    const dumped: string[] = [];
    const maxRounds = Math.max(3, Math.min(12, Math.floor(duration / ROUND) - 1));

    while (alive.length > 1 && rounds.length < maxRounds) {
      const picks: Record<string, number> = {};
      alive.forEach((n) => (picks[n] = Math.floor(rng() * SHOWN)));
      const safe = Math.floor(rng() * SHOWN);
      let eliminated = alive.filter((n) => picks[n] !== safe);
      if (eliminated.length >= alive.length) eliminated = eliminated.slice(1);
      const survivors = alive.filter((n) => !eliminated.includes(n));
      eliminated.forEach((n) => dumped.push(n));
      rounds.push({ picks, safe, eliminated, survivors });
      alive = survivors;
    }

    return {
      rounds,
      duration: Math.max(duration, rounds.length * ROUND + 2.4),
      ranking: lastStandingRanking(alive, dumped),
    };
  }, [players, seed]);

  const t = useClock();
  useFinishAt(t, sim.duration, () => onFinish(sim.ranking));
  const index = Math.min(Math.floor(t / ROUND), sim.rounds.length - 1);
  const round = sim.rounds[index]!;
  const inRound = t - index * ROUND;
  const revealed = inRound > 3.1;

  return (
    <GameStage
      image={imgHundredDoors}
      title="100 Doors"
      subtitle={`Manche ${index + 1} / ${sim.rounds.length} · une seule porte sauve`}
      minHeight={300}
      aspect="auto"
      shake={revealed && inRound < 3.4}
      status={
        <>
          <Hud tone="live">
            {Object.keys(round.picks).length} devant les portes
          </Hud>
          <Hud tone={revealed ? "danger" : "muted"}>{revealed ? "Ouverture" : "Instinct"}</Hud>
        </>
      }
      caption={
        revealed && round.eliminated.length
          ? `Piège : ${round.eliminated.length} éliminés. La porte ${round.safe + 1} menait plus loin.`
          : "Aucune stratégie possible : juste l'instinct, ou la chance."
      }
    >
      <div className="absolute inset-0 grid grid-cols-5 gap-2 overflow-y-auto p-3 sm:grid-cols-10">
        {Array.from({ length: SHOWN }).map((_, d) => {
          const names = Object.keys(round.picks).filter((n) => round.picks[n] === d);
          const isSafe = revealed && round.safe === d;
          const isTrap = revealed && round.safe !== d;
          return (
            <div
              key={d}
              className="rounded-lg border border-border/70 p-1.5 transition-colors"
              style={{
                background: isSafe
                  ? "oklch(0.633 0.079 115.2 / 30%)"
                  : isTrap
                    ? "oklch(0.577 0.245 27.3 / 24%)"
                    : "oklch(0.164 0.016 210.9 / 55%)",
                boxShadow: isSafe ? "0 0 34px oklch(0.633 0.079 115.2 / 60%)" : undefined,
              }}
            >
              <div className={`text-center text-lg ${isSafe ? "animate-pop" : ""}`}>
                {revealed ? (isSafe ? "✨" : "🚫") : "🚪"}
              </div>
              <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                {names.slice(0, 6).map((n) => (
                  <Runner key={n} name={n} size={16} dead={isTrap} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GameStage>
  );
}
