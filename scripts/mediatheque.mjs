// scripts/mediatheque.mjs - la mediatheque : un plugin Vite, actif seulement en developpement (`astro dev`), jamais dans le build ni sur Vercel.
//
//   /mediatheque       la galerie (voir mediatheque-page.mjs) : tout voir, televerser, supprimer
//   /api/mediatheque   GET liste · POST televerse · DELETE ?nom=… supprime
//
// Les fichiers vivent dans public/medias/ : ils sont servis tels quels par le site
// (/medias/photo.jpg) et partent sur GitHub avec le reste au prochain `git push`.
// Les grandes photos sont reduites a 2400 px de large (si `sharp`, deja present
// avec Astro, est disponible) ; le reste est enregistre octet pour octet.
//
// A brancher dans astro.config.mjs :
//   import { mediatheque } from "./scripts/mediatheque.mjs";
//   ... vite: { plugins: [mediatheque(), ...] }
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { PAGE } from "./mediatheque-page.mjs";

const DOSSIER = "public/medias";
const URL_PUBLIQUE = "/medias/";
const IMAGES = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const VIDEOS = new Set([".mp4", ".webm", ".mov"]);
const TAILLE_MAX = 100 * 1024 * 1024;
const LARGEUR_MAX = 2400;
/** Les dossiers de contenu ou l'on cherche l'emploi d'un fichier (pour avertir avant une suppression). */
const CONTENUS = ["src/contenu", "src/donnees"];

const typeDe = (nom) => {
  const ext = extname(nom).toLowerCase();
  return IMAGES.has(ext) ? "image" : VIDEOS.has(ext) ? "video" : null;
};

/** Un nom de fichier sur : minuscules, sans accents, sans espaces ni caracteres speciaux. */
export function nettoyerNom(nom) {
  const ext = extname(nom).toLowerCase();
  const base = basename(nom, extname(nom))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return { base: base || "media", ext };
}

async function existe(chemin) {
  try {
    await stat(chemin);
    return true;
  } catch {
    return false;
  }
}

async function nomLibre(dossier, base, ext) {
  let nom = base + ext;
  for (let i = 2; await existe(join(dossier, nom)); i += 1) nom = `${base}-${i}${ext}`;
  return nom;
}

async function fichiersJson(dossier) {
  const sortie = [];
  let entrees = [];
  try {
    entrees = await readdir(dossier, { withFileTypes: true });
  } catch {
    return sortie;
  }
  for (const e of entrees) {
    const chemin = join(dossier, e.name);
    if (e.isDirectory()) sortie.push(...(await fichiersJson(chemin)));
    else if (e.name.endsWith(".json")) sortie.push(chemin);
  }
  return sortie;
}

async function lister(racine) {
  const dossier = resolve(racine, DOSSIER);
  let noms = [];
  try {
    noms = await readdir(dossier);
  } catch {
    return [];
  }
  const contenus = [];
  for (const d of CONTENUS) {
    for (const chemin of await fichiersJson(resolve(racine, d))) {
      contenus.push({ chemin: chemin.slice(racine.length + 1).replaceAll("\\", "/"), texte: await readFile(chemin, "utf-8") });
    }
  }
  const medias = [];
  for (const nom of noms) {
    const type = typeDe(nom);
    if (!type) continue;
    const infos = await stat(join(dossier, nom));
    const url = URL_PUBLIQUE + nom;
    medias.push({
      nom,
      url,
      type,
      taille: infos.size,
      date: infos.mtimeMs,
      utilisations: contenus.filter((c) => c.texte.includes(JSON.stringify(url).slice(1, -1))).map((c) => c.chemin),
    });
  }
  return medias.sort((a, b) => b.date - a.date);
}

let sharpChargé;
async function sharp() {
  if (sharpChargé === undefined) sharpChargé = await import("sharp").then((m) => m.default).catch(() => null);
  return sharpChargé;
}

