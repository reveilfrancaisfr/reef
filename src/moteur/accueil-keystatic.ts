// src/moteur/accueil-keystatic.ts - lit les formulaires Keystatic de l'accueil (src/keystatic/accueil.ts) pour la page et ses blocs.
//
// Rien n'est jamais bloquant : si un fichier n'existe pas encore ou est
// illisible, on rend les textes et l'ordre d'origine du theme.
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";
import { BLOCS_ACCUEIL, type BlocAccueil } from "../keystatic/accueil";

const reader = createReader(process.cwd(), keystaticConfig);

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
}

export async function lireTextesAccueil(locale: string): Promise<TextesAccueil> {
  try {
    const donnees = locale === "fr" ? await reader.singletons.accueilFr.read() : await reader.singletons.accueilEn.read();
    return donnees ?? {};
  } catch {
    return {};
  }
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