// src/keystatic/pages-libres.ts - la collection "Pages libres" de Keystatic : une page = une liste de blocs ordonnes, chacun avec son formulaire et son apparence.
//
// Chaque type de bloc a son composant dans src/components/Blocs/ ; le nom de la
// cle (entete, texte, texteImage...) est celui que Blocs.astro associe a ce
// composant. Ajouter un bloc, c'est ajouter ici sa definition et la-bas son
// composant, rien d'autre.
import { collection, fields } from "@keystatic/core";
import { media } from "./champ-media";

const ADRESSES =
  "Une page du site : /blog/ en anglais, /fr/blog/ en français. Une page libre : /p/son-adresse/. Un autre site : l'adresse complète, https://…";

/** Un code de couleur #RRGGBB (le seul format accepte : pas de nom, pas de rgb()). */
const couleurPerso = (label: string, defaut = "#1f9d8a") =>
  fields.text({
    label,
    description: "Un code de couleur à 6 chiffres, par exemple #1F9D8A.",
    defaultValue: defaut,
    validation: { pattern: { regex: /^#[0-9a-fA-F]{6}$/, message: "Un code à 6 chiffres, par exemple #1F9D8A" } },
  });

const adresse = (label = "Adresse du lien") => fields.text({ label, description: ADRESSES });

const paragraphes = (label = "Paragraphes") =>
  fields.array(fields.text({ label: "Paragraphe", multiline: true }), {
    label,
    description: "Un élément par paragraphe. Pour le style : **gras**, *italique*, [texte du lien](/adresse/).",
    itemLabel: (props) => props.value.slice(0, 60) || "(vide)",
  });

/** Une image de la mediatheque (scripts/mediatheque.mjs) : vignettes a choisir, televersement, adresse /medias/… */
const image = (label = "Image") => media({ label, genre: "image" });

/* ------------------------------------------------------------------ apparence commune */

const fond = () =>
  fields.conditional(
    fields.select({
      label: "Fond du bloc",
      options: [
        { label: "Celui du thème (aucun)", value: "theme" },
        { label: "Surface (fond doux)", value: "surface" },
        { label: "Couleur principale du thème", value: "primaire" },
        { label: "Sombre", value: "sombre" },
        { label: "Blanc", value: "blanc" },
        { label: "Couleur personnalisée", value: "perso" },
        { label: "Dégradé", value: "degrade" },
        { label: "Image de fond", value: "image" },
      ],
      defaultValue: "theme",
    }),
    {
      theme: fields.empty(),
      surface: fields.empty(),
      primaire: fields.empty(),
      sombre: fields.empty(),
      blanc: fields.empty(),
      perso: couleurPerso("Couleur du fond"),
      image: fields.object({
        fichier: image("Image de fond"),
        voile: fields.select({
          label: "Voile sombre sur l'image (pour lire le texte)",
          options: [
            { label: "Aucun", value: "aucun" },
            { label: "Léger", value: "leger" },
            { label: "Moyen", value: "moyen" },
            { label: "Fort", value: "fort" },
          ],
          defaultValue: "moyen",
        }),
        position: fields.select({
          label: "Cadrage",
          options: [
            { label: "Centré", value: "centre" },
            { label: "Vers le haut", value: "haut" },
            { label: "Vers le bas", value: "bas" },
          ],
          defaultValue: "centre",
        }),
      }),
      degrade: fields.object({
        de: couleurPerso("Couleur de départ", "#1f9d8a"),
        a: couleurPerso("Couleur d'arrivée", "#0b3b5c"),
        angle: fields.select({
          label: "Direction",
          options: [
            { label: "Vers le bas", value: "180" },
            { label: "Vers la droite", value: "90" },
            { label: "En diagonale", value: "135" },
          ],
          defaultValue: "135",
        }),
      }),
    },
  );

const couleurDuTexte = () =>
  fields.conditional(
    fields.select({
      label: "Couleur du texte",
      options: [
        { label: "Automatique (lisible sur le fond)", value: "auto" },
        { label: "Claire", value: "clair" },
        { label: "Sombre", value: "sombre" },
        { label: "Personnalisée", value: "perso" },
      ],
      defaultValue: "auto",
    }),
    { auto: fields.empty(), clair: fields.empty(), sombre: fields.empty(), perso: couleurPerso("Couleur du texte", "#0b1220") },
  );

const couleurDAccent = () =>
  fields.conditional(
    fields.select({
      label: "Couleur d'accent (boutons, filets, mot mis en valeur)",
      options: [
        { label: "Celle du thème", value: "theme" },
        { label: "Personnalisée", value: "perso" },
      ],
      defaultValue: "theme",
    }),
    { theme: fields.empty(), perso: couleurPerso("Couleur d'accent") },
  );

const separateur = (label: string) =>
  fields.select({
    label,
    options: [
      { label: "Aucun (bord droit)", value: "aucun" },
      { label: "Diagonale", value: "diagonale" },
      { label: "Courbe", value: "courbe" },
      { label: "Vague", value: "vague" },
    ],
    defaultValue: "aucun",
  });

const apparence = () =>
  fields.object(
    {
      fond: fond(),
      texte: couleurDuTexte(),
      accent: couleurDAccent(),
      police: fields.select({
        label: "Police des titres",
        options: [
          { label: "Police du thème", value: "theme" },
          { label: "Police du texte courant", value: "texte" },
          { label: "Serif classique", value: "serif" },
          { label: "Machine à écrire (monospace)", value: "mono" },
        ],
        defaultValue: "theme",
      }),
      largeur: fields.select({
        label: "Largeur et forme",
        options: [
          { label: "Large (comme le reste du site)", value: "large" },
          { label: "Colonne de lecture (étroite)", value: "colonne" },
          { label: "Bord à bord", value: "pleine" },
          { label: "Boîte arrondie dans la page", value: "carte" },
        ],
        defaultValue: "large",
      }),
      coins: fields.select({
        label: "Coins (images, cartes, boîte)",
        options: [
          { label: "Droits", value: "droits" },
          { label: "Arrondis", value: "arrondis" },
          { label: "Très arrondis", value: "tres" },
        ],
        defaultValue: "arrondis",
      }),
      separateurHaut: separateur("Forme du bord du haut"),
      separateurBas: separateur("Forme du bord du bas"),
      espacement: fields.select({
        label: "Espace au-dessus et en dessous",
        options: [
          { label: "Serré", value: "compact" },
          { label: "Normal", value: "normal" },
          { label: "Aéré", value: "aere" },
        ],
        defaultValue: "normal",
      }),
      alignement: fields.select({
        label: "Alignement du texte",
        options: [
          { label: "À gauche", value: "gauche" },
          { label: "Centré", value: "centre" },
        ],
        defaultValue: "gauche",
      }),
      animation: fields.select({
        label: "Animation à l'apparition",
        options: [
          { label: "Aucune", value: "aucune" },
          { label: "Fondu", value: "fondu" },
          { label: "Monte doucement", value: "monter" },
          { label: "Zoom léger", value: "zoom" },
          { label: "Arrive de la gauche", value: "gauche" },
          { label: "Arrive de la droite", value: "droite" },
        ],
        defaultValue: "monter",
      }),
      delai: fields.select({
        label: "Délai avant l'animation",
        options: [
          { label: "Aucun", value: "0" },
          { label: "Court", value: "150" },
          { label: "Moyen", value: "300" },
          { label: "Long", value: "600" },
        ],
        defaultValue: "0",
      }),
    },
    { label: "Apparence et animation" },
  );

const bouton = (label: string) =>
  fields.object(
    {
      texte: fields.text({ label: "Texte du bouton", description: "Laisser vide : pas de bouton." }),
      lien: adresse(),
      style: fields.select({
        label: "Style",
        options: [
          { label: "Principal (couleur d'accent)", value: "primary" },
          { label: "Sombre", value: "dark" },
          { label: "Contour", value: "outline" },
          { label: "Blanc (sur fond sombre)", value: "hero" },
          { label: "Discret", value: "ghost" },
        ],
        defaultValue: "primary",
      }),
      taille: fields.select({
        label: "Taille",
        options: [
          { label: "Moyen", value: "md" },
          { label: "Grand", value: "lg" },
        ],
        defaultValue: "md",
      }),
      nouvelOnglet: fields.checkbox({ label: "Ouvrir dans un nouvel onglet", defaultValue: false }),
    },
    { label },
  );

/** Surtitre, titre, mot accentue et introduction : l'en-tete d'une section, commun a plusieurs blocs. */
const enTeteDeSection = () => ({
  surtitre: fields.text({ label: "Surtitre (petit intitulé au-dessus du titre)" }),
  titre: fields.text({ label: "Titre", multiline: true }),
  motAccentue: fields.text({ label: "Mot mis en valeur dans le titre", description: "Il doit apparaître tel quel dans le titre." }),
  introduction: fields.text({ label: "Introduction (sous le titre)", multiline: true }),
});

/* ------------------------------------------------------------------ les blocs */

export const BLOCS_LIBRES = {
  entete: {
    label: "En-tête de page",
    schema: fields.object({
      accroche: fields.text({ label: "Accroche (petit intitulé au-dessus du titre)" }),
      titre: fields.text({ label: "Titre", multiline: true, description: "Vide : le titre de la page." }),
      motAccentue: fields.text({ label: "Mot mis en valeur dans le titre", description: "Il doit apparaître tel quel dans le titre." }),
      introduction: fields.text({ label: "Introduction", multiline: true }),
      alignement: fields.select({
        label: "Alignement",
        options: [
          { label: "À gauche", value: "gauche" },
          { label: "Centré", value: "centre" },
        ],
        defaultValue: "gauche",
      }),
      filAriane: fields.checkbox({ label: "Afficher le fil d'Ariane", defaultValue: true }),
      apparence: apparence(),
    }),
  },
  texte: {
    label: "Texte",
    schema: fields.object({ ...enTeteDeSection(), paragraphes: paragraphes(), apparence: apparence() }),
  },
  texteImage: {
    label: "Texte et image côte à côte",
    schema: fields.object({
      ...enTeteDeSection(),
      paragraphes: paragraphes(),
      bouton: bouton("Bouton (facultatif)"),
      image: media({ label: "Image ou vidéo", genre: "tous" }),
      description: fields.text({ label: "Description de l'image (pour l'accessibilité)" }),
      position: fields.select({
        label: "Place de l'image",
        options: [
          { label: "À droite", value: "droite" },
          { label: "À gauche", value: "gauche" },
        ],
        defaultValue: "droite",
      }),
      forme: fields.select({
        label: "Forme de l'image",
        options: [
          { label: "Suit les coins du bloc", value: "coins" },
          { label: "Rectangle droit", value: "droit" },
          { label: "Cercle", value: "cercle" },
          { label: "Capsule", value: "capsule" },
          { label: "Forme organique", value: "blob" },
        ],
        defaultValue: "coins",
      }),
      ratio: fields.select({
        label: "Proportions de l'image",
        options: [
          { label: "Naturelles", value: "auto" },
          { label: "Paysage 16:9", value: "16 / 9" },
          { label: "Paysage 4:3", value: "4 / 3" },
          { label: "Carré", value: "1 / 1" },
          { label: "Portrait 3:4", value: "3 / 4" },
        ],
        defaultValue: "4 / 3",
      }),
      apparence: apparence(),
    }),
  },
  imageSeule: {
    label: "Image",
    schema: fields.object({
      image: image(),
      description: fields.text({ label: "Description de l'image (pour l'accessibilité)" }),
      legende: fields.text({ label: "Légende affichée sous l'image (facultative)" }),
      lien: adresse("Adresse du lien (facultatif)"),
      taille: fields.select({
        label: "Taille",
        options: [
          { label: "Petite", value: "petite" },
          { label: "Moyenne", value: "moyenne" },
          { label: "Large", value: "large" },
        ],
        defaultValue: "large",
      }),
      forme: fields.select({
        label: "Forme",
        options: [
          { label: "Suit les coins du bloc", value: "coins" },
          { label: "Rectangle droit", value: "droit" },
          { label: "Cercle", value: "cercle" },
          { label: "Capsule", value: "capsule" },
          { label: "Forme organique", value: "blob" },
        ],
        defaultValue: "coins",
      }),
      ratio: fields.select({
        label: "Proportions",
        options: [
          { label: "Naturelles", value: "auto" },
          { label: "Paysage 16:9", value: "16 / 9" },
          { label: "Paysage 4:3", value: "4 / 3" },
          { label: "Carré", value: "1 / 1" },
          { label: "Portrait 3:4", value: "3 / 4" },
        ],
        defaultValue: "auto",
      }),
      apparence: apparence(),
    }),
  },
  video: {
    label: "Vidéo",
    schema: fields.object({
      fichier: media({ label: "Vidéo", genre: "video" }),
      affiche: image("Image affichée avant la lecture (facultative)"),
      description: fields.text({ label: "Description (pour l'accessibilité)" }),
      legende: fields.text({ label: "Légende affichée sous la vidéo (facultative)" }),
      mode: fields.select({
        label: "Lecture",
        options: [
          { label: "Lecteur avec commandes", value: "lecteur" },
          { label: "Ambiance : automatique, sans son, en boucle", value: "ambiance" },
        ],
        defaultValue: "lecteur",
      }),
      taille: fields.select({
        label: "Taille",
        options: [
          { label: "Moyenne", value: "moyenne" },
          { label: "Large", value: "large" },
        ],
        defaultValue: "large",
      }),
      ratio: fields.select({
        label: "Proportions",
        options: [
          { label: "Paysage 16:9", value: "16 / 9" },
          { label: "Paysage 4:3", value: "4 / 3" },
          { label: "Carré", value: "1 / 1" },
          { label: "Vertical 9:16", value: "9 / 16" },
        ],
        defaultValue: "16 / 9",
      }),
      apparence: apparence(),
    }),
  },
  cartes: {
    label: "Liste de cartes",
    schema: fields.object({
      ...enTeteDeSection(),
      cartes: fields.array(
        fields.object({
          titre: fields.text({ label: "Titre de la carte" }),
          texte: fields.text({ label: "Texte", multiline: true }),
          image: image("Image (facultative)"),
          lien: adresse("Adresse du lien (facultatif)"),
        }),
        { label: "Les cartes", itemLabel: (props) => props.fields.titre.value || "(carte)" },
      ),
      colonnes: fields.select({
        label: "Cartes par ligne",
        options: [
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
        defaultValue: "3",
      }),
      numeroter: fields.checkbox({ label: "Numéroter les cartes (01, 02…)", defaultValue: false }),
      styleDesCartes: fields.select({
        label: "Style des cartes",
        options: [
          { label: "Contour", value: "contour" },
          { label: "Remplies", value: "remplie" },
          { label: "Avec ombre", value: "ombre" },
        ],
        defaultValue: "contour",
      }),
      apparence: apparence(),
    }),
  },
  appel: {
    label: "Appel à l'action",
    schema: fields.object({
      titre: fields.text({ label: "Titre", multiline: true }),
      motAccentue: fields.text({ label: "Mot mis en valeur dans le titre" }),
      texte: fields.text({ label: "Texte", multiline: true }),
      principal: bouton("Bouton principal"),
      secondaire: bouton("Second bouton (facultatif)"),
      apparence: apparence(),
    }),
  },
  citation: {
    label: "Citation",
    schema: fields.object({
      texte: fields.text({ label: "La citation", multiline: true }),
      auteur: fields.text({ label: "Auteur" }),
      role: fields.text({ label: "Rôle ou source (facultatif)" }),
      portrait: image("Portrait (facultatif)"),
      taille: fields.select({
        label: "Taille du texte",
        options: [
          { label: "Normale", value: "normale" },
          { label: "Grande", value: "grande" },
        ],
        defaultValue: "grande",
      }),
      apparence: apparence(),
    }),
  },
  articles: {
    label: "Derniers articles du blog",
    schema: fields.object({
      nombre: fields.select({
        label: "Nombre d'articles",
        options: [
          { label: "3", value: "3" },
          { label: "6", value: "6" },
          { label: "9", value: "9" },
        ],
        defaultValue: "3",
      }),
      apparence: apparence(),
    }),
  },
  carrousel: {
    label: "Carrousel d'images",
    schema: fields.object({
      ...enTeteDeSection(),
      images: fields.array(
        fields.object({
          image: image(),
          description: fields.text({ label: "Description (accessibilité)" }),
          legende: fields.text({ label: "Légende affichée (facultative)" }),
          lien: adresse("Adresse du lien (facultatif)"),
        }),
        { label: "Les images", itemLabel: (props) => props.fields.legende.value || props.fields.description.value || "(image)" },
      ),
      visibles: fields.select({
        label: "Images visibles en même temps",
        options: [
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
        ],
        defaultValue: "1",
      }),
      ratio: fields.select({
        label: "Proportions",
        options: [
          { label: "Paysage 16:9", value: "16 / 9" },
          { label: "Paysage 4:3", value: "4 / 3" },
          { label: "Carré", value: "1 / 1" },
          { label: "Portrait 3:4", value: "3 / 4" },
        ],
        defaultValue: "16 / 9",
      }),
      defilementAuto: fields.checkbox({ label: "Défilement automatique", defaultValue: false }),
      duree: fields.select({
        label: "Secondes entre deux images (défilement automatique)",
        options: [
          { label: "3", value: "3" },
          { label: "5", value: "5" },
          { label: "8", value: "8" },
        ],
        defaultValue: "5",
      }),
      fleches: fields.checkbox({ label: "Afficher les flèches", defaultValue: true }),
      points: fields.checkbox({ label: "Afficher les points", defaultValue: true }),
      apparence: apparence(),
    }),
  },
  espace: {
    label: "Espace ou séparateur",
    schema: fields.object({
      hauteur: fields.select({
        label: "Hauteur",
        options: [
          { label: "Petite", value: "s" },
          { label: "Moyenne", value: "m" },
          { label: "Grande", value: "l" },
          { label: "Très grande", value: "xl" },
        ],
        defaultValue: "m",
      }),
      motif: fields.select({
        label: "Motif",
        options: [
          { label: "Vide", value: "vide" },
          { label: "Filet", value: "filet" },
          { label: "Points", value: "points" },
          { label: "Vague", value: "vague" },
        ],
        defaultValue: "vide",
      }),
    }),
  },
} as const;

/* ------------------------------------------------------------------ la collection */

export const pagesLibres = collection({
  label: "Pages libres",
  slugField: "titre",
  path: "src/contenu/pages-libres/*",
  format: { data: "json" },
  columns: ["titre", "langue", "publiee"],
  schema: {
    titre: fields.slug({
      name: { label: "Titre de la page" },
      slug: { label: "Adresse de la page", description: "La page sera sur /p/cette-adresse/ (et /fr/p/cette-adresse/ en français)." },
    }),
    langue: fields.select({
      label: "Langue",
      options: [
        { label: "Français", value: "fr" },
        { label: "Anglais", value: "en" },
      ],
      defaultValue: "fr",
    }),
    publiee: fields.checkbox({ label: "Publier cette page", description: "Décochée, la page reste en brouillon et n'existe pas sur le site.", defaultValue: true }),
    description: fields.text({ label: "Description pour Google", multiline: true }),
    blocs: fields.blocks(BLOCS_LIBRES, {
      label: "Blocs de la page, de haut en bas",
      description:
        "Ajoutez des blocs, réordonnez-les par glisser-déposer. Pour un en-tête avec fil d'Ariane, mettez le bloc « En-tête de page » en premier.",
    }),
  },
});
