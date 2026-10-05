// scripts/preremplir-keystatic.ts - ecrit dans src/donnees/ les fichiers de contenu Keystatic, remplis avec les textes ACTUELS du theme.
//
//   npx tsx scripts/preremplir-keystatic.ts            cree les fichiers qui n'existent pas encore
//   npx tsx scripts/preremplir-keystatic.ts --force    ecrase aussi ceux qui existent (perd vos modifications)
//
// Sans lui, chaque formulaire Keystatic demarre vide : il faudrait connaitre le
// texte du theme pour le modifier. Avec lui, chaque champ affiche deja le texte
// en place, et l'on n'a plus qu'a le changer. Les textes viennent des dictionnaires
// du theme (src/i18n/ui/) et de src/config/legalData.json.ts, lus tels quels.
//
// Il ne remplace jamais un fichier existant sans --force : relancer ce script
// apres avoir edite dans Keystatic est sans danger.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getLegalData } from "../src/config/legalData.json.ts";
import { en } from "../src/i18n/ui/en/index.ts";
import { fr } from "../src/i18n/ui/fr/index.ts";

const force = process.argv.includes("--force");
const dossier = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src", "donnees");

const dictionnaires = { fr, en } as const;
type Langue = keyof typeof dictionnaires;

/** /blog/ devient /fr/blog/ en francais, et reste /blog/ en anglais (comme localizePath du theme). */
const L = (langue: Langue, chemin: string): string => (langue === "fr" ? `/fr${chemin}` : chemin);

const lien = (texte: string, adresse: string) => ({ texte, lien: adresse, nouvelOnglet: false });

const fichiers: { nom: string; contenu: unknown }[] = [];

for (const langue of Object.keys(dictionnaires) as Langue[]) {
  const d = dictionnaires[langue];
  const legal = getLegalData(langue);
  const r = (chemin: string) => L(langue, chemin);

  // --- Accueil : textes de l'ouverture
  fichiers.push({
    nom: `accueil-${langue}`,
    contenu: {
      metaTitre: d.home.metaTitle,
      metaDescription: d.home.metaDescription,
      accroche: d.home.eyebrow,
      titre: d.home.heroTitle,
      motAccentue: d.home.heroAccent,
      chapeau: d.home.heroLede,
      boutonPrincipal: d.home.heroPrimary,
      lienPrincipal: r("/blog/"),
      boutonSecondaire: d.home.heroSecondary,
      lienSecondaire: r("/about/"),
      compteurs: [...d.home.heroLedger],
    },
  });

  // --- Navigation et pied de page (la structure de src/config/navData.json.ts)
  fichiers.push({
    nom: `site-${langue}`,
    contenu: {
      navigation: {
        principal: [
          lien(d.nav.posts, r("/blog/")),
          lien(d.nav.topics, r("/topics/")),
          lien(d.nav.about, r("/about/")),
          lien(d.nav.contact, r("/contact/")),
        ],
        tiroir: [lien(d.nav.authors, r("/authors/")), lien(d.nav.search, r("/search/"))],
        boutonTexte: d.nav.subscribe,
        lienBouton: "#newsletter",
      },
      colonnes: [
        {
          titre: d.footer.colRead,
          liens: [
            lien(d.nav.posts, r("/blog/")),
            lien(d.nav.topics, r("/topics/")),
            lien(d.nav.authors, r("/authors/")),
            lien(d.footer.rss, r("/rss.xml")),
          ],
        },
        { titre: d.footer.colStudio, liens: [lien(d.nav.about, r("/about/")), lien(d.nav.contact, r("/contact/"))] },
        { titre: d.footer.colLegal, liens: [lien(d.footer.imprint, r("/legal/")), lien(d.footer.privacy, r("/privacy/"))] },
      ],
      footer: {
        tagline: d.footer.tagline,
        rights: d.footer.rights,
        builtWith: d.footer.builtWith,
        themeBy: d.footer.themeBy,
        backToTop: d.footer.backToTop,
      },
      newsletter: {
        title: d.newsletter.title,
        accent: d.newsletter.accent,
        lede: d.newsletter.lede,
        placeholder: d.newsletter.placeholder,
        submit: d.newsletter.submit,
        note: d.newsletter.note,
      },
    },
  });

  // --- Pages
  const a = d.about;
  fichiers.push({
    nom: `a-propos-${langue}`,
    contenu: {
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      eyebrow: a.eyebrow,
      title: a.title,
      accent: a.accent,
      lede: a.lede,
      crumb: a.crumb,
      storyTitle: a.storyTitle,
      storyAccent: a.storyAccent,
      storyParagraphs: [...a.storyParagraphs],
      valuesTitle: a.valuesTitle,
      valuesAccent: a.valuesAccent,
      valuesLede: a.valuesLede,
      values: a.values.map((v) => ({ title: v.title, text: v.text })),
      writersTitle: a.writersTitle,
      writersAccent: a.writersAccent,
      writersLede: a.writersLede,
      writersCta: a.writersCta,
      contactTitle: a.contactTitle,
      contactLede: a.contactLede,
      contactCta: a.contactCta,
    },
  });

  const c = d.contact;
  fichiers.push({
    nom: `contact-${langue}`,
    contenu: {
      metaTitle: c.metaTitle,
      metaDescription: c.metaDescription,
      eyebrow: c.eyebrow,
      title: c.title,
      accent: c.accent,
      lede: c.lede,
      crumb: c.crumb,
      directTitle: c.directTitle,
      directLede: c.directLede,
      directCta: c.directCta,
      nextTitle: c.nextTitle,
      nextSteps: [...c.nextSteps],
    },
  });

  // --- Pages juridiques
  const document = (doc: { title: string; description: string; lastUpdated: string; sections: readonly { title: string; body: string }[] }) => ({
    title: doc.title,
    description: doc.description,
    lastUpdated: doc.lastUpdated,
    sections: doc.sections.map((s) => ({ title: s.title, body: s.body })),
  });
  fichiers.push({
    nom: `mentions-${langue}`,
    contenu: document({ ...d.legal, lastUpdated: d.legal.updated }),
  });
  fichiers.push({ nom: `confidentialite-${langue}`, contenu: document(legal.privacy) });
  fichiers.push({ nom: `conditions-${langue}`, contenu: document(legal.terms) });
}

mkdirSync(dossier, { recursive: true });
let crees = 0;
let gardes = 0;
for (const { nom, contenu } of fichiers) {
  const chemin = resolve(dossier, `${nom}.json`);
  if (existsSync(chemin) && !force) {
    gardes += 1;
    console.log(`  garde   src/donnees/${nom}.json (existe deja)`);
    continue;
  }
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, JSON.stringify(contenu, null, 2) + "\n", "utf-8");
  crees += 1;
  console.log(`  ecrit   src/donnees/${nom}.json`);
}
console.log(`\n${crees} fichier(s) ecrit(s), ${gardes} garde(s).`);
