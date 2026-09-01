import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { MINI_GAMES, pickRandomGame, type MiniGameEntry } from "@/components/games/registry";
import { PlayerChip } from "@/components/PlayerChip";
import { useTwitchChat } from "@/lib/twitch-chat";
import { GAME_IMAGES } from "@/components/games/images";

export const Route = createFileRoute("/arena")({
  head: () => ({
    meta: [
      { title: "Arène Dexaway — Lancez un giveaway Twitch en direct" },
      {
        name: "description",
        content:
          "Connectez votre chaîne Twitch, laissez vos viewers taper !play et lancez un mini-jeu automatisé pour désigner le gagnant.",
      },
      { property: "og:title", content: "Arène Dexaway" },
      {
        property: "og:description",
        content: "Lobby !play, tirage du mini-jeu et classement automatique en direct.",
      },
    ],
  }),
  component: Arena,
});

type Phase = "setup" | "lobby" | "playing" | "results";

const FAKE = [
  "NoScopeNina", "PixelPapy", "LagMachine", "TotoLeCheat", "MissClickMax", "GgWpGabin",
  "BananaSplitz", "KappaKing", "SaltyShark", "TryHardTom", "RngGoblin", "ClutchClara",
  "OneTapOscar", "SmurfSteph", "AfkAntoine", "PogFrog", "BoumBoum", "LuckyLuz",
];

/** Génère un nombre illimité de viewers de test (pas de plafond). */
function makeTestViewers(offset: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const n = offset + i;
    const base = FAKE[n % FAKE.length]!;
    return n < FAKE.length ? base : `${base}${Math.floor(n / FAKE.length) + 1}`;
  });
}

