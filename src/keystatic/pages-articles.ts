// src/keystatic/pages-articles.ts - les formulaires Keystatic des pages qui montrent les articles : l'archive du blog (page Articles), et, a venir, la page d'un article.
//
// Meme convention que pages-restantes.ts : les noms des champs sont ceux du dictionnaire du
// theme (t.archive, t.post), les composants qui les affichent les superposent aux textes
// d'origine avec surcharger(), et un champ laisse vide garde le texte du theme.
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

/** L'archive du blog (ArchivePage.astro) : ce que Google lit, le fil d'Ariane, le titre, son introduction, et le suffixe des pages suivantes. */
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
});

type Nom = "archive";

const pageDe = <S extends Record<string, ReturnType<typeof texte>>>(nom: Nom, langue: "fr" | "en", label: string, schema: S) =>
  singleton({
    label,
    path: `src/donnees/${nom}-${langue}`,
    format: { data: "json" },
    schema,
  });

export const archiveFr = pageDe("archive", "fr", "Page Articles, l'archive du blog (français)", archive());
export const archiveEn = pageDe("archive", "en", "Page Articles, l'archive du blog (anglais)", archive());

/** Tous les formulaires de ce fichier : keystatic.config.ts les branche d'un bloc. */
export const pagesArticles = { archiveFr, archiveEn };
