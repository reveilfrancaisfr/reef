#!/usr/bin/env node
/**
 * scripts/jumeau-anglais.mjs - cree la version anglaise TRADUITE des articles francais dont la case
 * "Creer aussi la version anglaise" est cochee dans Keystatic.
 *
 * Lance par l'action GitHub .github/workflows/jumeau-anglais.yml a chaque enregistrement d'un
 * article francais, ou a la main : DEEPL_API_KEY=... node scripts/jumeau-anglais.mjs
 *
 * Pour chaque article src/data/posts/fr/<nom>.md dont l'en-tete contient creerVersionAnglaise: true :
 *   - si src/data/posts/en/<nom>.md existe deja, il n'est JAMAIS touche ;
 *   - sinon le titre, le resume, la description de l'image, les etiquettes et le texte sont traduits
 *     par DeepL (plan API Free : 500 000 caracteres par mois, gratuit), et l'article anglais est ecrit
 *     avec draft: true (a relire), featured: false, l'auteur et le sujet anglais correspondants,
 *     et sans la case ;
 *   - dans tous les cas ou la creation reussit (ou ou la version existait), la case francaise est
 *     remise a false.
 * Si la traduction echoue, rien n'est cree, la case reste cochee et le script se termine en erreur
 * (l'action devient rouge). Jamais de francais recopie dans l'article anglais.
 *
 * Ce qui n'est pas traduit : les adresses (liens, images), le code, les balises HTML et Markdoc,
 * les blocs de code. Les liens gardent leur adresse, leur texte est traduit.
 *
 * Variables d'environnement :
 *   DEEPL_API_KEY   obligatoire pour traduire (secret GitHub) ; une cle gratuite se termine par :fx
 *   OUTILS_NODE     facultatif, dossier ou l'action a installe le paquet "yaml"
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_FR = join(ROOT, "src/data/posts/fr");
const POSTS_EN = join(ROOT, "src/data/posts/en");
const AUTEURS_EN = join(ROOT, "src/data/authors/en");
const SUJETS_EN = join(ROOT, "src/data/topics/en");

const CLE = process.env.DEEPL_API_KEY?.trim();
const POINT = CLE?.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";

/* Les sujets n'ont pas la meme adresse d'une langue a l'autre : adresse francaise -> adresse anglaise.
 * Un sujet absent de cette table est cherche sous la meme adresse en anglais. A completer quand
 * vous ajoutez un sujet dont l'adresse anglaise est differente. */
const SUJETS = {
  actualite: "actuality",
  documentation: "documentation",
  "la-candidate": "the-candidate",
  "le-parti-politique": "the-political-party",
};

/* ------------------------------------------------------------------ */
/* Petits outils sur l'en-tete (texte brut, pour la case francaise)    */
/* ------------------------------------------------------------------ */

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

/** La valeur d'une cle simple de l'en-tete, sans guillemets ; null si absente. */
function valeur(entete, cle) {
  const m = new RegExp(`^${cle}:[ \\t]*(.*)$`, "m").exec(entete);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

/** Fixe la valeur d'une cle simple de l'en-tete (l'ajoute a la fin si elle n'existe pas). */
function poser(entete, cle, nouvelle) {
  const re = new RegExp(`^${cle}:.*$`, "m");
  return re.test(entete) ? entete.replace(re, () => `${cle}: ${nouvelle}`) : `${entete}\n${cle}: ${nouvelle}`;
}

/* ------------------------------------------------------------------ */
/* YAML (pour l'en-tete de l'article anglais)                          */
/* ------------------------------------------------------------------ */

async function chargerYaml() {
  try {
    const m = await import("yaml");
    return m.default ?? m;
  } catch {
    // pas installe a la racine : l'action l'installe dans OUTILS_NODE
  }
  const dossier = process.env.OUTILS_NODE;
  if (dossier) {
    const m = await import(pathToFileURL(join(dossier, "node_modules/yaml/dist/index.js")).href);
    return m.default ?? m;
  }
  throw new Error('le paquet "yaml" est introuvable (npm install yaml, ou variable OUTILS_NODE)');
}

/* ------------------------------------------------------------------ */
/* Auteur et sujet anglais                                             */
/* ------------------------------------------------------------------ */

/** "fr/mon-auteur" -> "en/mon-auteur" (ou son equivalent de la table) ; sinon le premier disponible, en le disant. */
function versAnglais(valeurFr, dossierEn, table, nom) {
  const slugFr = String(valeurFr ?? "").split("/").pop();
  const cible = table?.[slugFr] ?? slugFr;
  const disponibles = slugsDe(dossierEn);
  if (disponibles.includes(cible)) return `en/${cible}`;
  if (disponibles.length === 0) throw new Error(`aucun ${nom} anglais dans ${dossierEn}`);
  console.warn(`  ! ${nom} "${valeurFr}" : pas d'equivalent anglais "${cible}", "${disponibles[0]}" mis a la place (a corriger dans Keystatic).`);
  return `en/${disponibles[0]}`;
}

/* ------------------------------------------------------------------ */
/* Protection du Markdown pendant la traduction                        */
/* ------------------------------------------------------------------ */

const echapper = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const desechapper = (t) =>
  t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, "&");

