// scripts/rechargement-du-contenu.mjs - plugin Vite (developpement seulement) : recharge la page ouverte quand un contenu Keystatic change.
//
// A brancher dans astro.config.mjs :
//   import { rechargementDuContenu } from "./scripts/rechargement-du-contenu.mjs";
//   ... vite: { plugins: [rechargementDuContenu(), ...les autres plugins] }
import { utimesSync } from "node:fs";
import { resolve } from "node:path";

// Recharge la page ouverte quand un contenu Keystatic change (src/donnees, src/contenu,
// images des pages libres). Les pages libres sont listees par getStaticPaths, qu'Astro garde
// en memoire en developpement : sans cette etape, une page creee pendant que le serveur
// tourne repondrait 404 jusqu'au prochain redemarrage.
export function rechargementDuContenu() {
  const route = resolve("src/pages/[...locale]/p/[slug].astro");
  const surveille = ["/src/donnees/", "/src/contenu/", "/public/images/pages-libres/"];
  return {
    name: "reef:rechargement-du-contenu",
    apply: "serve",
    configureServer(serveur) {
      const quandCaChange = (fichier) => {
        const chemin = fichier.replaceAll("\\", "/");
        if (!surveille.some((dossier) => chemin.includes(dossier))) return;
        if (chemin.includes("/src/contenu/pages-libres/")) {
          const maintenant = new Date();
          try {
            utimesSync(route, maintenant, maintenant);
          } catch {
            /* la route n'existe pas dans ce projet : rien a rafraichir */
          }
        }
        serveur.ws.send({ type: "full-reload" });
      };
      serveur.watcher.on("add", quandCaChange);
      serveur.watcher.on("change", quandCaChange);
      serveur.watcher.on("unlink", quandCaChange);
    },
  };
}
