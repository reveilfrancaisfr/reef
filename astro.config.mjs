// @ts-check
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import keystatic from "@keystatic/astro";
import { defineConfig } from "astro/config";
import { moteur, MOTEUR_ACTIF } from "./moteur.config.mjs";
import { existsSync, readdirSync, readFileSync, renameSync, rmdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Moteur allume, l'adapter range les pages figees sous dist/client/ ; sans ce
// detour, le plan de site ne retrouvait plus leur head et perdait ses x-default.
const DIST = fileURLToPath(new URL(MOTEUR_ACTIF ? "./dist/client/" : "./dist/", import.meta.url));

// Lit les hreflang que la page construite porte deja : le head est la seule
// source, le plan de site ne peut donc plus le contredire. L'integration
// sitemap appariait les langues par identite de chemin et n'ecrivait aucun
// x-default, alors que le head en porte un sur chaque page ; `serialize` est
// appele apres le build, donc dist/ existe et on y relit la verite.
function hreflangDuHtml(/** @type {string} */ pathname) {
  // "/fr/about/" devient "fr/about/", et la racine "/" devient "" : le chemin
  // se colle a DIST sans doubler le separateur.
  const relatif = pathname.replace(/^\/+/, "");
  const fichier = `${DIST}${relatif === "" || relatif.endsWith("/") ? relatif : `${relatif}/`}index.html`;
  let html = "";
  try {
    html = readFileSync(fichier, "utf8");
  } catch {
    return [];
  }
  const links = [];
  const motif = /<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/?>/g;
  for (const m of html.matchAll(motif)) links.push({ lang: m[1], url: m[2] });
  return links;
}

// L'adresse publique du site, ecrite une fois : `site` la donne a Astro, et le
// plan de site du moteur (moteur allume seulement) en tire son adresse absolue.
const SITE = "https://reef.alohapixel.app";

// LA PAGE INTROUVABLE DE CHAQUE LANGUE. src/pages/[locale]/404.astro sort en
// fr/404/index.html, comme toute page ; un hebergeur statique (et Cloudflare,
// dans wrangler.toml comme derriere le Worker du moteur) cherche le 404.html
// le plus proche de l'adresse demandee. On la range donc en fr/404.html, au
// build, dans les deux modes : `dir` est le dossier des fichiers servis.
/** @returns {import("astro").AstroIntegration} */
function pagesIntrouvables() {
  return {
    name: "reef:pages-introuvables",
    hooks: {
      "astro:build:done": ({ dir }) => {
        for (const entree of readdirSync(dir, { withFileTypes: true })) {
          if (!entree.isDirectory()) continue;
          const page = new URL(`${entree.name}/404/index.html`, dir);
          if (!existsSync(page)) continue;
          renameSync(page, new URL(`${entree.name}/404.html`, dir));
          rmdirSync(new URL(`${entree.name}/404/`, dir));
        }
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // Alimente canonical, OG, sitemap, robots.txt et llms.txt. Une seule edition les corrige tous.
  site: SITE,

  // Une seule forme d'URL canonique : le build en repertoires emet un slash final, et
  // canonical + OG s'accordent sur cette forme.
  trailingSlash: "ignore",

  // Pas d'adapter PAR DEFAUT, volontairement : le theme compile en HTML 100%
  // statique et n'impose aucun hebergeur a son utilisateur. Le moteur de
  // publication (ALOHA_MOTEUR=emdash) pose l'adapter Cloudflare et ne rend a
  // la demande QUE les pages qu'il gere ; tout le reste demeure prerendu.
  ...moteur.config,
  security: { checkOrigin: true },

  // Routage bilingue. L'anglais est servi a la racine (/, /about/), le francais
  // sous /fr/. prefixDefaultLocale: false est ce qui evite un /en/ inutile dans
  // les URLs. La liste vit dans src/i18n/config.ts, une seule source de verite.
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
  },

  integrations: [
    pagesIntrouvables(),
    ...moteur.integrations,
    mdx(),
    react(),
    keystatic(),
    sitemap({
      // Moteur allume, les pages gerees ont leur propre plan, rendu a la
      // demande : l'index le declare. Moteur eteint, la liste est vide.
      customSitemaps: moteur.plans.map((plan) => new URL(plan, SITE).href),
      // La recherche (/search/, /fr/search/) part en noindex et robots.txt
      // l'interdit : un plan de site ne propose pas une page qu'on demande de
      // ne pas indexer. Le plan du moteur (src/moteur/plan-du-site.ts) garde
      // les memes exclusions.
      filter: (page) => !["/404/", "/examples/", "/search/"].some((p) => page.includes(p)),
      // Le sitemap porte les memes alternatives que les balises hreflang du
      // head : Google recoupe les deux, et un desaccord fait ignorer les deux.
      i18n: { defaultLocale: "en", locales: { en: "en", fr: "fr" } },
      // Quand la page construite porte ses hreflang, ce sont eux (x-default
      // compris) qui vont dans le plan de site ; sinon l'appariement de
      // l'integration reste. Une page sans jumelle ne declare que son head.
      serialize(item) {
        const links = hreflangDuHtml(new URL(item.url).pathname);
        return links.length > 1 ? { ...item, links } : item;
      },
    }),
  ],

  markdown: {
    shikiConfig: {
      themes: { light: "github-light-high-contrast", dark: "github-dark-default" },
      wrap: true,
    },
  },

  build: { inlineStylesheets: "always" },

  vite: {
    plugins: [tailwindcss()],
optimizeDeps: {
  include: [
  '@keystatic/core',
  '@keystatic/astro/ui',
  'lodash/debounce',
  'lodash/throttle',
  'direction',
  'use-sync-external-store/shim/index.js',
  'is-hotkey',
  'slate-react > is-hotkey',
  'graphql',
  '@keystatic/core > cookie',
],
},
    define: { __REEF_CAPTURE_DU_TELEPHONE__: JSON.stringify(existsSync(new URL("./public/reef-iphone-poster.webp", import.meta.url))) },
    resolve: { alias: moteur.alias },
    build: {
      assetsInlineLimit: 0,
    },
  },
});
