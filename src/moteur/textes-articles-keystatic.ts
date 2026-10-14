// src/moteur/textes-articles-keystatic.ts - superpose au dictionnaire du theme les textes saisis dans Keystatic pour l'archive du blog, la page d'un article, et les pages d'un sujet, d'un auteur et d'une etiquette.
//
// Un seul appel dans chaque composant ou page qui montre un de ces textes :
//   const t = await avecTextesDesArticles(useTranslations(locale), locale);
//   const t = await avecTextesDesArticles(await textesDeLaPage(Astro), locale);   (les pages qui lisent leur dictionnaire par la requete)
// Les champs des formulaires (src/keystatic/pages-articles.ts pour t.archive et t.post,
// src/keystatic/pages-restantes.ts pour t.topics et t.authors) portent les noms du dictionnaire :
// aucune table de correspondance. Un champ vide, ou un formulaire pas encore enregistre, garde le
// texte du theme (voir surcharger).
import { surcharger } from "./contenu-keystatic.ts";
import { lireArchive, lireArticle } from "./pages-articles-keystatic.ts";
import { lireAuteurs, lireSujets } from "./pages-restantes-keystatic.ts";

export async function avecTextesDesArticles<T>(t: T, locale: string): Promise<T> {
  const [article, archive, sujets, auteurs] = await Promise.all([
    lireArticle(locale),
    lireArchive(locale),
    lireSujets(locale),
    lireAuteurs(locale),
  ]);
  return surcharger(t, { post: article, archive, topics: sujets, authors: auteurs });
}
