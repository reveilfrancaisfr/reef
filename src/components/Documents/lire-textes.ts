// src/components/Documents/lire-textes.ts - lit les textes saisis dans Keystatic (« Documents joints : textes »), sinon ceux du thème.
//
// Les formulaires s'enregistrent dans src/donnees/documents-fr.json et documents-en.json. La lecture est
// synchrone (import.meta.glob) : un champ vide ou un fichier absent garde le texte par défaut.
import { TEXTES_PAR_DEFAUT, type TextesDocuments } from "./textes";

const FICHIERS = import.meta.glob<Partial<TextesDocuments>>("/src/donnees/documents-*.json", {
  eager: true,
  import: "default",
});

export function lireTextesDocuments(locale: string): TextesDocuments {
  const langue = locale === "fr" ? "fr" : "en";
  const base = TEXTES_PAR_DEFAUT[langue];
  const cle = Object.keys(FICHIERS).find((chemin) => chemin.endsWith(`/documents-${langue}.json`));
  const saisi = (cle ? FICHIERS[cle] : undefined) ?? {};
  const texte = { ...base };
  for (const nom of Object.keys(base) as (keyof TextesDocuments)[]) {
    const valeur = saisi[nom];
    if (typeof valeur === "string" && valeur.trim() !== "") texte[nom] = valeur;
  }
  return texte;
}
