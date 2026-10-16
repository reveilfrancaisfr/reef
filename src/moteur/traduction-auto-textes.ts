// src/moteur/traduction-auto-textes.ts - les textes par defaut du bandeau "page traduite automatiquement".
//
// Un fichier SANS aucun import du systeme : le formulaire Keystatic (src/keystatic/identite-site.ts), qui part dans
// le navigateur, et le lecteur synchrone (src/moteur/identite-keystatic.ts), qui lit des fichiers, le partagent.
// Le bandeau est ecrit dans la langue VERS laquelle la page est traduite : traduire en anglais montre le texte anglais.
export interface TextesDuBandeau {
  avertissement: string;
  original: string;
}

export const TEXTES_PAR_DEFAUT: Record<"fr" | "en", TextesDuBandeau> = {
  fr: {
    avertissement: "Page traduite automatiquement : la traduction peut contenir des erreurs.",
    original: "Voir l'original",
  },
  en: {
    avertissement: "This page was translated automatically: the translation may contain errors.",
    original: "View the original",
  },
};
