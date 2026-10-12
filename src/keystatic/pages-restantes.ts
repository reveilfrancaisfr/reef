// src/keystatic/pages-restantes.ts - les formulaires Keystatic des pages Sujets, Auteurs, Recherche et Page introuvable : un formulaire par page et par langue.
//
// Les noms des champs sont ceux du dictionnaire du theme (t.topics, t.authors, t.search,
// t.notFound) : les pages et composants qui les affichent les superposent aux textes
// d'origine avec surcharger(), sans table de correspondance. Un champ laisse vide garde
// le texte du theme ; scripts/preremplir-pages-restantes.ts ecrit les fichiers deja remplis
// avec les textes actuels.
//
// Seuls les textes que ces pages affichent elles-memes sont ici : les textes des cartes de
// sujets et d'auteurs vivent dans leurs composants.
import { fields, singleton } from "@keystatic/core";

const VIDE = "Laisser vide pour garder le texte d'origine du thème.";

const texte = (label: string, multiline = false, description = VIDE) => fields.text({ label, multiline, description });

/** Un texte qui contient un mot entre accolades, remplace par le site : l'editeur doit le garder tel quel. */
const avecJeton = (label: string, jeton: string, explication: string, multiline = false) =>
  texte(label, multiline, `Gardez ${jeton} dans le texte : ${explication} ${VIDE}`);

/** L'en-tete d'une page : ce que Google lit, le fil d'Ariane, puis le titre et son introduction. */
const enTeteDePage = () => ({
  metaTitle: texte("Titre de la page (onglet du navigateur et Google)"),
  metaDescription: texte("Description de la page (Google)", true),
  crumb: texte("Nom de la page dans le fil d'Ariane"),
  eyebrow: texte("Surtitre (petit intitulé au-dessus du titre)"),
  title: texte("Titre", true),
  accent: texte("Mot mis en valeur dans le titre", false, `Il doit apparaître tel quel dans le titre. ${VIDE}`),
  lede: texte("Introduction (sous le titre)", true),
});

/** Le champ de recherche, le compteur et le message "aucun resultat" (composant Search.astro). */
const rechercheEnPlus = () => ({
  placeholder: texte("Champ de recherche : texte d'invite"),
  label: texte("Champ de recherche : nom pour les lecteurs d'écran"),
  shortcut: texte("Astuce clavier (à côté de la touche /)"),
  clear: texte("Bouton d'effacement : nom pour les lecteurs d'écran"),
  prompt: avecJeton("Phrase avant la première frappe", "{count}", "il est remplacé par le nombre d'articles."),
  resultsLabel: texte("Liste des résultats : nom pour les lecteurs d'écran"),
  countLabel: avecJeton("Nombre de résultats (plusieurs)", "{count}", "il est remplacé par le nombre de résultats."),
  countOne: texte("Nombre de résultats (un seul)"),
  inTopic: avecJeton("Mention du sujet sur chaque résultat", "{topic}", "il est remplacé par le nom du sujet."),
  noResultsTitle: avecJeton("Aucun résultat : titre", "{query}", "il est remplacé par ce que le lecteur a tapé."),
  noResultsLede: texte("Aucun résultat : explication", true),
  noResultsCta: texte("Aucun résultat : bouton"),
});

/** La page introuvable (404) : composant NotFound.astro. Les adresses des trois boutons ne se changent pas ici. */
const introuvable = () => ({
  metaTitle: texte("Titre de la page (onglet du navigateur)"),
  metaDescription: texte("Description de la page", true),
  code: texte("Le grand code affiché en haut", false, `Par défaut 404. ${VIDE}`),
  title: texte("Titre", true),
  accent: texte("Mot mis en valeur dans le titre", false, `Il doit apparaître tel quel dans le titre. ${VIDE}`),
  lede: texte("Introduction (sous le titre)", true),
  homeCta: texte("Premier bouton (retour à l'accueil)"),
  postsCta: texte("Deuxième bouton (voir les articles)"),
  searchCta: texte("Troisième bouton (rechercher)"),
});

type Nom = "sujets" | "auteurs" | "recherche" | "introuvable";

const pageDe = <S extends Record<string, ReturnType<typeof texte>>>(nom: Nom, langue: "fr" | "en", label: string, schema: S) =>
  singleton({
    label,
    path: `src/donnees/${nom}-${langue}`,
    format: { data: "json" },
    schema,
  });

export const sujetsFr = pageDe("sujets", "fr", "Page Sujets (français)", enTeteDePage());
export const sujetsEn = pageDe("sujets", "en", "Page Sujets (anglais)", enTeteDePage());
export const auteursFr = pageDe("auteurs", "fr", "Page Auteurs (français)", enTeteDePage());
export const auteursEn = pageDe("auteurs", "en", "Page Auteurs (anglais)", enTeteDePage());
export const rechercheFr = pageDe("recherche", "fr", "Page Recherche (français)", { ...enTeteDePage(), ...rechercheEnPlus() });
export const rechercheEn = pageDe("recherche", "en", "Page Recherche (anglais)", { ...enTeteDePage(), ...rechercheEnPlus() });
export const introuvableFr = pageDe("introuvable", "fr", "Page introuvable, 404 (français)", introuvable());
export const introuvableEn = pageDe("introuvable", "en", "Page introuvable, 404 (anglais)", introuvable());
