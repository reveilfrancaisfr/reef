// src/keystatic/pages-articles.ts - les formulaires Keystatic des pages qui montrent les articles : l'archive du blog (page Articles), et la page d'un article.
//
// Meme convention que pages-restantes.ts : les noms des champs sont ceux du dictionnaire du
// theme (t.archive, t.post), les composants qui les affichent les superposent aux textes
// d'origine avec surcharger() (par avecTextesDesArticles, src/moteur/textes-articles-keystatic.ts),
// et un champ laisse vide garde le texte du theme.
// scripts/preremplir-pages-articles.ts ecrit les fichiers deja remplis avec les textes actuels.
//
// keystatic.config.ts branche TOUT `pagesArticles` d'un bloc (singletons et menu de gauche) :
// ajouter un formulaire ici suffit, sans rouvrir la configuration.
import { fields, singleton } from "@keystatic/core";

const VIDE = "Laisser vide pour garder le texte d'origine du thème.";

const texte = (label: string, multiline = false, description = VIDE) => fields.text({ label, multiline, description });

/** Un texte qui contient un mot entre accolades, remplace par le site : l'editeur doit le garder tel quel. */
const avecJeton = (label: string, jeton: string, explication: string, multiline = false) =>
  texte(label, multiline, `Gardez ${jeton} dans le texte : ${explication} ${VIDE}`);

/**
 * L'archive du blog (ArchivePage.astro) : ce que Google lit, le fil d'Ariane, le titre, son introduction,
 * le suffixe des pages suivantes ; puis les textes de la LISTE d'articles (PostGrid.astro), les memes sur
 * l'archive, les pages de sujet, d'auteur et d'etiquette ; puis le titre de la page d'un sujet et d'une etiquette.
 */
const archive = () => ({
  metaTitle: texte("Titre de la page (onglet du navigateur et Google)"),
  metaDescription: texte("Description de la page (Google)", true),
  crumb: texte("Nom de la page dans le fil d'Ariane"),
  eyebrow: texte("Surtitre (petit intitulé au-dessus du titre)"),
  title: texte("Titre", true),
  accent: texte("Mot mis en valeur dans le titre", false, `Il doit apparaître tel quel dans le titre. ${VIDE}`),
  lede: texte("Introduction (sous le titre)", true),
  pageSuffix: avecJeton(
    "Pages 2 et suivantes : suffixe du titre de l'onglet",
    "{n}",
    "il est remplacé par le numéro de la page. Avec les textes d'origine, la page 2 s'intitule « Tous les articles, page 2 ».",
  ),
  countLabel: avecJeton("Liste d'articles : nombre d'articles (plusieurs)", "{count}", "il est remplacé par le nombre d'articles."),
  countOne: texte("Liste d'articles : nombre d'articles (un seul)"),
  listLabel: texte("Liste d'articles : nom pour les lecteurs d'écran"),
  paginationLabel: texte("Pagination : nom pour les lecteurs d'écran"),
  emptyTitle: texte("Liste vide : titre"),
  emptyLede: texte("Liste vide : explication", true),
  emptyCta: texte("Liste vide : bouton (archive, pages d'un sujet, d'un auteur et d'une étiquette)"),
  topicTitle: avecJeton("Page d'un sujet : titre", "{topic}", "il est remplacé par le nom du sujet."),
  tagTitle: avecJeton("Page d'une étiquette : titre", "{tag}", "il est remplacé par le nom de l'étiquette."),
});

/** La page d'un article : l'en-tete (PostHero), le sommaire, le pied (PostFooter) et les lectures suivantes (RelatedPosts). */
const article = () => ({
  published: texte("En-tête : « Publié le »"),
  updated: texte("En-tête : « Mis à jour le »"),
  updatedNote: texte("En-tête : infobulle de la date de mise à jour"),
  writtenBy: texte("En-tête : « Écrit par »"),
  topicLabel: texte("En-tête : mot lu avant le nom du sujet par les lecteurs d'écran"),
  minRead: avecJeton("En-tête : temps de lecture (plusieurs minutes)", "{n}", "il est remplacé par le nombre de minutes."),
  minReadOne: texte("En-tête : temps de lecture (une minute)"),
  draft: texte("En-tête : pastille « Brouillon »"),
  draftNote: texte("En-tête : avertissement affiché sur un brouillon", true),
  toc: texte("Sommaire : titre"),
  tocLabel: texte("Sommaire : nom pour les lecteurs d'écran"),
  tagsLabel: texte("Pied d'article : titre de la liste d'étiquettes"),
  share: texte("Pied d'article : titre du partage"),
  shareOn: avecJeton("Pied d'article : nom d'un bouton de partage pour les lecteurs d'écran", "{network}", "il est remplacé par le nom du réseau."),
  networkEmail: texte("Pied d'article : bouton de partage par e-mail"),
  networkX: texte("Pied d'article : bouton de partage sur X"),
  aboutAuthor: texte("Pied d'article : titre du bloc de l'auteur"),
  moreFromAuthor: avecJeton("Pied d'article : lien vers les autres articles de l'auteur", "{name}", "il est remplacé par le nom de l'auteur."),
  navLabel: texte("Pied d'article : nom de la navigation entre articles pour les lecteurs d'écran"),
  previousPost: texte("Pied d'article : « Article précédent »"),
  nextPost: texte("Pied d'article : « Article suivant »"),
  backToPosts: texte("Pied d'article : lien « Retour aux articles »"),
  keepReading: texte("Lecture suivante : titre"),
  keepReadingAccent: texte("Lecture suivante : mot mis en valeur dans le titre", false, `Il doit apparaître tel quel dans le titre. ${VIDE}`),
  keepReadingLede: texte("Lecture suivante : introduction", true),
  keepReadingCta: texte("Lecture suivante : bouton"),
});

type Nom = "archive" | "article";

const pageDe = <S extends Record<string, ReturnType<typeof texte>>>(nom: Nom, langue: "fr" | "en", label: string, schema: S) =>
  singleton({
    label,
    path: `src/donnees/${nom}-${langue}`,
    format: { data: "json" },
    schema,
  });

export const archiveFr = pageDe("archive", "fr", "Page Articles, l'archive du blog (français)", archive());
export const archiveEn = pageDe("archive", "en", "Page Articles, l'archive du blog (anglais)", archive());
export const articleFr = pageDe("article", "fr", "Page d'un article (français)", article());
export const articleEn = pageDe("article", "en", "Page d'un article (anglais)", article());

/** Tous les formulaires de ce fichier : keystatic.config.ts les branche d'un bloc. */
export const pagesArticles = { archiveFr, archiveEn, articleFr, articleEn };
