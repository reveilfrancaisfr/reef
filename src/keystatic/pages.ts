// src/keystatic/pages.ts - les formulaires Keystatic du site : navigation et pied de page, page "A propos", page "Contact" (un singleton par langue).
//
// Regle commune : un champ laisse vide garde le texte d'origine du theme. Une
// liste (paragraphes, regles, liens...) qui contient au moins un element prend
// la place de celle du theme ; dans une liste, un champ vide d'un element garde
// le texte du theme de meme rang, s'il existe.
//
// Les noms de champs reprennent ceux du dictionnaire du theme (t.about,
// t.contact, t.footer, t.newsletter) : le texte saisi se superpose donc au
// dictionnaire sans aucune table de correspondance.
import { fields, singleton } from "@keystatic/core";

const VIDE = "Laisser vide pour garder le texte d'origine du thème.";
const ADRESSES =
  "Une page du site : /blog/ en anglais, /fr/blog/ en français. Un autre site : l'adresse complète, https://…";

const texte = (label: string, aide?: string) => fields.text({ label, description: aide ? `${aide} ${VIDE}` : VIDE });
const paragraphe = (label: string, aide?: string) =>
  fields.text({ label, multiline: true, description: aide ? `${aide} ${VIDE}` : VIDE });

/** Une liste de textes (paragraphes, etapes...). */
const listeDeTextes = (label: string, aide: string, nom: string) =>
  fields.array(fields.text({ label: nom, multiline: true }), {
    label,
    description: `${aide} Si la liste est vide, celle du thème est conservée.`,
    itemLabel: (props) => props.value.slice(0, 60) || "(vide)",
  });

const lien = fields.object({
  texte: fields.text({ label: "Texte du lien" }),
  lien: fields.text({ label: "Adresse", description: ADRESSES }),
  nouvelOnglet: fields.checkbox({ label: "Ouvrir dans un nouvel onglet", defaultValue: false }),
});

const listeDeLiens = (label: string, aide: string) =>
  fields.array(lien, {
    label,
    description: `${aide} Si la liste est vide, celle du thème est conservée.`,
    itemLabel: (props) => props.fields.texte.value || "(lien sans texte)",
  });

/* ---------------------------------------------------------------- Navigation et pied de page */

const schemaDuSite = () => ({
  navigation: fields.object(
    {
      principal: listeDeLiens("Rubriques de la barre du haut", "Dans l'ordre d'affichage."),
      tiroir: listeDeLiens("Rubriques en plus dans le menu mobile", "Elles s'ajoutent après les rubriques de la barre."),
      boutonTexte: texte("Texte du bouton de la barre (par défaut : S'abonner)"),
      lienBouton: texte("Adresse du bouton de la barre", "Par défaut : #newsletter, l'inscription en bas de page."),
    },
    { label: "Barre de navigation" },
  ),
  colonnes: fields.array(
    fields.object({
      titre: texte("Titre de la colonne"),
      liens: listeDeLiens("Liens de la colonne", "Dans l'ordre d'affichage."),
    }),
    {
      label: "Pied de page : colonnes de liens",
      description: "Dans l'ordre : première, deuxième, troisième colonne du thème. Une colonne vide garde celle du thème.",
      itemLabel: (props) => props.fields.titre.value || "(colonne du thème)",
    },
  ),
  footer: fields.object(
    {
      tagline: paragraphe("Phrase de présentation sous le logo"),
      rights: texte("Mention de droits", "Elle suit « © année nom du site »."),
      builtWith: texte("Ligne « construit avec »"),
      themeBy: texte("Crédit du thème"),
      backToTop: texte("Bouton « Retour en haut »"),
    },
    { label: "Pied de page : textes" },
  ),
  newsletter: fields.object(
    {
      title: texte("Titre"),
      accent: texte("Mot mis en valeur dans le titre", "Il doit apparaître tel quel dans le titre."),
      lede: paragraphe("Texte d'introduction"),
      placeholder: texte("Texte d'exemple du champ e-mail"),
      submit: texte("Texte du bouton"),
      note: texte("Note sous le formulaire"),
    },
    { label: "Lettre d'information (dans le pied de page)" },
  ),
});

const siteDe = (langue: "fr" | "en", label: string) =>
  singleton({ label, path: `src/donnees/site-${langue}`, format: { data: "json" }, schema: schemaDuSite() });

export const siteFr = siteDe("fr", "Navigation et pied de page (français)");
export const siteEn = siteDe("en", "Navigation et pied de page (anglais)");

/* ---------------------------------------------------------------- Page A propos */

