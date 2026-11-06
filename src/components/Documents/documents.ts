// src/components/Documents/documents.ts - prépare les documents joints saisis dans Keystatic : type de fichier, adresse du lecteur, taille.
//
// Seuls les chemins du site (/documents/…) et les adresses https sont acceptés (jamais javascript: ni data:).
import { statSync } from "node:fs";
import { join } from "node:path";

export type Genre = "pdf" | "office" | "image" | "texte" | "autre";

/** Un document tel qu'il est enregistré par Keystatic (champs articles et bloc « Documents »). */
export interface DocumentSaisi {
  titre?: string | null;
  fichier?: unknown;
  description?: string | null;
  integre?: boolean | null;
}

export interface DocumentPret {
  titre: string;
  description: string;
  /** Adresse du fichier lui-même. */
  url: string;
  /** Adresse de ce que l'on met dans le cadre de lecture ; absente si le format ne s'affiche pas dans la page. */
  lecteur?: string;
  genre: Genre;
  /** « PDF », « Word »… */
  etiquette: string;
  taille?: string;
  integre: boolean;
}

const OFFICE: Record<string, string> = {
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
  ppt: "PowerPoint",
  pptx: "PowerPoint",
};
const IMAGES = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "svg"]);
const AUTRES: Record<string, string> = {
  csv: "CSV",
  odt: "OpenDocument",
  ods: "OpenDocument",
  odp: "OpenDocument",
  zip: "ZIP",
  rtf: "RTF",
  md: "Markdown",
};

/** L'adresse d'un fichier saisi : chemin du site ou https, sinon rien. */
export function urlDeDocument(valeur: unknown): string | undefined {
  if (typeof valeur !== "string") return undefined;
  const v = valeur.trim();
  if (v === "" || v.includes("..")) return undefined;
  if (/^https:\/\//i.test(v)) return v;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  return undefined;
}

export function extensionDe(url: string): string {
  const m = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(url);
  return m ? m[1].toLowerCase() : "";
}

function genreEtiquette(extension: string): { genre: Genre; etiquette: string } {
  if (extension === "pdf") return { genre: "pdf", etiquette: "PDF" };
  if (OFFICE[extension]) return { genre: "office", etiquette: OFFICE[extension] };
  if (IMAGES.has(extension)) return { genre: "image", etiquette: extension === "jpeg" ? "JPG" : extension.toUpperCase() };
  if (extension === "txt") return { genre: "texte", etiquette: "Texte" };
  return { genre: "autre", etiquette: AUTRES[extension] ?? (extension ? extension.toUpperCase() : "Fichier") };
}

function nomDuFichier(url: string): string {
  const dernier = url.split(/[?#]/)[0].split("/").pop() ?? "";
  try {
    return decodeURIComponent(dernier);
  } catch {
    return dernier;
  }
}

function formaterTaille(octets: number, locale: string): string {
  const unites = locale === "fr" ? ["o", "Ko", "Mo", "Go"] : ["B", "KB", "MB", "GB"];
  let n = octets;
  let i = 0;
  while (n >= 1024 && i < unites.length - 1) {
    n /= 1024;
    i += 1;
  }
  const nombre = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: i >= 2 ? 1 : 0 }).format(n);
  return `${nombre}\u00a0${unites[i]}`;
}

/** La taille d'un fichier de public/, lue au build ; rien si le fichier est introuvable ou distant. */
function tailleDe(url: string, locale: string): string | undefined {
  if (!url.startsWith("/")) return undefined;
  try {
    const chemin = decodeURIComponent(url.split(/[?#]/)[0]);
    return formaterTaille(statSync(join(process.cwd(), "public", chemin)).size, locale);
  } catch {
    return undefined;
  }
}

export function preparerDocuments(documents: unknown, options: { site?: URL; locale: string }): DocumentPret[] {
  if (!Array.isArray(documents)) return [];
  const prets: DocumentPret[] = [];
  for (const brut of documents as DocumentSaisi[]) {
    const url = urlDeDocument(brut?.fichier);
    if (!url) continue;
    const { genre, etiquette } = genreEtiquette(extensionDe(url));
    // Le lecteur de Microsoft télécharge le fichier lui-même : il lui faut une adresse complète.
    const absolu = new URL(url, options.site ?? "http://localhost/").href;
    let lecteur: string | undefined;
    if (genre === "pdf") lecteur = `${url}#navpanes=0`;
    else if (genre === "office") lecteur = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absolu)}`;
    else if (genre === "image" || genre === "texte") lecteur = url;
    prets.push({
      titre: (brut.titre ?? "").trim() || nomDuFichier(url),
      description: (brut.description ?? "").trim(),
      url,
      lecteur,
      genre,
      etiquette,
      taille: tailleDe(url, options.locale),
      integre: brut.integre === true,
    });
  }
  return prets;
}
