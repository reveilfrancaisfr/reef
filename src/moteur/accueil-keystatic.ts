// src/moteur/accueil-keystatic.ts - lit les formulaires Keystatic de l'accueil (src/keystatic/accueil.ts) pour la page et pour chacune de ses sections.
//
// Rien n'est jamais bloquant : si un fichier n'existe pas encore ou est
// illisible, on rend les textes et l'ordre d'origine du theme.
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";
import { BLOCS_ACCUEIL, type BlocAccueil } from "../keystatic/accueil";
import { surcharger } from "./contenu-keystatic";

const reader = createReader(process.cwd(), keystaticConfig);

/** Un texte, un titre et le mot mis en valeur, comme les sections du theme les affichent. */
interface Section {
  title?: string;
  accent?: string;
  lede?: string;
  cta?: string;
  lien?: string;
}

/** Les textes que l'editeur a saisis ; une valeur vide ou absente = texte du theme. */
export interface TextesAccueil {
  metaTitre?: string;
  metaDescription?: string;
  accroche?: string;
  titre?: string;
  motAccentue?: string;
  chapeau?: string;
  boutonPrincipal?: string;
  lienPrincipal?: string;
  boutonSecondaire?: string;
  lienSecondaire?: string;
  compteurs?: readonly string[];
  imageFond?: string;
  bande?: { label?: string };
  aLaUne?: { eyebrow?: string };
  studio?: Section & { eyebrow?: string; contact?: string; lienContact?: string; video?: string; affiche?: string };
  dernieresNotes?: Section;
  sujets?: Section;
  signatures?: Section;
  lettre?: { image?: string; lienFlux?: string };
}

export async function lireTextesAccueil(locale: string): Promise<TextesAccueil> {
  try {
    const donnees = locale === "fr" ? await reader.singletons.accueilFr.read() : await reader.singletons.accueilEn.read();
    return donnees ?? {};
  } catch {
    return {};
  }
}

/**
 * Une adresse saisie dans Keystatic, ou rien : relative (/page/), ancree, mailto: ou https.
 * Le reste (javascript:, data:…) est refuse, et une adresse vide laisse la main au theme.
 */
export function adresseDeLAccueil(valeur: unknown): string | undefined {
  if (typeof valeur !== "string") return undefined;
  const v = valeur.trim();
  return /^(https?:\/\/|mailto:|\/(?!\/)|#)/.test(v) ? v : undefined;
}

/** Les textes saisis, au format du dictionnaire du theme (t.home.*) : seuls les champs remplis comptent. */
export function versDictionnaire(ks: TextesAccueil): { home: Record<string, string | undefined> } {
  const sec = (s: Section | undefined, prefixe: string) => ({
    [`${prefixe}Title`]: s?.title,
    [`${prefixe}Accent`]: s?.accent,
    [`${prefixe}Lede`]: s?.lede,
    [`${prefixe}Cta`]: s?.cta,
  });
  return {
    home: {
      marqueeLabel: ks.bande?.label,
      featuredEyebrow: ks.aLaUne?.eyebrow,
      aboutEyebrow: ks.studio?.eyebrow,
      aboutContact: ks.studio?.contact,
      ...sec(ks.studio, "about"),
      ...sec(ks.dernieresNotes, "latest"),
      ...sec(ks.sujets, "topics"),
      ...sec(ks.signatures, "authors"),
    },
  };
}

/**
 * Le dictionnaire du theme avec, par-dessus, les textes de l'accueil saisis dans Keystatic ;
 * et les textes bruts pour les adresses et les medias que chaque section lit elle-meme.
 *
 *   const { t, ks } = await accueilKeystatic(useTranslations(Astro), locale);
 */
export async function accueilKeystatic<T extends object>(t: T, locale: string): Promise<{ t: T; ks: TextesAccueil }> {
  const ks = await lireTextesAccueil(locale);
  return { t: surcharger(t, versDictionnaire(ks)), ks };
}

/** L'ordre des blocs, sans les masques ; `null` tant que l'editeur n'a rien regle (ordre du theme). */
export async function lireOrdreDesBlocs(): Promise<BlocAccueil[] | null> {
  try {
    const donnees = await reader.singletons.dispositionAccueil.read();
    const liste = donnees?.blocs ?? [];
    if (liste.length === 0) return null;
    const connus = new Set<string>(BLOCS_ACCUEIL.map((b) => b.slug));
    const ordre: BlocAccueil[] = [];
    for (const { bloc, visible } of liste) {
      if (!visible || !connus.has(bloc) || ordre.includes(bloc as BlocAccueil)) continue;
      ordre.push(bloc as BlocAccueil);
    }
    return ordre;
  } catch {
    return null;
  }
}
