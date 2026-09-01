import { createFileRoute, Link } from "@tanstack/react-router";
import { MINI_GAMES } from "@/components/games/registry";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dexaway — Vos giveaways Twitch deviennent des mini-jeux" },
      {
        name: "description",
        content:
          "Dexaway automatise vos giveaways Twitch : vos viewers tapent !play, un mini-jeu est tiré au sort et le gagnant est désigné à l'écran.",
      },
      { property: "og:title", content: "Dexaway — Giveaways Twitch en mini-jeux automatisés" },
      {
        property: "og:description",
        content:
          "Marble Drop, Big Slide, Survival Circle, Train Switch et plus : des giveaways spectaculaires pilotés par le chat.",
      },
    ],
  }),
  component: Landing,
});

const STEPS = [
  { n: "01", t: "Connectez votre chaîne", d: "Entrez votre nom de chaîne Twitch. Dexaway écoute le chat en lecture seule, sans token." },
  { n: "02", t: "Les viewers tapent !play", d: "Chaque spectateur rejoint le lobby en une commande. Un pseudo = une place." },
  { n: "03", t: "Un mini-jeu est tiré", d: "La plateforme sélectionne aléatoirement un jeu et lance la partie automatiquement." },
  { n: "04", t: "Le gagnant est désigné", d: "30 à 90 secondes de spectacle, puis classement complet et gagnant affiché." },
];

function Landing() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10">
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl glow-text">DEXAWAY</span>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/jeux" className="text-muted-foreground hover:text-foreground">
            Mini-jeux
          </Link>
          <Link to="/arena" className="btn-ghost">
            Lancer un giveaway
          </Link>
        </nav>
      </header>

      <section className="mt-20 max-w-3xl">
        <span className="tag">Giveaways Twitch automatisés</span>
        <h1 className="mt-5 text-5xl leading-[0.95] sm:text-7xl glow-text">
          Vos giveaways ne se tirent plus.
          <br />
          Ils se jouent.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Dexaway transforme chaque giveaway en mini-jeu live. Les viewers tapent{" "}
          <span className="font-mono text-primary">!play</span>, s'affichent à l'écran et
          s'affrontent tout seuls pendant 30 à 90 secondes. Personne ne contrôle son personnage :
          tout dépend du jeu, de l'IA et du hasard.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/arena" className="btn-hero">
            Ouvrir l'arène
          </Link>
          <Link to="/jeux" className="btn-ghost">
            Voir les mini-jeux
          </Link>
        </div>
      </section>

      <section className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <article key={s.n} className="panel p-5">
            <span className="font-mono text-xs text-primary">{s.n}</span>
            <h2 className="mt-2 text-2xl">{s.t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </article>
        ))}
      </section>

      <section className="mt-24">
        <h2 className="text-4xl">Les mini-jeux</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MINI_GAMES.map((g) => (
            <article key={g.id} className="panel flex gap-4 p-5">
              <img
                src={GAME_IMAGES[g.id]}
                alt={`Logo du mini-jeu ${g.name}`}
                loading="lazy"
                width={128}
                height={128}
                className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover shadow-lg"
              />
              <div>
                <h3 className="text-2xl">{g.name}</h3>
                <p className="font-mono text-xs uppercase tracking-widest text-primary">
                  {g.tagline}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="tag">
                    👥 {g.playersMin}–{g.playersMax}
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
      </section>

      <section className="panel mt-24 p-8 text-center">
        <h2 className="text-4xl">Prêt à faire crier votre chat ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Aucune installation, aucun bot à configurer : ouvrez l'arène, collez votre chaîne, et
          lancez la partie.
        </p>
        <Link to="/arena" className="btn-hero mt-6">
          Lancer un giveaway
        </Link>
      </section>

      <section className="mt-24">
        <h2 className="text-4xl">Comment essayer Dexaway</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="panel p-5">
            <span className="font-mono text-xs text-primary">01</span>
            <h3 className="mt-2 text-2xl">Ouvrez l'arène</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cliquez sur <em>Ouvrir l'arène</em> ou allez sur /arena. Aucun compte n'est requis.
            </p>
          </article>
          <article className="panel p-5">
            <span className="font-mono text-xs text-primary">02</span>
            <h3 className="mt-2 text-2xl">Collez votre chaîne</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Entrez votre nom de chaîne Twitch. Dexaway se connecte en lecture seule, sans token.
            </p>
          </article>
          <article className="panel p-5">
            <span className="font-mono text-xs text-primary">03</span>
            <h3 className="mt-2 text-2xl">Ajoutez des joueurs</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Vos viewers tapent <span className="font-mono text-primary">!play</span> dans le chat,
              ou utilisez le bouton <em>+ Viewers de test</em> pour essayer hors live.
            </p>
          </article>
          <article className="panel p-5">
            <span className="font-mono text-xs text-primary">04</span>
            <h3 className="mt-2 text-2xl">Lancez la partie</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Choisissez un lot, cliquez sur <em>Lancer le giveaway</em>, et laissez le spectacle se
              dérouler.
            </p>
          </article>
        </div>
      </section>

      <footer className="mt-16 text-center font-mono text-xs text-muted-foreground">
        ©2026 By Dex - Niddala
      </footer>
    </main>
  );
}
