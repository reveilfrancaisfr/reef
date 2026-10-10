// src/moteur/contenu-keystatic.ts - lit les formulaires Keystatic du site (src/keystatic/pages.ts) et les superpose aux textes du theme.
//
// Rien n'est jamais bloquant : si un fichier n'existe pas encore ou est
// illisible, on rend les textes d'origine du theme.
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";

const reader = createReader(process.cwd(), keystaticConfig);

const lire = async <T>(lecture: () => Promise<T | null>): Promise<T | null> => {
  try {
    return await lecture();
  } catch {
    return null;
  }
};

export const lireSite = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.siteFr.read() : reader.singletons.siteEn.read()));
export const lireAPropos = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.aProposFr.read() : reader.singletons.aProposEn.read()));
export const lireContact = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.contactFr.read() : reader.singletons.contactEn.read()));
export const lireMentions = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.mentionsFr.read() : reader.singletons.mentionsEn.read()));
export const lireConfidentialite = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.confidentialiteFr.read() : reader.singletons.confidentialiteEn.read()));
export const lireConditions = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.conditionsFr.read() : reader.singletons.conditionsEn.read()));

/**
 * Superpose les textes saisis dans Keystatic (`ks`) a ceux du theme (`base`).
 *  - texte : vide ou absent, on garde celui du theme ;
 *  - objet : champ par champ ;
 *  - liste : si elle contient quelque chose, elle remplace celle du theme ; un
 *    element vide garde l'element du theme de meme rang, s'il existe.
 */
export function surcharger<T>(base: T, ks: unknown): T {
  if (ks === undefined || ks === null) return base;
  if (typeof ks === "string") return (ks.trim() ? (ks as unknown as T) : base);
  if (typeof ks === "number" || typeof ks === "boolean") return ks as unknown as T;
  if (Array.isArray(ks)) {
    if (ks.length === 0) return base;
    const liste = Array.isArray(base) ? (base as unknown[]) : [];
    return ks.map((element, rang) => surcharger(liste[rang], element)).filter((element) => element !== undefined) as unknown as T;
  }
  if (typeof ks === "object" && base !== null && typeof base === "object" && !Array.isArray(base)) {
    const sortie: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [cle, valeur] of Object.entries(ks as Record<string, unknown>)) {
      sortie[cle] = surcharger(sortie[cle], valeur);
    }
    return sortie as T;
  }
  if (typeof ks === "object" && base === undefined) return ks as T;
  return base;
}

export interface LienKeystatic {
  texte: string;
  lien: string;
  nouvelOnglet?: boolean;
}

/** Des liens saisis dans Keystatic, au format des menus du theme ; les liens incomplets sont ignores. */
export function liensKeystatic(liste?: readonly LienKeystatic[] | null): { text: string; href: string; target?: string }[] {
  return (liste ?? [])
    .filter((lien) => lien.texte.trim() && lien.lien.trim())
    .map((lien) => ({ text: lien.texte.trim(), href: lien.lien.trim(), ...(lien.nouvelOnglet ? { target: "_blank" } : {}) }));
}

/* ---------------------------------------------------------------- Pages libres (blocs) */

export interface PageLibre {
  /** La fin de l'adresse : la page est sur /p/<slug>/ (et /fr/p/<slug>/ en francais). */
  slug: string;
  titre: string;
  langue: "fr" | "en";
  description: string;
  blocs: { discriminant: string; value: Record<string, any> }[];
}

/** Les pages libres publiees (la case "Publier cette page" cochee), toutes langues. */
export async function lirePagesLibres(): Promise<PageLibre[]> {
  try {
    const toutes = await reader.collections.pagesLibres.all();
    return toutes
      .filter(({ entry }) => entry.publiee)
      .map(({ slug, entry }) => ({
        slug,
        titre: entry.titre || slug,
        langue: entry.langue === "en" ? ("en" as const) : ("fr" as const),
        description: entry.description ?? "",
        blocs: entry.blocs as unknown as PageLibre["blocs"],
      }));
  } catch {
    return [];
  }
}
