// src/moteur/edition-keystatic.ts - les donnees que le mode edition Keystatic lit sur la page : la liste des blocs rendus, leur titre, et les formulaires Keystatic ou ils s'editent.
//
// Le theme a son propre mode edition (Pastilles.astro, CadreDuSite.astro), mais il depend du moteur EmDash
// (/_emdash/admin). Celui-ci est separe : il ne sert qu'avec Keystatic et s'allume par ?edition=1
// (public/edition-keystatic.js, charge par BaseLayout.astro).
//
// Une page pose ces donnees dans son <head> (<script type="application/json" id="ks-edition-donnees">) ;
// le script les associe, dans l'ordre, aux enfants de <main id="content">. Les chemins sont relatifs a
// /keystatic (ou /keystatic/branch/main en ligne) : "singleton/accueilFr", "collection/articlesFr".
//
// POUR CORRIGER OU SE REND UNE PASTILLE : modifier la table de la fonction concernee ci-dessous.
// Pur, sans importation : src/moteur/ est hors du scan de Tailwind.

export type Langue = "fr" | "en";

interface Lien {
  texte: string;
  chemin: string;
}

interface BlocEdition {
  id: string;
  titre: string;
  liens: Lien[];
}

const suffixe = (langue: Langue): "Fr" | "En" => (langue === "fr" ? "Fr" : "En");

/** Le JSON a poser dans la page, sans rien qui puisse fermer la balise script. */
const serialiser = (donnees: unknown): string => JSON.stringify(donnees).replace(/</g, "\\u003c");

/** Les blocs de l'accueil rendus, dans l'ordre, avec leurs formulaires. */
export function donneesEditionAccueil(rendus: readonly string[], langue: Langue): string {
  const s = suffixe(langue);
  const accueil: Lien = { texte: "Textes de l'accueil", chemin: `singleton/accueil${s}` };
  const ordre: Lien = { texte: "Ordre et affichage des blocs", chemin: "singleton/dispositionAccueil" };
  const articles: Lien = { texte: "Articles", chemin: `collection/articles${s}` };
  const sujets: Lien = { texte: "Sujets", chemin: `collection/ficheSujet${s}` };
  const auteurs: Lien = { texte: "Auteurs", chemin: `collection/ficheAuteur${s}` };
  const identite: Lien = { texte: "Adresses d'envoi des formulaires", chemin: "singleton/identiteSite" };

  const TITRES: Record<string, { titre: string; liens: Lien[] }> = {
    hero: { titre: "Ouverture", liens: [accueil, ordre] },
    "bande-sujets": { titre: "Bande des sujets", liens: [sujets, ordre] },
    "a-la-une": { titre: "Article à la une", liens: [articles, accueil] },
    studio: { titre: "Séquence filmée", liens: [accueil, ordre] },
    "dernieres-notes": { titre: "Derniers articles", liens: [articles, accueil] },
    sujets: { titre: "Sujets", liens: [sujets, accueil] },
    signatures: { titre: "Auteurs", liens: [auteurs, accueil] },
    lettre: { titre: "Lettre d'information", liens: [accueil, identite] },
  };

  const blocs: BlocEdition[] = rendus.map((id) => ({ id, ...(TITRES[id] ?? { titre: id, liens: [accueil] }) }));
  return serialiser({ page: "accueil", langue, blocs });
}

/** Les blocs d'une page libre, dans l'ordre ; les types que Blocs.astro ne rend pas sont ecartes. */
export function donneesEditionPageLibre(slug: string, langue: Langue, types: readonly string[]): string {
  const page: Lien = { texte: "Cette page libre", chemin: `collection/pagesLibres/item/${slug}` };
  const TITRES: Record<string, string> = {
    entete: "En-tête de page",
    texte: "Texte",
    texteImage: "Texte et image",
    imageSeule: "Image",
    video: "Vidéo",
    cartes: "Cartes",
    appel: "Appel à l'action",
    citation: "Citation",
    articles: "Derniers articles",
    carrousel: "Carrousel",
    espace: "Espace",
  };
  const blocs: BlocEdition[] = types
    .filter((type) => type in TITRES)
    .map((type) => ({ id: type, titre: TITRES[type], liens: [page] }));
  return serialiser({ page: "page-libre", langue, blocs });
}
