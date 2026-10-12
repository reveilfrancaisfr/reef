// src/keystatic/identite-site.ts - le formulaire Keystatic "Identité du site" : le nom, le logo et le logo du mode sombre.
//
// Le nom est pré-rempli avec celui du thème (src/config/siteData.json.ts). Les deux logos sont vides :
// tant qu'aucun logo n'est choisi, la barre, le tiroir mobile et le pied de page gardent la vague du thème.
// Sans logo du mode sombre, le logo principal sert aussi sur fond sombre.
// Lecture : src/moteur/identite-keystatic.ts (synchrone), branchée dans src/moteur/theme.ts.
import { fields, singleton } from "@keystatic/core";
import siteData from "../config/siteData.json";

export const identiteSite = singleton({
  label: "Identité du site",
  path: "src/donnees/identite-site",
  format: { data: "json" },
  schema: {
    nom: fields.text({
      label: "Nom du site",
      description:
        "Affiché à côté du logo dans la barre, dans le tiroir mobile, dans le pied de page et dans le titre des pages. Vide : le nom du thème.",
      defaultValue: siteData.name,
    }),
    logo: fields.image({
      label: "Logo",
      description:
        "Remplace la vague dans la barre, le tiroir mobile et le pied de page. Un PNG, WebP ou SVG à fond transparent, plutôt large que haut. Il est affiché à 1,5 rem de haut, sa largeur suit. Vide : la vague du thème.",
      directory: "public/medias",
      publicPath: "/medias/",
    }),
    logoSombre: fields.image({
      label: "Logo du mode sombre",
      description:
        "Facultatif : la version du logo lisible sur fond sombre (par exemple en blanc). Vide : le logo ci-dessus sert aussi en mode sombre.",
      directory: "public/medias",
      publicPath: "/medias/",
    }),
  },
});