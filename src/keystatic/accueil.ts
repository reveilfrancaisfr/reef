// src/keystatic/accueil.ts - les formulaires Keystatic de la page d'accueil : un singleton de textes par langue, un singleton pour l'ordre et la visibilite des blocs.
//
// Tout champ laisse vide retombe sur le texte d'origine du theme : on ne
// casse donc rien en ne remplissant que ce qu'on veut changer.
import { fields, singleton } from "@keystatic/core";

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

/** Les textes de l'accueil pour une langue. */
const textesDeLAccueil = (langue: "fr" | "en", label: string) =>
  singleton({
    label,
    path: `src/donnees/accueil-${langue}`,
    format: { data: "json" },
    schema: {
      metaTitre: fields.text({ label: "Titre de la page (onglet du navigateur et Google)", description: VIDE }),
      metaDescription: fields.text({ label: "Description de la page (Google)", multiline: true, description: VIDE }),
      accroche: fields.text({ label: "Ouverture : ligne d'accroche au-dessus du titre", description: VIDE }),
      titre: fields.text({ label: "Ouverture : titre", multiline: true, description: VIDE }),
      motAccentue: fields.text({
        label: "Ouverture : mot mis en valeur dans le titre",
        description: "Il doit apparaître tel quel dans le titre. " + VIDE,
      }),
      chapeau: fields.text({ label: "Ouverture : texte d'introduction", multiline: true, description: VIDE }),
      boutonPrincipal: fields.text({ label: "Ouverture : texte du bouton principal", description: VIDE }),
      lienPrincipal: fields.text({ label: "Ouverture : adresse du bouton principal", description: "Exemple : /blog/. " + VIDE }),
      boutonSecondaire: fields.text({ label: "Ouverture : texte du bouton secondaire", description: VIDE }),
      lienSecondaire: fields.text({ label: "Ouverture : adresse du bouton secondaire", description: "Exemple : /about/. " + VIDE }),
      compteurs: fields.array(fields.text({ label: "Libellé" }), {
        label: "Ouverture : libellés des trois compteurs (notes, sujets, langues)",
        description: "Dans cet ordre. " + VIDE,
        itemLabel: (props) => props.value,
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
