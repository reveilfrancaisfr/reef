// src/moteur/pages-restantes-keystatic.ts - lit les formulaires Keystatic des pages Sujets, Auteurs et Recherche (src/keystatic/pages-restantes.ts).
//
// Rien n'est jamais bloquant : si un fichier n'existe pas encore ou est illisible,
// on rend null et la page garde les textes d'origine du theme (voir surcharger).
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

export const lireSujets = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.sujetsFr.read() : reader.singletons.sujetsEn.read()));
export const lireAuteurs = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.auteursFr.read() : reader.singletons.auteursEn.read()));
export const lireRecherche = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.rechercheFr.read() : reader.singletons.rechercheEn.read()));