/**
 * Met a l'abri ce qui ne doit pas etre traduit (code en ligne, adresses des liens, balises HTML,
 * adresses nues) en le remplacant par <x n="i"/>, que DeepL laisse en place.
 */
function proteger(texte) {
  const gardes = [];
  const garder = (s) => {
    gardes.push(s);
    return `\u0001${gardes.length - 1}\u0002`;
  };
  const sansFin = (m) => {
    const fin = /[.,;:!?]+$/.exec(m)?.[0] ?? "";
    return garder(m.slice(0, m.length - fin.length)) + fin;
  };
  const t = texte
    .replace(/`[^`\n]*`/g, garder)
    .replace(/\]\([^)\n]*\)/g, (m) => `]${garder(m.slice(1))}`)
    .replace(/<[^>\n]+>/g, garder)
    .replace(/https?:\/\/[^\s<>\u0001)]+/g, sansFin);
  return { t: echapper(t).replace(/\u0001(\d+)\u0002/g, '<x n="$1"/>'), gardes };
}

/** Remet en place ce que proteger() avait mis a l'abri ; leve une erreur si DeepL en a perdu. */
function restaurer(traduit, gardes) {
  const t = traduit.replace(/<x n="(\d+)"\s*(?:\/>|>\s*<\/x>)/g, (_, i) => `\u0001${i}\u0002`);
  for (let i = 0; i < gardes.length; i += 1) {
    if (!t.includes(`\u0001${i}\u0002`)) throw new Error("DeepL a supprime un lien ou une balise, traduction abandonnee");
  }
  return desechapper(t)
    .replace(/\u0001(\d+)\u0002/g, (_, i) => gardes[Number(i)] ?? "")
    .replace(/\n+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Traduction (DeepL)                                                  */
/* ------------------------------------------------------------------ */

async function appelerDeepL(textes) {
  for (let essai = 1; essai <= 3; essai += 1) {
    const reponse = await fetch(POINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `DeepL-Auth-Key ${CLE}` },
      body: JSON.stringify({
        text: textes,
        source_lang: "FR",
        target_lang: "EN-GB",
        tag_handling: "xml",
        ignore_tags: ["x"],
        non_splitting_tags: ["x"],
        preserve_formatting: true,
      }),
    });
    if ((reponse.status === 429 || reponse.status === 503) && essai < 3) {
      await new Promise((r) => setTimeout(r, 2000 * essai));
      continue;
    }
    if (!reponse.ok) {
      const connus = { 403: "cle refusee (DEEPL_API_KEY incorrecte)", 456: "quota gratuit du mois epuise", 429: "trop de requetes" };
      throw new Error(`DeepL ${reponse.status} : ${connus[reponse.status] ?? (await reponse.text().catch(() => ""))}`);
    }
    const json = await reponse.json();
    if (!Array.isArray(json.translations) || json.translations.length !== textes.length) {
      throw new Error("reponse DeepL inattendue");
    }
    return json.translations.map((t) => t.text);
  }
  throw new Error("DeepL ne repond pas");
}

/** Traduit une liste de textes proteges, par lots, dans l'ordre. */
async function traduireTous(entrees) {
  if (!CLE) throw new Error("DEEPL_API_KEY n'est pas definie (secret GitHub a creer)");
  const sorties = [];
  let i = 0;
  while (i < entrees.length) {
    const lot = [];
    let taille = 0;
    while (i < entrees.length && lot.length < 40 && (lot.length === 0 || taille + entrees[i].t.length < 40000)) {
      lot.push(entrees[i].t);
      taille += entrees[i].t.length;
      i += 1;
    }
    sorties.push(...(await appelerDeepL(lot)));
  }
  return sorties;
}

/**
 * Decoupe le texte de l'article en morceaux {fixe} (laisses tels quels : marques de titre, de liste,
 * lignes vides, blocs de code, balises Markdoc, separateurs de tableau) et {trad} (a traduire).
 */
function planifier(corps) {
  const plan = [];
  let dansCode = false;
  for (const ligne of corps.split("\n")) {
    if (/^\s*(```|~~~)/.test(ligne)) {
      dansCode = !dansCode;
      plan.push([{ fixe: ligne }]);
      continue;
    }
    if (
      dansCode ||
      ligne.trim() === "" ||
      /^\s*(\{%|<!--)/.test(ligne) ||
      /^\s*([-*_])(\s*\1){2,}\s*$/.test(ligne) ||
      /^\s*\[[^\]]+\]:\s/.test(ligne)
    ) {
      plan.push([{ fixe: ligne }]);
      continue;
    }
    if (/^\s*\|/.test(ligne)) {
      const morceaux = [];
      ligne.split("|").forEach((cellule, i) => {
        if (i > 0) morceaux.push({ fixe: "|" });
        if (cellule.trim() === "" || /^\s*:?-+:?\s*$/.test(cellule)) {
          morceaux.push({ fixe: cellule });
        } else {
          const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(cellule);
          morceaux.push({ fixe: m[1] }, { trad: m[2] }, { fixe: m[3] });
        }
      });
      plan.push(morceaux);
      continue;
    }
    const m = /^((?:\s*(?:>|#{1,6}\s|[-*+]\s|\d+[.)]\s))*\s*)([\s\S]*?)(\s*)$/.exec(ligne);
    plan.push(m[2] === "" ? [{ fixe: ligne }] : [{ fixe: m[1] }, { trad: m[2] }, { fixe: m[3] }]);
  }
  return plan;
}

/** Fabrique le contenu complet du fichier anglais. */
async function articleAnglais(texte, YAML) {
  const parts = decouper(texte);
  if (!parts) throw new Error("en-tete introuvable");
  const donnees = YAML.parse(parts.entete) ?? {};

  const entrees = [];
  const ajouter = (brut) => {
    entrees.push(proteger(String(brut)));
    return entrees.length - 1;
  };

  const iTitre = ajouter(donnees.title ?? "");
  const iDescription = ajouter(donnees.description ?? "");
  const iImage = donnees.coverAlt ? ajouter(donnees.coverAlt) : null;
  const iEtiquettes = Array.isArray(donnees.tags) ? donnees.tags.map((t) => ajouter(t)) : [];
  const plan = planifier(parts.corps.trim());
  for (const ligne of plan) for (const morceau of ligne) if ("trad" in morceau) morceau.i = ajouter(morceau.trad);

  const sorties = await traduireTous(entrees);
  const res = entrees.map((e, i) => restaurer(sorties[i], e.gardes));

  donnees.title = res[iTitre];
  donnees.description = res[iDescription];
  if (iImage !== null) donnees.coverAlt = res[iImage];
  if (iEtiquettes.length > 0) donnees.tags = iEtiquettes.map((i) => res[i]);
  donnees.draft = true;
  donnees.featured = false;
  delete donnees.creerVersionAnglaise;
  if (donnees.author) donnees.author = versAnglais(donnees.author, AUTEURS_EN, null, "auteur");
  if (donnees.topic) donnees.topic = versAnglais(donnees.topic, SUJETS_EN, SUJETS, "sujet");

  const corps = plan.map((ligne) => ligne.map((m) => ("trad" in m ? res[m.i] : m.fixe)).join("")).join("\n");
  return `---\n${YAML.stringify(donnees, { lineWidth: 0 })}---\n\n${corps}\n`;
}

/* ------------------------------------------------------------------ */
/* Programme                                                           */
/* ------------------------------------------------------------------ */

if (!existsSync(POSTS_FR)) {
  console.log("Jumeau anglais : pas de dossier src/data/posts/fr, rien a faire.");
  process.exit(0);
}

// Les articles dont la case est cochee.
const aFaire = [];
for (const fichier of readdirSync(POSTS_FR).filter((f) => /\.mdx?$/.test(f))) {
  const texte = readFileSync(join(POSTS_FR, fichier), "utf8").replace(/\r\n/g, "\n");
  const parts = decouper(texte);
  if (parts && valeur(parts.entete, "creerVersionAnglaise") === "true") aFaire.push({ fichier, texte, parts });
}

if (aFaire.length === 0) {
  console.log("Jumeau anglais : aucune case cochee.");
  process.exit(0);
}

let crees = 0;
let echecs = 0;
let YAML = null;

for (const { fichier, texte, parts } of aFaire) {
  const cheminEn = join(POSTS_EN, fichier);
  try {
    if (existsSync(cheminEn)) {
      console.log(`${fichier} : la version anglaise existe deja, elle n'est pas touchee.`);
    } else {
      YAML ??= await chargerYaml();
      const contenu = await articleAnglais(texte, YAML);
      mkdirSync(POSTS_EN, { recursive: true });
      writeFileSync(cheminEn, contenu);
      crees += 1;
      console.log(`${fichier} : version anglaise traduite et creee (brouillon, a relire).`);
    }
    // La case se decoche : la version est creee, ou existait deja.
    writeFileSync(join(POSTS_FR, fichier), `---\n${poser(parts.entete, "creerVersionAnglaise", "false")}\n---${parts.corps}`);
  } catch (erreur) {
    echecs += 1;
    console.error(`${fichier} : echec (${erreur.message}). Rien n'est cree, la case reste cochee.`);
  }
}

console.log(`Jumeau anglais : ${crees} creee(s), ${echecs} echec(s).`);
if (echecs > 0) process.exitCode = 1;
