// src/moteur/pages-articles-keystatic.ts - lit les formulaires Keystatic des pages qui montrent les articles (src/keystatic/pages-articles.ts).
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

export const lireArchive = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.archiveFr.read() : reader.singletons.archiveEn.read()));
export const lireArticle = (locale: string) =>
  lire(() => (locale === "fr" ? reader.singletons.articleFr.read() : reader.singletons.articleEn.read()));
