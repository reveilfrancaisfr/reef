// src/keystatic/articles.ts - les collections Keystatic des articles, des auteurs et des sujets : elles ecrivent la ou le site lit (src/data/), dans le format de src/content.config.ts.
//
// Un article est un fichier Markdown (.md) dans src/data/posts/<langue>/, avec son en-tete.
// Le site exige un auteur et un sujet qui existent (ils sont verifies a la construction) :
// les listes deroulantes sont donc construites depuis les fichiers de src/data/authors/<langue>/
// et src/data/topics/<langue>/, et enregistrent l'identifiant que le site attend ("fr/mara-lindqvist").
// Ajouter un auteur ou un sujet dans Keystatic suffit : la liste se remet a jour au rechargement.
import { collection, fields } from "@keystatic/core";

type Langue = "fr" | "en";
type Fiche = { name?: string };

/** Les entrees d'un dossier de src/data, en options de liste deroulante : libelle = nom, valeur = "langue/fichier". */
const options = (fichiers: Record<string, Fiche>, langue: Langue) => {
  const liste = Object.entries(fichiers)
    .map(([chemin, fiche]) => {
      const slug = (chemin.split("/").pop() ?? "").replace(/\.json$/, "");
      return { label: fiche?.name || slug, value: `${langue}/${slug}` };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  // Un dossier vide ne doit pas faire tomber l'interface : une option qui dit quoi faire.
  return liste.length > 0 ? liste : [{ label: "(aucune entrée : en créer une d'abord)", value: `${langue}/` }];
};

const AUTEURS = {
  fr: options(import.meta.glob<Fiche>("../data/authors/fr/*.json", { eager: true, import: "default" }), "fr"),
  en: options(import.meta.glob<Fiche>("../data/authors/en/*.json", { eager: true, import: "default" }), "en"),
};
const SUJETS = {
  fr: options(import.meta.glob<Fiche>("../data/topics/fr/*.json", { eager: true, import: "default" }), "fr"),
  en: options(import.meta.glob<Fiche>("../data/topics/en/*.json", { eager: true, import: "default" }), "en"),
};

const articlesDe = (langue: Langue, label: string) =>
  collection({
    label,
    slugField: "title",
    path: `src/data/posts/${langue}/*`,
    format: { contentField: "content" },
    entryLayout: "content",
    columns: ["title", "pubDate"],
    schema: {
      title: fields.slug({
        name: { label: "Titre" },
        slug: { label: "Adresse de l'article", description: `L'article sera sur ${langue === "fr" ? "/fr" : ""}/blog/cette-adresse/` },
      }),
      description: fields.text({
        label: "Résumé (cartes, recherche et Google)",
        multiline: true,
        validation: { isRequired: true },
      }),
      pubDate: fields.date({ label: "Date de publication", validation: { isRequired: true } }),
      updatedDate: fields.date({
        label: "Revu le (facultatif)",
        description: "À remplir seulement si l'article a été revu après sa publication : le site affiche alors les deux dates.",
      }),
      author: fields.select({ label: "Auteur", options: AUTEURS[langue], defaultValue: AUTEURS[langue][0].value }),
      topic: fields.select({ label: "Sujet", options: SUJETS[langue], defaultValue: SUJETS[langue][0].value }),
      tags: fields.array(fields.text({ label: "Étiquette" }), {
        label: "Étiquettes",
        itemLabel: (props) => props.value || "(vide)",
      }),
      cover: fields.image({
        label: "Image de couverture",
        directory: "src/assets/covers",
        publicPath: "../../../assets/covers/",
      }),
      coverAlt: fields.text({ label: "Description de l'image (accessibilité)", multiline: true }),
      featured: fields.checkbox({
        label: "Article à la une",
        description: "Un seul par langue : l'accueil prend le premier trouvé, sinon le plus récent.",
        defaultValue: false,
      }),
      draft: fields.checkbox({
        label: "Brouillon",
        description: "Un brouillon sort des listes, du flux RSS, du plan du site et de la recherche.",
        defaultValue: false,
      }),
      content: fields.markdoc({
        label: "Texte de l'article",
        extension: "md",
        // Les images collees dans le texte vont dans public/medias/articles/ et s'appellent par leur adresse publique.
        options: { image: { directory: "public/medias/articles", publicPath: "/medias/articles/" } },
      }),
    },
  });

const auteursDe = (langue: Langue, label: string) =>
  collection({
    label,
    slugField: "name",
    path: `src/data/authors/${langue}/*`,
    format: { data: "json" },
    schema: {
      name: fields.slug({ name: { label: "Nom" } }),
      role: fields.text({ label: "Rôle", validation: { isRequired: true } }),
      bio: fields.text({ label: "Biographie", multiline: true, validation: { isRequired: true } }),
      avatar: fields.image({
        label: "Portrait (facultatif)",
        directory: "src/assets/auteurs",
        publicPath: "../../../assets/auteurs/",
      }),
      links: fields.array(
        fields.object({
          label: fields.text({ label: "Nom du lien", validation: { isRequired: true } }),
          href: fields.url({ label: "Adresse complète (https://…)", validation: { isRequired: true } }),
        }),
        { label: "Liens", itemLabel: (props) => props.fields.label.value || "(lien)" },
      ),
    },
  });

const sujetsDe = (langue: Langue, label: string) =>
  collection({
    label,
    slugField: "name",
    path: `src/data/topics/${langue}/*`,
    format: { data: "json" },
    schema: {
      name: fields.slug({ name: { label: "Nom du sujet" } }),
      description: fields.text({ label: "Description (la page du sujet)", multiline: true, validation: { isRequired: true } }),
      accent: fields.select({
        label: "Couleur d'accent",
        options: [
          { label: "Corail", value: "coral" },
          { label: "Récif (turquoise)", value: "reef" },
          { label: "Encre (bleu sombre)", value: "ink" },
        ],
        defaultValue: "reef",
      }),
      order: fields.integer({
        label: "Ordre d'affichage",
        description: "Les petits nombres passent d'abord.",
        defaultValue: 0,
        validation: { isRequired: true },
      }),
    },
  });

export const articlesFr = articlesDe("fr", "Articles (français)");
export const articlesEn = articlesDe("en", "Articles (anglais)");
export const ficheAuteurFr = auteursDe("fr", "Auteurs (français)");
export const ficheAuteurEn = auteursDe("en", "Auteurs (anglais)");
export const ficheSujetFr = sujetsDe("fr", "Sujets (français)");
export const ficheSujetEn = sujetsDe("en", "Sujets (anglais)");
