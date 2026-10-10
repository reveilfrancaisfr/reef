// src/keystatic/accueil.ts - les formulaires Keystatic de la page d'accueil : un singleton de textes par langue (l'ouverture et chacune des sections), un singleton pour l'ordre et la visibilite des blocs.
//
// Tout champ laisse vide retombe sur le texte d'origine du theme : on ne
// casse donc rien en ne remplissant que ce qu'on veut changer.
//
// Chaque section a son groupe de champs, dans l'ordre de la page. Les noms de ces
// groupes sont ceux que src/moteur/accueil-keystatic.ts traduit en cles du
// dictionnaire du theme (t.home.*) : bande, aLaUne, studio, dernieresNotes,
// sujets, signatures, lettre.
import { fields, singleton } from "@keystatic/core";
import { media } from "./champ-media";

/** Les blocs de l'accueil, dans l'ordre du theme. Les identifiants sont ceux de index.astro. */
export const BLOCS_ACCUEIL = [
  { slug: "hero", label: "Ouverture (grande image, titre, boutons)" },
  { slug: "bande-sujets", label: "Bande défilante des sujets" },
  { slug: "a-la-une", label: "Billet à la une" },
  { slug: "studio", label: "Séquence filmée" },
  { slug: "dernieres-notes", label: "Dernières notes" },
  { slug: "sujets", label: "Grille des sujets" },
  { slug: "signatures", label: "Signatures (auteurs)" },
  { slug: "lettre", label: "Invitation à s'abonner" },
] as const;

export type BlocAccueil = (typeof BLOCS_ACCUEIL)[number]["slug"];

const libelleDuBloc = (slug: string): string => BLOCS_ACCUEIL.find((b) => b.slug === slug)?.label ?? slug;

const VIDE = "Laisser vide pour garder le texte d'origine du thème.";
const ADRESSE = "Une page du site (/blog/ en anglais, /fr/blog/ en français) ou une adresse complète (https://…). " + VIDE;
const ACCENT = "Il doit apparaître tel quel dans le titre. " + VIDE;

const texte = (label: string, multiline = false) => fields.text({ label, multiline, description: VIDE });
const lien = (label: string) => fields.text({ label, description: ADRESSE });
const accent = (label = "Mot mis en valeur dans le titre") => fields.text({ label, description: ACCENT });
const groupe = <T extends Record<string, ReturnType<typeof fields.text> | ReturnType<typeof media>>>(label: string, champs: T) =>
  fields.object(champs, { label });

/** Les textes de l'accueil pour une langue. */
const textesDeLAccueil = (langue: "fr" | "en", label: string) =>
  singleton({
    label,
    path: `src/donnees/accueil-${langue}`,
    format: { data: "json" },
    schema: {
      // --- La page et son ouverture (le grand bloc du haut)
      metaTitre: texte("Titre de la page (onglet du navigateur et Google)"),
      metaDescription: texte("Description de la page (Google)", true),
      accroche: texte("Ouverture : ligne d'accroche au-dessus du titre"),
      titre: texte("Ouverture : titre", true),
      motAccentue: accent("Ouverture : mot mis en valeur dans le titre"),
      chapeau: texte("Ouverture : texte d'introduction", true),
      boutonPrincipal: texte("Ouverture : texte du bouton principal"),
      lienPrincipal: lien("Ouverture : adresse du bouton principal"),
      boutonSecondaire: texte("Ouverture : texte du bouton secondaire"),
      lienSecondaire: lien("Ouverture : adresse du bouton secondaire"),
      compteurs: fields.array(fields.text({ label: "Libellé" }), {
        label: "Ouverture : libellés des trois compteurs (notes, sujets, langues)",
        description: "Dans cet ordre. " + VIDE,
        itemLabel: (props) => props.value,
      }),
      imageFond: media({
        label: "Ouverture : photo de fond",
        genre: "image",
        description: "Vide : la photo du thème. Choisie dans la médiathèque, elle remplace celle du thème.",
      }),

      // --- Les sections, de haut en bas
      bande: groupe("Bande défilante des sujets", {
        label: texte("Nom de la bande (annoncé aux lecteurs d'écran)"),
      }),
      aLaUne: groupe("Billet à la une", {
        eyebrow: texte("Petit intitulé au-dessus de la carte"),
      }),
      studio: groupe("Séquence filmée (la vidéo qui avance quand on descend)", {
        eyebrow: texte("Petit intitulé au-dessus du titre"),
        title: texte("Titre"),
        accent: accent(),
        lede: texte("Texte"),
        cta: texte("Texte du bouton principal"),
        lien: lien("Adresse du bouton principal"),
        contact: texte("Texte du second bouton"),
        lienContact: lien("Adresse du second bouton"),
        video: media({
          label: "Vidéo",
          genre: "video",
          description: "Vide : la vidéo du thème. Courte (une douzaine de secondes), car sa lecture suit le défilement.",
        }),
        affiche: media({ label: "Image affichée avant la vidéo", genre: "image", description: "Vide : celle du thème." }),
      }),
      dernieresNotes: groupe("Dernières notes", {
        title: texte("Titre"),
        accent: accent(),
        lede: texte("Introduction"),
        cta: texte("Texte du bouton"),
        lien: lien("Adresse du bouton"),
      }),
      sujets: groupe("Grille des sujets", {
        title: texte("Titre"),
        accent: accent(),
        lede: texte("Introduction"),
        cta: texte("Texte du bouton"),
        lien: lien("Adresse du bouton"),
      }),
      signatures: groupe("Signatures (auteurs)", {
        title: texte("Titre"),
        accent: accent(),
        lede: texte("Introduction"),
        cta: texte("Texte du bouton"),
        lien: lien("Adresse du bouton"),
      }),
      lettre: groupe("Invitation à s'abonner : fond et flux RSS", {
        image: media({ label: "Photo de fond", genre: "image", description: "Vide : celle du thème." }),
        lienFlux: lien("Adresse du bouton du flux RSS"),
      }),
    },
  });

export const accueilFr = textesDeLAccueil("fr", "Accueil : textes (français)");
export const accueilEn = textesDeLAccueil("en", "Accueil : textes (anglais)");

/** L'ordre et la visibilité des blocs, commun aux deux langues. */
export const dispositionAccueil = singleton({
  label: "Accueil : ordre des blocs",
  path: "src/donnees/accueil-disposition",
  format: { data: "json" },
  schema: {
    blocs: fields.array(
      fields.object({
        bloc: fields.select({
          label: "Bloc",
          options: BLOCS_ACCUEIL.map((b) => ({ label: b.label, value: b.slug })),
          defaultValue: "hero",
        }),
        visible: fields.checkbox({ label: "Afficher ce bloc", defaultValue: true }),
      }),
      {
        label: "Blocs de la page d'accueil, de haut en bas",
        description:
          "Glissez-déposez pour changer l'ordre. Décochez « Afficher » pour masquer un bloc sans le perdre. Un bloc supprimé de la liste n'apparaît plus.",
        itemLabel: (props) => libelleDuBloc(props.fields.bloc.value) + (props.fields.visible.value ? "" : " (masqué)"),
      },
    ),
  },
});
