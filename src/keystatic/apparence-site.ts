// src/keystatic/apparence-site.ts - le formulaire Keystatic "Apparence du site" : couleurs du mode clair et du mode sombre, polices des titres et du texte.
//
// Le formulaire est pre-rempli avec les couleurs ACTUELLES du theme (src/styles/tokens.css) :
// on voit tout de suite ce qui est ou. Rien ne s'applique tant que "Appliquer ces reglages"
// n'est pas coche, et un groupe de couleurs que l'on n'a pas change laisse le theme tranquille.
// Le CSS est calcule dans src/moteur/apparence-site.ts et pose par src/layouts/BaseLayout.astro.
import { fields, singleton } from "@keystatic/core";
import { DEFAUTS, POLICES } from "../moteur/apparence-site";

const couleur = (label: string, description: string, defaut: string) =>
  fields.text({
    label,
    description: `${description} Un code de couleur à 6 chiffres, par exemple ${defaut.toUpperCase()}.`,
    defaultValue: defaut,
    validation: { pattern: { regex: /^#[0-9a-fA-F]{6}$/, message: "Un code à 6 chiffres, par exemple #147EA0" } },
  });

const police = (label: string, description: string) =>
  fields.select({
    label,
    description,
    options: [
      { label: "Celle du thème (aucun changement)", value: "theme" },
      ...Object.entries(POLICES).map(([value, p]) => ({ label: p.label, value })),
    ],
    defaultValue: "theme",
  });

export const apparenceSite = singleton({
  label: "Apparence du site",
  path: "src/donnees/apparence-site",
  format: { data: "json" },
  schema: {
    activer: fields.checkbox({
      label: "Appliquer ces réglages au site",
      description: "Décochée, le site garde exactement l'apparence du thème, quoi que contiennent les champs ci-dessous.",
      defaultValue: false,
    }),
    polices: fields.object(
      {
        titres: police("Police des titres", "Les grands titres de toutes les pages. Le thème utilise Space Grotesk."),
        texte: police("Police du texte", "Les paragraphes, les menus et les boutons. Le thème utilise Instrument Sans."),
      },
      { label: "Polices" },
    ),
    clair: fields.object(
      {
        fond: couleur("Fond de la page", "La couleur de fond des pages.", DEFAUTS.clair.fond),
        texte: couleur("Texte", "La couleur du texte et des titres.", DEFAUTS.clair.texte),
        principale: couleur("Couleur principale", "Les boutons, les filets, le mot mis en valeur dans les titres, les liens.", DEFAUTS.clair.principale),
        accent: couleur("Couleur d'accent", "La seconde couleur, plus rare (rubriques, petites touches).", DEFAUTS.clair.accent),
      },
      { label: "Couleurs du mode clair" },
    ),
    sombre: fields.object(
      {
        fond: couleur("Fond de la page", "La couleur de fond des pages en mode sombre.", DEFAUTS.sombre.fond),
        texte: couleur("Texte", "La couleur du texte et des titres en mode sombre.", DEFAUTS.sombre.texte),
        principale: couleur("Couleur principale", "Les boutons, les filets, le mot mis en valeur dans les titres, les liens.", DEFAUTS.sombre.principale),
        accent: couleur("Couleur d'accent", "La seconde couleur, plus rare (rubriques, petites touches).", DEFAUTS.sombre.accent),
      },
      { label: "Couleurs du mode sombre" },
    ),
  },
});
