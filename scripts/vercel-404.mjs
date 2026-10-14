#!/usr/bin/env node
/**
 * scripts/vercel-404.mjs - apres le build, dit a Vercel de servir la page introuvable de la BONNE langue.
 *
 * LE PROBLEME. L'adaptateur Vercel ecrit .vercel/output/config.json avec une seule regle de fin :
 * toute adresse inconnue repond 404 avec /404.html, la page de la langue par defaut. Les pages
 * introuvables des autres langues (fr/404.html, rangee par pagesIntrouvables dans astro.config.mjs)
 * sont bien dans le build, mais Vercel ne les cherche jamais : /fr/une-page-inconnue/ s'affichait
 * en anglais. Un hebergeur qui cherche "le 404.html le plus proche" (Cloudflare) n'a pas ce defaut.
 *
 * LA CORRECTION. Pour chaque dossier de langue qui contient un 404.html, une regle est inseree
 * JUSTE AVANT la regle de fin : /fr et tout ce qui est dessous repond 404 avec /fr/404.html.
 * Elle passe apres les fichiers du site et apres les routes de Keystatic (/keystatic, /api/keystatic) :
 * une page qui existe, ou l'editeur, ne sont jamais interceptes. La liste des langues n'est
 * pas ecrite ici : elle se lit dans le build, donc une langue ajoutee s'y trouve toute seule.
 *
 * Usage : node scripts/vercel-404.mjs   (branche en fin de la commande "build" de package.json)
 * Sans .vercel/output (build sans l'adaptateur Vercel), il ne fait rien. Relance sans danger : une
 * regle deja posee n'est pas dupliquee.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Ajoute les regles des pages introuvables localisees ; rend la liste des regles posees, ou null si rien a faire. */
export function ajouterLes404Localisees(sortie = join(ROOT, ".vercel/output")) {
  const fichier = join(sortie, "config.json");
  const statique = join(sortie, "static");
  if (!existsSync(fichier) || !existsSync(statique)) return null;

  const config = JSON.parse(readFileSync(fichier, "utf8"));
  if (!Array.isArray(config.routes)) return null;

  const langues = readdirSync(statique, { withFileTypes: true })
    .filter((entree) => entree.isDirectory() && existsSync(join(statique, entree.name, "404.html")))
    .map((entree) => entree.name)
    .sort();

  // La regle de fin ("^/.*$" vers /404.html) reste la derniere : les regles de langue se glissent avant elle.
  let rang = config.routes.findIndex((regle) => regle.src === "^/.*$" && regle.dest === "/404.html");
  if (rang === -1) rang = config.routes.length;

  const posees = [];
  for (const langue of langues) {
    const src = `^/${langue}(?:/.*)?$`;
    if (config.routes.some((regle) => regle.src === src)) continue;
    config.routes.splice(rang, 0, { src, dest: `/${langue}/404.html`, status: 404 });
    rang += 1;
    posees.push(langue);
  }

  if (posees.length > 0) writeFileSync(fichier, `${JSON.stringify(config, null, 2)}\n`);
  return posees;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const posees = ajouterLes404Localisees();
  if (posees === null) console.log("vercel-404 : pas de .vercel/output, rien a faire");
  else if (posees.length === 0) console.log("vercel-404 : regles deja en place");
  else console.log(`vercel-404 : page introuvable localisee pour ${posees.join(", ")}`);
}
