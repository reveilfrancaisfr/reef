// src/components/Documents/textes.ts - les textes des boutons des documents joints, en français et en anglais.
//
// Ce sont les textes par défaut : les formulaires Keystatic « Documents joints : textes » en sont pré-remplis,
// et un champ laissé vide retombe sur eux (src/components/Documents/lire-textes.ts).

export interface TextesDocuments {
  titreSection: string;
  consulter: string;
  masquer: string;
  ouvrir: string;
  telecharger: string;
  pleinEcran: string;
  repli: string;
}

export const TEXTES_PAR_DEFAUT: Record<"fr" | "en", TextesDocuments> = {
  fr: {
    titreSection: "Documents",
    consulter: "Consulter",
    masquer: "Masquer",
    ouvrir: "Ouvrir dans un nouvel onglet",
    telecharger: "Télécharger",
    pleinEcran: "Plein écran",
    repli: "Votre appareil n'affiche pas ce document dans la page. Ouvrez-le dans un nouvel onglet.",
  },
  en: {
    titreSection: "Documents",
    consulter: "View",
    masquer: "Hide",
    ouvrir: "Open in a new tab",
    telecharger: "Download",
    pleinEcran: "Full screen",
    repli: "Your device cannot show this document in the page. Open it in a new tab.",
  },
};

/** Message du seul mode développement : le lecteur Word/Excel/PowerPoint de Microsoft lit le fichier en ligne. */
export const REPLI_DEVELOPPEMENT = {
  fr: "Les fichiers Word, Excel et PowerPoint s'affichent ici seulement sur le site publié (le lecteur de Microsoft doit pouvoir télécharger le fichier). Utilisez « Télécharger » pour l'ouvrir en local.",
  en: "Word, Excel and PowerPoint files only display here on the published site (Microsoft's viewer must be able to download the file). Use “Download” to open it locally.",
} as const;