/** Reduit une photo trop large (ou mal orientee) ; renvoie les octets d'origine si rien n'est a faire. */
async function optimiser(octets, ext) {
  const moteur = await sharp();
  if (!moteur || ext === ".gif") return { octets, optimise: false };
  try {
    const image = moteur(octets, { failOn: "none" });
    const meta = await image.metadata();
    const tropLarge = (meta.width ?? 0) > LARGEUR_MAX;
    const tournee = (meta.orientation ?? 1) > 1;
    if (!tropLarge && !tournee) return { octets, optimise: false };
    let sortie = image.rotate();
    if (tropLarge) sortie = sortie.resize({ width: LARGEUR_MAX, withoutEnlargement: true });
    if (ext === ".png") sortie = sortie.png({ compressionLevel: 9 });
    else if (ext === ".webp") sortie = sortie.webp({ quality: 85 });
    else if (ext === ".avif") sortie = sortie.avif({ quality: 60 });
    else sortie = sortie.jpeg({ quality: 85, mozjpeg: true });
    const resultat = await sortie.toBuffer();
    return resultat.length < octets.length || tournee ? { octets: resultat, optimise: true } : { octets, optimise: false };
  } catch {
    return { octets, optimise: false };
  }
}

const json = (reponse, statut, donnees) => {
  reponse.statusCode = statut;
  reponse.setHeader("Content-Type", "application/json; charset=utf-8");
  reponse.setHeader("Cache-Control", "no-store");
  reponse.end(JSON.stringify(donnees));
};

export function mediatheque() {
  return {
    name: "reef:mediatheque",
    apply: "serve",
    configureServer(serveur) {
      const racine = serveur.config.root;
      const dossier = resolve(racine, DOSSIER);

      serveur.middlewares.use(async (req, res, suite) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const chemin = url.pathname.replace(/\/+$/, "");

        if (chemin === "/mediatheque" && req.method === "GET") {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(PAGE);
          return;
        }
        if (chemin !== "/api/mediatheque") return suite();

        try {
          if (req.method === "GET") return json(res, 200, { medias: await lister(racine) });

          // Les ecritures exigent un en-tete qu'aucun site tiers ne peut envoyer sans autorisation (CORS).
          if (req.headers["x-mediatheque"] !== "1" || req.headers["sec-fetch-site"] === "cross-site") {
            return json(res, 403, { erreur: "Requête refusée." });
          }

          if (req.method === "DELETE") {
            const nom = url.searchParams.get("nom") ?? "";
            if (nom !== basename(nom) || !typeDe(nom)) return json(res, 400, { erreur: "Nom invalide." });
            const cible = join(dossier, nom);
            if (!(await existe(cible))) return json(res, 404, { erreur: "Fichier introuvable." });
            await unlink(cible);
            return json(res, 200, { supprime: nom });
          }

          if (req.method === "POST") {
            if (Number(req.headers["content-length"] ?? 0) > TAILLE_MAX * 3) return json(res, 413, { erreur: "Envoi trop volumineux." });
            const requete = new Request(url, { method: "POST", headers: new Headers(req.headers), body: Readable.toWeb(req), duplex: "half" });
            const donnees = await requete.formData();
            await mkdir(dossier, { recursive: true });
            const ajoutes = [];
            const refuses = [];
            for (const fichier of donnees.getAll("fichiers")) {
              if (typeof fichier === "string") continue;
              const { base, ext } = nettoyerNom(fichier.name);
              if (!typeDe(base + ext)) {
                refuses.push({ nom: fichier.name, raison: "format non accepté" });
                continue;
              }
              if (fichier.size > TAILLE_MAX) {
                refuses.push({ nom: fichier.name, raison: "plus de 100 Mo" });
                continue;
              }
              const brut = Buffer.from(await fichier.arrayBuffer());
              const { octets, optimise } = typeDe(base + ext) === "image" ? await optimiser(brut, ext) : { octets: brut, optimise: false };
              const nom = await nomLibre(dossier, base, ext);
              await writeFile(join(dossier, nom), octets);
              ajoutes.push({ nom, url: URL_PUBLIQUE + nom, type: typeDe(nom), taille: octets.length, optimise });
            }
            return json(res, 200, { ajoutes, refuses });
          }

          return json(res, 405, { erreur: "Méthode non permise." });
        } catch (erreur) {
          return json(res, 500, { erreur: erreur instanceof Error ? erreur.message : "Erreur inconnue." });
        }
      });
    },
  };
}
