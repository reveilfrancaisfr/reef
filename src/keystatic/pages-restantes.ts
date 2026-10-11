// src/keystatic/pages-restantes.ts - les formulaires Keystatic des pages Sujets, Auteurs et Recherche : l'en-tete de chaque page, un formulaire par langue.
//
// Les noms des champs sont ceux du dictionnaire du theme (t.topics, t.authors, t.search) :
// src/pages/[...locale]/topics/index.astro, authors/index.astro et search.astro les
// superposent aux textes d'origine avec surcharger(), sans table de correspondance.
// Un champ laisse vide garde le texte du theme ; scripts/preremplir-pages-restantes.ts
// ecrit les fichiers deja remplis avec les textes actuels.
//
// Seuls les textes que ces trois pages affichent elles-memes sont ici : les textes des
// cartes, de la liste des resultats et du champ de recherche vivent dans leurs composants.
import { fields, singleton } from "@keystatic/core";

const VIDE = "Laisser vide pour garder le texte d'origine du thème.";

const texte = (label: string, multiline = false, description = VIDE) => fields.text({ label, multiline, description });

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

const pageDe = (nom: "sujets" | "auteurs" | "recherche", langue: "fr" | "en", label: string) =>
  singleton({
    label,
    path: `src/donnees/${nom}-${langue}`,
    format: { data: "json" },
    schema: enTeteDePage(),
  });

export const sujetsFr = pageDe("sujets", "fr", "Page Sujets (français)");
export const sujetsEn = pageDe("sujets", "en", "Page Sujets (anglais)");
export const auteursFr = pageDe("auteurs", "fr", "Page Auteurs (français)");
export const auteursEn = pageDe("auteurs", "en", "Page Auteurs (anglais)");
export const rechercheFr = pageDe("recherche", "fr", "Page Recherche (français)");
export const rechercheEn = pageDe("recherche", "en", "Page Recherche (anglais)");
