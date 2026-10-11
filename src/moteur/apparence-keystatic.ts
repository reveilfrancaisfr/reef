// src/moteur/apparence-keystatic.ts - lit le formulaire Keystatic "Apparence du site" et rend le CSS a poser dans le <head>.
//
// Rien n'est jamais bloquant : si le fichier n'existe pas encore ou est illisible,
// on rend une chaine vide et le site garde l'apparence du theme.
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";
import { type ApparenceSaisie, cssApparence } from "./apparence-site";

const reader = createReader(process.cwd(), keystaticConfig);

/** Le CSS des couleurs et des polices saisies ; "" tant que rien n'est active. */
export async function cssApparenceDuSite(): Promise<string> {
  try {
    const donnees = await reader.singletons.apparenceSite.read();
    return cssApparence(donnees as ApparenceSaisie | null);
  } catch {
    return "";
  }
}
