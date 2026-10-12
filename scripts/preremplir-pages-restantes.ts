// scripts/preremplir-pages-restantes.ts - ecrit dans src/donnees/ les fichiers des pages Sujets, Auteurs, Recherche et Page introuvable, remplis avec les textes ACTUELS du theme.
//
//   npx tsx scripts/preremplir-pages-restantes.ts            cree les fichiers absents et COMPLETE les existants :
//                                                            seuls les champs qui manquent sont ajoutes, jamais une
//                                                            valeur deja saisie (ni modifiee, ni effacee)
//   npx tsx scripts/preremplir-pages-restantes.ts --force    ecrase tout (perd vos modifications)
//
// Sans lui, chaque formulaire demarre vide. Avec lui, chaque champ affiche deja le texte en
// place, et l'on n'a plus qu'a le changer. Les textes viennent des dictionnaires du theme
// (src/i18n/ui/), lus tels quels.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { en } from "../src/i18n/ui/en/index.ts";
import { fr } from "../src/i18n/ui/fr/index.ts";

const force = process.argv.includes("--force");
const dossier = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src", "donnees");

const dictionnaires = { fr, en } as const;
type Langue = keyof typeof dictionnaires;

const EN_TETE = ["metaTitle", "metaDescription", "crumb", "eyebrow", "title", "accent", "lede"];

/** Les champs de chaque formulaire : les memes que ceux de src/keystatic/pages-restantes.ts. */
const CHAMPS: Record<string, string[]> = {
  // Les trois derniers : les textes de la carte d'un sujet (TopicCard.astro).
  sujets: [...EN_TETE, "countLabel", "countOne", "readTopic"],
  // Les trois derniers : les textes de la carte d'un auteur (AuthorCard.astro).
  auteurs: [...EN_TETE, "countLabel", "countOne", "linksLabel"],
  recherche: [
    ...EN_TETE,
    "placeholder",
    "label",
    "shortcut",
    "clear",
    "prompt",
    "resultsLabel",
    "countLabel",
    "countOne",
    "inTopic",
    "noResultsTitle",
    "noResultsLede",
    "noResultsCta",
  ],
  introuvable: ["metaTitle", "metaDescription", "code", "title", "accent", "lede", "homeCta", "postsCta", "searchCta"],
};

const fichiers: { nom: string; contenu: Record<string, unknown> }[] = [];
for (const langue of Object.keys(dictionnaires) as Langue[]) {
  const d = dictionnaires[langue];
  const tranches: Record<string, object> = { sujets: d.topics, auteurs: d.authors, recherche: d.search, introuvable: d.notFound };
  for (const [page, champs] of Object.entries(CHAMPS)) {
    const tranche = tranches[page] as Record<string, unknown>;
    const contenu: Record<string, unknown> = {};
    for (const champ of champs) if (tranche[champ] !== undefined) contenu[champ] = tranche[champ];
    fichiers.push({ nom: `${page}-${langue}`, contenu });
  }
}

mkdirSync(dossier, { recursive: true });

for (const { nom, contenu } of fichiers) {
  const chemin = resolve(dossier, `${nom}.json`);
  const existait = existsSync(chemin);
  if (!existait || force) {
    writeFileSync(chemin, `${JSON.stringify(contenu, null, 2)}\n`);
    console.log(`${existait ? "ecrase" : "cree"}   ${nom}.json`);
    continue;
  }
  // Fichier existant : on n'ajoute que les champs absents, jamais on ne touche a une valeur saisie.
  let existant: Record<string, unknown> = {};
  try {
    existant = JSON.parse(readFileSync(chemin, "utf8")) as Record<string, unknown>;
  } catch {
    console.log(`illisible, laisse tel quel   ${nom}.json`);
    continue;
  }
  const manquants = Object.keys(contenu).filter((cle) => !(cle in existant));
  if (manquants.length === 0) {
    console.log(`complet   ${nom}.json`);
    continue;
  }
  for (const cle of manquants) existant[cle] = contenu[cle];
  writeFileSync(chemin, `${JSON.stringify(existant, null, 2)}\n`);
  console.log(`complete (${manquants.join(", ")})   ${nom}.json`);
}