function Arena() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [channelInput, setChannelInput] = useState("");
  const [channel, setChannel] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [game, setGame] = useState<MiniGameEntry | null>(null);
  const [seed, setSeed] = useState(1);
  const [ranking, setRanking] = useState<string[]>([]);
  const [prize, setPrize] = useState("");

  const collecting = phase === "lobby";

  const onMessage = useCallback(
    (user: string, message: string) => {
      if (!collecting) return;
      if (message.toLowerCase().split(" ")[0] !== "!play") return;
      setParticipants((prev) => (prev.some((p) => p.toLowerCase() === user.toLowerCase()) ? prev : [...prev, user]));
    },
    [collecting],
  );

  const { status } = useTwitchChat({ channel, enabled: phase !== "setup", onMessage });

  const statusLabel = useMemo(
    () =>
      ({
        idle: "Hors ligne",
        connecting: "Connexion au chat…",
        connected: `Connecté à #${channel}`,
        error: "Chat inaccessible",
        closed: "Connexion fermée",
      })[status],
    [status, channel],
  );

  const openLobby = () => {
    const clean = channelInput.trim().replace(/^.*twitch\.tv\//, "").replace(/[^\w]/g, "");
    if (!clean) return;
    setChannel(clean);
    setParticipants([]);
    setRanking([]);
    setPhase("lobby");
  };

  const start = (forced?: MiniGameEntry) => {
    if (participants.length < 2) return;
    setGame(forced ?? pickRandomGame());
    setSeed(Math.floor(Math.random() * 1e9));
    setRanking([]);
    setPhase("playing");
  };

  const finish = useCallback((result: string[]) => {
    setRanking(result);
    setPhase("results");
  }, []);

  const GameComponent = game?.component;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="font-display text-2xl glow-text">
          DEXAWAY
        </Link>
        <div className="flex items-center gap-2">
          <span className="tag">
            <span
              className="size-2 rounded-full"
              style={{
                background:
                  status === "connected"
                    ? "var(--color-primary)"
                    : status === "error"
                      ? "var(--color-destructive)"
                      : "var(--color-muted-foreground)",
              }}
            />
            {statusLabel}
          </span>
          <Link to="/jeux" className="text-sm text-muted-foreground hover:text-foreground">
            Mini-jeux
          </Link>
        </div>
      </header>

      {phase === "setup" && (
        <section className="panel mx-auto mt-16 max-w-xl p-7">
          <h1 className="text-4xl">Nouveau giveaway</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dexaway lit votre chat en anonyme : aucune connexion Twitch requise.
          </p>
          <label className="mt-6 block text-sm font-semibold" htmlFor="channel">
            Chaîne Twitch
          </label>
          <input
            id="channel"
            className="field mt-2"
            placeholder="ex : niddala"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openLobby()}
          />
          <label className="mt-4 block text-sm font-semibold" htmlFor="prize">
            Lot à gagner (optionnel)
          </label>
          <input
            id="prize"
            className="field mt-2"
            placeholder="ex : clé Steam"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
          />
          <button className="btn-hero mt-6 w-full" onClick={openLobby}>
            Ouvrir le lobby
          </button>
        </section>
      )}

      {phase === "lobby" && (
        <section className="mt-10 space-y-5">
          <div className="panel p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl">Lobby ouvert</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vos viewers tapent <span className="font-mono text-primary">!play</span> dans le chat
                  de #{channel}
                  {prize && <> pour gagner : {prize}</>}.
                </p>
              </div>
              <div className="text-right">
                <div className="font-display text-6xl text-primary glow-text">
                  {participants.length}
                </div>
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  participants
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn-hero" disabled={participants.length < 2} onClick={() => start()}>
                Lancer un mini-jeu aléatoire
              </button>
              <button
                className="btn-ghost"
                onClick={() =>
                  setParticipants((prev) => [
                    ...prev,
                    ...makeTestViewers(prev.length, 12).filter((n) => !prev.includes(n)),
                  ])
                }
              >
                Ajouter des viewers de test
              </button>
              <button className="btn-ghost" onClick={() => setPhase("setup")}>
                Changer de chaîne
              </button>
            </div>

            <div className="mt-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Ou choisis le mini-jeu
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {MINI_GAMES.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="group relative overflow-hidden rounded-xl border border-border/70 bg-background/50 text-left transition-transform duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={participants.length < 2}
                    onClick={() => start(g)}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={GAME_IMAGES[g.id]}
                        alt={`Illustration du mini-jeu ${g.name}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
                      <span className="absolute right-2 top-2 rounded-full bg-background/75 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
                        {g.kind}
                      </span>
                    </div>
                    <div className="px-3 pb-3 pt-2">
                      <div className="truncate font-display text-base tracking-wide">{g.name}</div>
                      <div className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {g.durationMin}–{g.durationMax}s
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="text-2xl">Participants</h2>
            {participants.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                En attente des premiers <span className="font-mono">!play</span>…
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {participants.map((p) => (
                  <PlayerChip key={p} name={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {phase === "playing" && game && GameComponent && (
        <section className="mt-10">
          <div className="panel relative mb-4 overflow-hidden p-0">
            <img
              src={GAME_IMAGES[game.id]}
              alt=""
              aria-hidden
              className="h-28 w-full object-cover opacity-40 sm:h-36"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 flex flex-wrap items-center justify-between gap-2 px-5">
              <h1 className="text-3xl sm:text-4xl glow-text">{game.name}</h1>
              <span className="tag">{participants.length} participants</span>
            </div>
          </div>
          <GameComponent players={participants} seed={seed} onFinish={finish} />
        </section>
      )}

      {phase === "results" && (
        <section className="mt-10 space-y-5">
          <div className="panel p-8 text-center">
            <span className="tag">{game?.name}</span>
            <h1 className="mt-4 text-5xl glow-text">🏆 {ranking[0]}</h1>
            <p className="mt-2 text-muted-foreground">
              remporte le giveaway{prize && <> : {prize}</>}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button className="btn-hero" onClick={() => setPhase("lobby")}>
                Nouveau tour
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setParticipants([]);
                  setPhase("lobby");
                }}
              >
                Vider le lobby
              </button>
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="text-2xl">Classement</h2>
            <ol className="mt-4 space-y-2">
              {ranking.map((name, i) => (
                <li
                  key={name}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2"
                >
                  <span className="w-8 font-display text-xl text-primary">#{i + 1}</span>
                  <PlayerChip name={name} dimmed={i > 2} />
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </main>
  );
}
