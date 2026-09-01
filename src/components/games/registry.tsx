import type { ComponentType } from "react";
import type { MiniGameMeta, MiniGameProps } from "@/lib/game-utils";
import { PlinkoGame } from "./PlinkoGame";
import { RaceGame } from "./RaceGame";
import { ChestGame } from "./ChestGame";
import { ExplosionGame } from "./ExplosionGame";
import { MarbleDropGame } from "./MarbleDropGame";
import { BigSlideGame } from "./BigSlideGame";
import { SurvivalCircleGame } from "./SurvivalCircleGame";
import { TrainSwitchGame } from "./TrainSwitchGame";
import { HundredDoorsGame } from "./HundredDoorsGame";
import { BombArenaGame } from "./BombArenaGame";
import { TornadoGame } from "./TornadoGame";
import { CoinDropGame } from "./CoinDropGame";

export interface MiniGameEntry extends MiniGameMeta {
  component: ComponentType<MiniGameProps>;
}

export const MINI_GAMES: MiniGameEntry[] = [
  {
    id: "marble-drop",
    name: "Marble Drop",
    tagline: "La descente infernale",
    description:
      "Un parcours en spirale truffé de pièges et d'accélérateurs, où des billes dévalent en cascade. Certaines filent droit vers la sortie, d'autres sont éjectées à la dernière courbe.",
    emoji: "🌀",
    kind: "Course",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 45,
    durationMax: 75,
    component: MarbleDropGame,
  },
  {
    id: "big-slide",
    name: "Big Slide",
    tagline: "Tout le monde glisse, un seul arrive premier",
    description:
      "Un toboggan géant où des centaines de participants dévalent en même temps dans un joyeux bordel de bousculades. Le premier en bas rafle la mise.",
    emoji: "🛝",
    kind: "Course",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 30,
    durationMax: 60,
    component: BigSlideGame,
  },
  {
    id: "survival-circle",
    name: "Survival Circle",
    tagline: "L'arène rétrécit. La tension monte.",
    description:
      "Des événements aléatoires balaient le terrain pendant que le cercle de jeu se referme peu à peu. Il faut tenir — jusqu'à ce qu'il n'en reste plus qu'un.",
    emoji: "⭕",
    kind: "Élimination",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 60,
    durationMax: 90,
    component: SurvivalCircleGame,
  },
  {
    id: "train-switch",
    name: "Train Switch",
    tagline: "Les rails changent. Ton destin aussi.",
    description:
      "Des trains filent sur des voies dont les aiguillages basculent sans prévenir. Un mauvais changement de rail et c'est terminé — un bon, et tu files vers la victoire.",
    emoji: "🚂",
    kind: "Course",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 45,
    durationMax: 60,
    component: TrainSwitchGame,
  },
  {
    id: "100-doors",
    name: "100 Doors",
    tagline: "Une porte sur cent te mènera à la victoire",
    description:
      "Chaque joueur choisit une porte au hasard. Certaines mènent plus loin, d'autres sont un piège pur et simple. Aucune stratégie possible : juste l'instinct, ou la chance.",
    emoji: "🚪",
    kind: "Élimination",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 45,
    durationMax: 75,
    component: HundredDoorsGame,
  },
  {
    id: "bomb-arena",
    name: "Bomb Arena",
    tagline: "Le sol explose. Toi, tu cours.",
    description:
      "Des bombes se déclenchent en rafale sur toute l'arène. Il faut lire le terrain, anticiper les détonations et rester en mouvement — le dernier survivant gagne.",
    emoji: "💣",
    kind: "Élimination",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 45,
    durationMax: 75,
    component: BombArenaGame,
  },
  {
    id: "tornado",
    name: "Tornado",
    tagline: "Elle se déplace. Ne te fais pas aspirer.",
    description:
      "Une tornade traverse l'arène de façon imprévisible, aspirant tout participant sur son passage. La seule règle : ne jamais rester immobile trop longtemps.",
    emoji: "🌪️",
    kind: "Élimination",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 30,
    durationMax: 60,
    component: TornadoGame,
  },
  {
    id: "coin-drop",
    name: "Coin Drop",
    tagline: "La machine à sous géante",
    description:
      "Des centaines de pièces tombent dans une machine à cliquets, se bousculent, s'entassent — les meilleurs gains atterrissent tout en bas. Simple, addictif, parfait pour finir en beauté.",
    emoji: "🪙",
    kind: "Score",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 30,
    durationMax: 60,
    component: CoinDropGame,
  },
  {
    id: "plinko",
    name: "Plinko",
    tagline: "Chute libre, multiplicateurs",
    description:
      "Chaque viewer devient une bille lâchée sur le plateau. Rebonds aléatoires, multiplicateurs de x1.5 à x12 : le plus gros score remporte le giveaway.",
    emoji: "🎯",
    kind: "Score",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 30,
    durationMax: 60,
    component: PlinkoGame,
  },
  {
    id: "course",
    name: "Course folle",
    tagline: "Sprint automatique",
    description:
      "Tous les participants s'alignent sur la piste. L'IA gère accélérations et coups de mou jusqu'au photo-finish.",
    emoji: "🏁",
    kind: "Course",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 30,
    durationMax: 60,
    component: RaceGame,
  },
  {
    id: "coffre",
    name: "Coffre mystère",
    tagline: "Élimination par manches",
    description:
      "À chaque manche, les survivants choisissent un coffre. L'un est piégé : ceux qui l'ouvrent sortent du giveaway.",
    emoji: "🎁",
    kind: "Élimination",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 45,
    durationMax: 75,
    component: ChestGame,
  },
  {
    id: "explosion",
    name: "Mode explosion",
    tagline: "Battle royale à la bombe",
    description:
      "La mèche brûle et la bombe désigne ses victimes une par une. Le dernier survivant gagne.",
    emoji: "💥",
    kind: "Élimination",
    playersMin: 10,
    playersMax: 1000,
    durationMin: 45,
    durationMax: 75,
    component: ExplosionGame,
  },
];

export function pickRandomGame(rand = Math.random()) {
  return MINI_GAMES[Math.floor(rand * MINI_GAMES.length) % MINI_GAMES.length]!;
}
