// src/moteur/identite-keystatic.ts - lit le formulaire Keystatic "Identité du site" (nom, logos, description, image de partage, e-mail, compte X, éditeur, adresses d'envoi des formulaires) de façon SYNCHRONE.
//
// Pourquoi synchrone : identiteDuSite() (src/moteur/theme.ts) est appelée sans await par une
// dizaine de composants. createReader de Keystatic est asynchrone, il ne peut donc pas servir ici :
// on lit directement le fichier JSON que Keystatic écrit (src/donnees/identite-site.json), et les
// dimensions des logos dans l'en-tête de leur fichier image (public/medias/...).
//
// Rien n'est jamais bloquant : fichier absent, JSON illisible, image introuvable, on rend null
// et le site garde le nom et la vague du thème.
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

/** Un logo prêt à poser dans un <img> : même forme que MediaDesReglages (src/moteur/cadre.ts). */
export interface LogoSaisi {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

/** Un texte saisi dans chaque langue du site ; une langue laissée vide vaut null. */
export interface PaireDeLangues {
  fr: string | null;
  en: string | null;
}

/** Ce que le formulaire "Identité du site" apporte ; chaque champ vide vaut null et laisse le thème tranquille. */
export interface IdentiteSaisie {
  nom: string | null;
  logo: LogoSaisi | null;
  logoSombre: LogoSaisi | null;
  description: PaireDeLangues;
  /** L'adresse de l'image de partage choisie ("/medias/photo.jpg"), ou null : la photo du thème. */
  imagePartage: string | null;
  /** Le texte alternatif de l'image de partage, par langue. */
  texteImage: PaireDeLangues;
  email: string | null;
  /** Le compte X tel que saisi ("monsite", "@monsite" ou son adresse). */
  compteX: string | null;
  /** Le nom de l'éditeur (le crédit du pied de page). */
  editeur: string | null;
  /** L'adresse du service qui reçoit les messages du formulaire de contact (https), ou null : le formulaire n'envoie rien. */
  envoiContact: string | null;
  /** L'adresse du service qui reçoit les inscriptions à la lettre d'information (https), ou null. */
  envoiNewsletter: string | null;
}

/** Le texte d'une langue, sinon celui de l'autre ; null si les deux sont vides. */
export function dansLaLangue(paire: PaireDeLangues, locale: "en" | "fr"): string | null {
  return paire[locale] ?? paire[locale === "fr" ? "en" : "fr"];
}

const FICHIER = "src/donnees/identite-site.json";
const DOSSIER_PUBLIC = "public";

// --- Dimensions d'une image, lues dans son en-tête ---------------------------------------

type Taille = { width: number; height: number };

function taillePng(b: Buffer): Taille | null {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function tailleGif(b: Buffer): Taille | null {
  if (b.length < 10 || b.toString("ascii", 0, 3) !== "GIF") return null;
  return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
}

function tailleJpeg(b: Buffer): Taille | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marqueur = b[i + 1];
    if (marqueur === 0xff) {
      i += 1; // octet de remplissage
      continue;
    }
    // Marqueurs sans longueur : SOI, TEM, RSTn.
    if (marqueur === 0xd8 || marqueur === 0x01 || (marqueur >= 0xd0 && marqueur <= 0xd7)) {
      i += 2;
      continue;
    }
    // Les marqueurs SOFn portent la taille (hors DHT 0xC4, JPG 0xC8, DAC 0xCC).
    if (marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc) {
      return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

function tailleWebp(b: Buffer): Taille | null {
  if (b.length < 30 || b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
  const type = b.toString("ascii", 12, 16);
  if (type === "VP8 ") {
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (type === "VP8L") {
    const [b0, b1, b2, b3] = [b[21], b[22], b[23], b[24]];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  if (type === "VP8X") {
    return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  }
  return null;
}

function tailleSvg(b: Buffer): Taille | null {
  const texte = b.toString("utf8", 0, Math.min(b.length, 4096));
  const balise = texte.match(/<svg\b[^>]*>/i)?.[0];
  if (!balise) return null;
  const nombre = (nom: string): number | null => {
    const m = balise.match(new RegExp(`\\s${nom}\\s*=\\s*["']\\s*([0-9.]+)\\s*(?:px)?\\s*["']`, "i"));
    return m ? Number.parseFloat(m[1]) : null;
  };
  const largeur = nombre("width");
  const hauteur = nombre("height");
  if (largeur && hauteur) return { width: Math.round(largeur), height: Math.round(hauteur) };
  const vue = balise.match(/viewBox\s*=\s*["']\s*[-0-9.]+[\s,]+[-0-9.]+[\s,]+([0-9.]+)[\s,]+([0-9.]+)\s*["']/i);
  if (vue) return { width: Math.round(Number.parseFloat(vue[1])), height: Math.round(Number.parseFloat(vue[2])) };
  return null;
}

/** La taille d'une image selon son contenu, ou null si le format n'est pas reconnu. */
export function tailleDeLImage(contenu: Buffer, extension: string): Taille | null {
  const ext = extension.toLowerCase();
  const taille =
    ext === ".png" ? taillePng(contenu)
    : ext === ".jpg" || ext === ".jpeg" ? tailleJpeg(contenu)
    : ext === ".webp" ? tailleWebp(contenu)
    : ext === ".gif" ? tailleGif(contenu)
    : ext === ".svg" ? tailleSvg(contenu)
    : null;
  return taille && taille.width > 0 && taille.height > 0 ? taille : null;
}

// --- Lecture du formulaire ----------------------------------------------------------------

const texte = (valeur: unknown): string | null => (typeof valeur === "string" && valeur.trim() !== "" ? valeur.trim() : null);

/** L'adresse publique d'une image saisie (logo, image de partage) : "/medias/logo.png" tel quel, un nom seul est cherché dans /medias/. */
function adresseDuLogo(saisi: unknown): string | null {
  const valeur = texte(saisi);
  if (!valeur) return null;
  if (/^https?:\/\//i.test(valeur)) return valeur;
  if (valeur.startsWith("/")) return valeur;
  return `/medias/${valeur.replace(/^public\/medias\//, "")}`;
}

const tailles = new Map<string, { date: number; taille: Taille | null }>();

function logo(saisi: unknown, nom: string | null): LogoSaisi | null {
  const url = adresseDuLogo(saisi);
  if (!url) return null;
  const resultat: LogoSaisi = { url, alt: nom ?? "" };
  if (/^https?:\/\//i.test(url)) return resultat;
  try {
    const chemin = join(process.cwd(), DOSSIER_PUBLIC, decodeURIComponent(url.replace(/[?#].*$/, "")));
    if (!existsSync(chemin)) return resultat;
    const date = statSync(chemin).mtimeMs;
    let memo = tailles.get(chemin);
    if (!memo || memo.date !== date) {
      memo = { date, taille: tailleDeLImage(readFileSync(chemin), extname(chemin)) };
      tailles.set(chemin, memo);
    }
    if (memo.taille) {
      resultat.width = memo.taille.width;
      resultat.height = memo.taille.height;
    }
  } catch {
    // Dimensions inconnues : l'image s'affiche quand même (hauteur fixée par le CSS de la barre).
  }
  return resultat;
}

/** Une adresse de service d'envoi : seulement https, sans espace ; tout autre texte est ignore (le formulaire n'envoie alors rien). */
const adresseHttps = (valeur: unknown): string | null => {
  const t = texte(valeur);
  return t && /^https:\/\/\S+$/.test(t) ? t : null;
};

const objet = (valeur: unknown): Record<string, unknown> =>
  valeur && typeof valeur === "object" ? (valeur as Record<string, unknown>) : {};

const paire = (valeur: unknown): PaireDeLangues => {
  const o = objet(valeur);
  return { fr: texte(o.fr), en: texte(o.en) };
};

/** L'identité saisie dans Keystatic, ou null tant que le formulaire n'a rien enregistré. Synchrone. */
export function lireIdentiteKeystatic(): IdentiteSaisie | null {
  try {
    const chemin = join(process.cwd(), FICHIER);
    if (!existsSync(chemin)) return null;
    const donnees = objet(JSON.parse(readFileSync(chemin, "utf8")));
    const nom = texte(donnees.nom);
    const saisie: IdentiteSaisie = {
      nom,
      logo: logo(donnees.logo, nom),
      logoSombre: logo(donnees.logoSombre, nom),
      description: paire(donnees.description),
      imagePartage: adresseDuLogo(donnees.imagePartage),
      texteImage: paire(donnees.texteImage),
      email: texte(donnees.email),
      compteX: texte(donnees.compteX),
      editeur: texte(donnees.editeur),
      envoiContact: adresseHttps(donnees.envoiContact),
      envoiNewsletter: adresseHttps(donnees.envoiNewsletter),
    };
    const rienDeSaisi =
      !saisie.nom && !saisie.logo && !saisie.logoSombre && !saisie.description.fr && !saisie.description.en &&
      !saisie.imagePartage && !saisie.texteImage.fr && !saisie.texteImage.en && !saisie.email && !saisie.compteX && !saisie.editeur &&
      !saisie.envoiContact && !saisie.envoiNewsletter;
    return rienDeSaisi ? null : saisie;
  } catch {
    return null;
  }
}
