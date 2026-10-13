// src/moteur/textes-articles-keystatic.ts - superpose au dictionnaire du theme les textes saisis dans Keystatic pour l'archive du blog et la page d'un article.
//
// Un seul appel dans chaque composant qui montre un de ces textes :
//   const t = await avecTextesDesArticles(useTranslations(locale), locale);
// Les champs des formulaires (src/keystatic/pages-articles.ts) portent les noms du dictionnaire
// (t.archive, t.post) : aucune table de correspondance. Un champ vide, ou un formulaire pas
// encore enregistre, garde le texte du theme (voir surcharger).
import { surcharger } from "./contenu-keystatic.ts";
import { lireArchive, lireArticle } from "./pages-articles-keystatic.ts";

export async function avecTextesDesArticles<T>(t: T, locale: string): Promise<T> {
  const [article, archive] = await Promise.all([lireArticle(locale), lireArchive(locale)]);
  return surcharger(t, { post: article, archive });
}
