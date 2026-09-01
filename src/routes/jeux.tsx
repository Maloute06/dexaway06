import { createFileRoute, Link } from "@tanstack/react-router";
import { MINI_GAMES } from "@/components/games/registry";
import { GAME_IMAGES } from "@/components/games/images";

export const Route = createFileRoute("/jeux")({
  head: () => ({
    meta: [
      { title: "Mini-jeux Dexaway — Marble Drop, Big Slide, Survival Circle et plus" },
      {
        name: "description",
        content:
          "Marble Drop, Big Slide, Survival Circle, Train Switch, 100 Doors, Bomb Arena, Tornado, Coin Drop : des giveaways Twitch en 30 à 90 secondes.",
      },
      { property: "og:title", content: "Les mini-jeux de Dexaway" },
      {
        property: "og:description",
        content: "Courses, éliminations et scores : 12 mini-jeux automatisés pour le chat Twitch.",
      },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10">
      <header className="flex items-center justify-between">
        <Link to="/" className="font-display text-2xl glow-text">
          DEXAWAY
        </Link>
        <Link to="/arena" className="btn-ghost">
          Ouvrir l'arène
        </Link>
      </header>

      <h1 className="mt-16 text-5xl sm:text-6xl">Mini-jeux</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Un jeu est tiré au sort à chaque giveaway. Les participants sont spectateurs de leur propre
        destin : mécaniques du jeu, IA et hasard décident du classement.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MINI_GAMES.map((g) => (
          <article
            key={g.id}
            className="panel group overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={GAME_IMAGES[g.id]}
                alt={`Illustration du mini-jeu ${g.name}`}
                loading="lazy"
                width={1024}
                height={576}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-full bg-background/70 px-3 py-1 font-mono text-xs uppercase tracking-widest backdrop-blur">
                {g.kind}
              </span>
            </div>
            <div className="p-5">
              <h2 className="text-2xl">{g.name}</h2>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">{g.tagline}</p>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{g.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="tag">
                  👥 {g.playersMin}+ · illimité
                </span>
                <span className="tag">
                  ⏱ {g.durationMin}–{g.durationMax} s
                </span>
                <span className="tag">{g.kind}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