const schemaAPropos = () => ({
  metaTitle: texte("Titre de la page (onglet du navigateur et Google)"),
  metaDescription: paragraphe("Description de la page (Google)"),
  eyebrow: texte("Ouverture : ligne d'accroche"),
  title: paragraphe("Ouverture : titre"),
  accent: texte("Ouverture : mot mis en valeur dans le titre", "Il doit apparaître tel quel dans le titre."),
  lede: paragraphe("Ouverture : introduction"),
  crumb: texte("Fil d'Ariane : nom de la page"),
  storyTitle: paragraphe("Histoire : titre"),
  storyAccent: texte("Histoire : mot mis en valeur", "Il doit apparaître tel quel dans le titre."),
  storyParagraphs: listeDeTextes("Histoire : paragraphes", "Un élément par paragraphe.", "Paragraphe"),
  valuesTitle: paragraphe("Règles de travail : titre"),
  valuesAccent: texte("Règles de travail : mot mis en valeur", "Il doit apparaître tel quel dans le titre."),
  valuesLede: paragraphe("Règles de travail : introduction"),
  values: fields.array(
    fields.object({
      title: fields.text({ label: "Titre de la règle" }),
      text: fields.text({ label: "Texte de la règle", multiline: true }),
    }),
    {
      label: "Règles de travail : la liste",
      description: "Une règle par élément, numérotées automatiquement. Si la liste est vide, celle du thème est conservée.",
      itemLabel: (props) => props.fields.title.value || "(règle)",
    },
  ),
  writersTitle: paragraphe("Signatures : titre"),
  writersAccent: texte("Signatures : mot mis en valeur", "Il doit apparaître tel quel dans le titre."),
  writersLede: paragraphe("Signatures : introduction"),
  writersCta: texte("Signatures : texte du bouton"),
  contactTitle: paragraphe("Invitation à nous écrire : titre"),
  contactLede: paragraphe("Invitation à nous écrire : texte"),
  contactCta: texte("Invitation à nous écrire : texte du bouton"),
});

const aProposDe = (langue: "fr" | "en", label: string) =>
  singleton({ label, path: `src/donnees/a-propos-${langue}`, format: { data: "json" }, schema: schemaAPropos() });

export const aProposFr = aProposDe("fr", "Page À propos (français)");
export const aProposEn = aProposDe("en", "Page À propos (anglais)");

/* ---------------------------------------------------------------- Page Contact */

const schemaContact = () => ({
  metaTitle: texte("Titre de la page (onglet du navigateur et Google)"),
  metaDescription: paragraphe("Description de la page (Google)"),
  eyebrow: texte("Ouverture : ligne d'accroche"),
  title: paragraphe("Ouverture : titre"),
  accent: texte("Ouverture : mot mis en valeur dans le titre", "Il doit apparaître tel quel dans le titre."),
  lede: paragraphe("Ouverture : introduction"),
  crumb: texte("Fil d'Ariane : nom de la page"),
  directTitle: texte("Bloc « écrire directement » : titre"),
  directLede: paragraphe("Bloc « écrire directement » : texte"),
  directCta: texte("Bloc « écrire directement » : texte du bouton"),
  nextTitle: texte("Bloc « et ensuite » : titre"),
  nextSteps: listeDeTextes("Bloc « et ensuite » : les étapes", "Une étape par élément, numérotées automatiquement.", "Étape"),
});

const contactDe = (langue: "fr" | "en", label: string) =>
  singleton({ label, path: `src/donnees/contact-${langue}`, format: { data: "json" }, schema: schemaContact() });

export const contactFr = contactDe("fr", "Page Contact (français)");
export const contactEn = contactDe("en", "Page Contact (anglais)");

/* ---------------------------------------------------------------- Pages juridiques */

// Les trois documents (mentions legales, confidentialite, conditions) ont la meme
// forme : un titre, une introduction, une date de revision et des clauses.
const schemaJuridique = () => ({
  title: texte("Titre de la page"),
  description: paragraphe("Introduction (sous le titre et pour Google)"),
  lastUpdated: fields.date({
    label: "Date de dernière mise à jour",
    description: "Affichée en haut du document. Vide, la date du thème est conservée.",
  }),
  sections: fields.array(
    fields.object({
      title: fields.text({ label: "Titre de la clause" }),
      body: fields.text({
        label: "Texte de la clause",
        multiline: true,
        description: "Un seul paragraphe : les retours à la ligne ne créent pas de nouveau paragraphe.",
      }),
    }),
    {
      label: "Clauses, dans l'ordre",
      description:
        "Une clause par élément ; le sommaire en haut de page se construit à partir des titres. Si la liste est vide, celle du thème est conservée.",
      itemLabel: (props) => props.fields.title.value || "(clause)",
    },
  ),
});

const juridiqueDe = (document: string, langue: "fr" | "en", label: string) =>
  singleton({ label, path: `src/donnees/${document}-${langue}`, format: { data: "json" }, schema: schemaJuridique() });

export const mentionsFr = juridiqueDe("mentions", "fr", "Mentions légales (français)");
export const mentionsEn = juridiqueDe("mentions", "en", "Mentions légales (anglais)");
export const confidentialiteFr = juridiqueDe("confidentialite", "fr", "Politique de confidentialité (français)");
export const confidentialiteEn = juridiqueDe("confidentialite", "en", "Politique de confidentialité (anglais)");
export const conditionsFr = juridiqueDe("conditions", "fr", "Conditions d'utilisation (français)");
export const conditionsEn = juridiqueDe("conditions", "en", "Conditions d'utilisation (anglais)");
