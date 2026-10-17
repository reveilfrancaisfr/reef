#!/usr/bin/env node
/**
 * scripts/jumeau-anglais.mjs - cree la version anglaise des articles francais dont la case
 * "Creer aussi la version anglaise" est cochee dans Keystatic.
 *
 * Lance par l'action GitHub .github/workflows/jumeau-anglais.yml a chaque enregistrement d'un
 * article francais, ou a la main : node scripts/jumeau-anglais.mjs
 *
 * Pour chaque article src/data/posts/fr/<nom>.md dont l'en-tete contient creerVersionAnglaise: true :
 *   - si src/data/posts/en/<nom>.md existe deja, il n'est JAMAIS touche ;
 *   - sinon il est cree : meme texte (reste en francais, a traduire), meme en-tete, avec
 *     draft: true, featured: false, l'auteur et le sujet anglais correspondants, et sans la case ;
 *   - dans tous les cas la case francaise est remise a false.
 * Si la creation echoue, la case reste cochee et le script se termine en erreur (l'action devient rouge).
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_FR = join(ROOT, "src/data/posts/fr");
const POSTS_EN = join(ROOT, "src/data/posts/en");
const AUTEURS_EN = join(ROOT, "src/data/authors/en");
const SUJETS_EN = join(ROOT, "src/data/topics/en");

/* Les sujets n'ont pas la meme adresse d'une langue a l'autre : adresse francaise -> adresse anglaise.
 * Un sujet absent de cette table est cherche sous la meme adresse en anglais. A completer quand
 * vous ajoutez un sujet dont l'adresse anglaise est differente. */
const SUJETS = {
  actualite: "actuality",
  documentation: "documentation",
  "la-candidate": "the-candidate",
  "le-parti-politique": "the-political-party",
};

const slugsDe = (dossier) =>
  existsSync(dossier)
    ? readdirSync(dossier)
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/, ""))
        .sort()
    : [];

/** Coupe un fichier Markdown en en-tete et corps ; null si pas d'en-tete. */
function decouper(texte) {
  const m = /^---\n([\s\S]*?)\n---(\n[\s\S]*)?$/.exec(texte);
  return m ? { entete: m[1], corps: m[2] ?? "\n" } : null;
}

/** La valeur d'une cle de l'en-tete, sans guillemets ; null si absente. */
function valeur(entete, cle) {
  const m = new RegExp(`^${cle}:[ \\t]*(.*)$`, "m").exec(entete);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

/** Fixe la valeur d'une cle de l'en-tete (l'ajoute a la fin si elle n'existe pas). */
function poser(entete, cle, nouvelle) {
  const re = new RegExp(`^${cle}:.*$`, "m");
  return re.test(entete) ? entete.replace(re, () => `${cle}: ${nouvelle}`) : `${entete}\n${cle}: ${nouvelle}`;
}

/** Retire une cle de l'en-tete. */
const retirer = (entete, cle) => entete.replace(new RegExp(`^${cle}:.*\\n?`, "m"), "").replace(/\n+$/, "");

/** "fr/mon-auteur" -> "en/mon-auteur" (ou son equivalent de la table) ; sinon le premier disponible, en le disant. */
function versAnglais(valeurFr, dossierEn, table, nom) {
  const slugFr = (valeurFr ?? "").split("/").pop();
  const cible = table?.[slugFr] ?? slugFr;
  const disponibles = slugsDe(dossierEn);
  if (disponibles.includes(cible)) return `en/${cible}`;
  if (disponibles.length === 0) throw new Error(`aucun ${nom} anglais dans ${dossierEn}`);
  console.warn(`  ! ${nom} "${valeurFr}" : pas d'equivalent anglais "${cible}", "${disponibles[0]}" mis a la place (a corriger dans Keystatic).`);
  return `en/${disponibles[0]}`;
}

function copieAnglaise(texte) {
  const parts = decouper(texte);
  if (!parts) throw new Error("en-tete introuvable");
  let entete = retirer(parts.entete, "creerVersionAnglaise");
  entete = poser(entete, "draft", "true");
  entete = poser(entete, "featured", "false");
  if (valeur(entete, "author") !== null) {
    entete = poser(entete, "author", versAnglais(valeur(entete, "author"), AUTEURS_EN, null, "auteur"));
  }
  if (valeur(entete, "topic") !== null) {
    entete = poser(entete, "topic", versAnglais(valeur(entete, "topic"), SUJETS_EN, SUJETS, "sujet"));
  }
  return `---\n${entete}\n---${parts.corps}`;
}

if (!existsSync(POSTS_FR)) {
  console.log("Jumeau anglais : pas de dossier src/data/posts/fr, rien a faire.");
  process.exit(0);
}

let crees = 0;
let echecs = 0;

for (const fichier of readdirSync(POSTS_FR).filter((f) => /\.mdx?$/.test(f))) {
  const chemin = join(POSTS_FR, fichier);
  const texte = readFileSync(chemin, "utf8").replace(/\r\n/g, "\n");
  const parts = decouper(texte);
  if (!parts || valeur(parts.entete, "creerVersionAnglaise") !== "true") continue;

  const cheminEn = join(POSTS_EN, fichier);
  try {
    if (existsSync(cheminEn)) {
      console.log(`${fichier} : la version anglaise existe deja, elle n'est pas touchee.`);
    } else {
      const contenu = copieAnglaise(texte);
      mkdirSync(POSTS_EN, { recursive: true });
      writeFileSync(cheminEn, contenu);
      crees += 1;
      console.log(`${fichier} : version anglaise creee (brouillon, a traduire).`);
    }
    // La case se decoche : la copie est faite, ou existait deja.
    writeFileSync(chemin, `---\n${poser(parts.entete, "creerVersionAnglaise", "false")}\n---${parts.corps}`);
  } catch (erreur) {
    echecs += 1;
    console.error(`${fichier} : echec (${erreur.message}). La case reste cochee.`);
  }
}

console.log(crees === 0 && echecs === 0 ? "Jumeau anglais : aucune case cochee." : `Jumeau anglais : ${crees} creee(s), ${echecs} echec(s).`);
if (echecs > 0) process.exitCode = 1;
