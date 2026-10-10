// scripts/preremplir-keystatic.ts - ecrit dans src/donnees/ les fichiers de contenu Keystatic, remplis avec les textes ACTUELS du theme.
//
//   npx tsx scripts/preremplir-keystatic.ts            cree les fichiers absents et COMPLETE les existants :
//                                                      seuls les champs qui manquent sont ajoutes, jamais une
//                                                      valeur deja saisie (ni modifiee, ni effacee)
//   npx tsx scripts/preremplir-keystatic.ts --force    ecrase tout (perd vos modifications)
//
// Sans lui, chaque formulaire Keystatic demarre vide : il faudrait connaitre le
// texte du theme pour le modifier. Avec lui, chaque champ affiche deja le texte
// en place, et l'on n'a plus qu'a le changer. Les textes viennent des dictionnaires
// du theme (src/i18n/ui/) et de src/config/legalData.json.ts, lus tels quels.
//
// Il ne remplace jamais une valeur existante sans --force : relancer ce script
// apres avoir edite dans Keystatic, ou apres l'ajout de nouveaux champs au theme, est sans danger.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
      imageFond: "",
      bande: { label: d.home.marqueeLabel },
      aLaUne: { eyebrow: d.home.featuredEyebrow },
      studio: {
        eyebrow: d.home.aboutEyebrow,
        title: d.home.aboutTitle,
        accent: d.home.aboutAccent,
        lede: d.home.aboutLede,
        cta: d.home.aboutCta,
        lien: r("/about/"),
        contact: d.home.aboutContact,
        lienContact: r("/contact/"),
        video: "",
        affiche: "",
      },
      dernieresNotes: {
        title: d.home.latestTitle,
        accent: d.home.latestAccent,
        lede: d.home.latestLede,
        cta: d.home.latestCta,
        lien: r("/blog/"),
      },
      sujets: {
        title: d.home.topicsTitle,
        accent: d.home.topicsAccent,
        lede: d.home.topicsLede,
        cta: d.home.topicsCta,
        lien: r("/topics/"),
      },
      signatures: {
        title: d.home.authorsTitle,
        accent: d.home.authorsAccent,
        lede: d.home.authorsLede,
        cta: d.home.authorsCta,
        lien: r("/authors/"),
      },
      lettre: { image: "", lienFlux: r("/rss.xml") },
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
        rssTitle: d.newsletter.rssTitle,
        rssLede: d.newsletter.rssLede,
        rssCta: d.newsletter.rssCta,
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

/** Ajoute a `existant` les cles qui lui manquent, sans toucher a aucune valeur deja la ; renvoie le nombre de champs ajoutes. */
function completer(existant: Record<string, unknown>, voulu: Record<string, unknown>): number {
  let ajoutes = 0;
  for (const [cle, valeur] of Object.entries(voulu)) {
    const actuel = existant[cle];
    if (actuel === undefined) {
      existant[cle] = valeur;
      ajoutes += 1;
    } else if (
      actuel !== null && typeof actuel === "object" && !Array.isArray(actuel) &&
      valeur !== null && typeof valeur === "object" && !Array.isArray(valeur)
    ) {
      ajoutes += completer(actuel as Record<string, unknown>, valeur as Record<string, unknown>);
    }
  }
  return ajoutes;
}

mkdirSync(dossier, { recursive: true });
let crees = 0;
let completes = 0;
let intacts = 0;
for (const { nom, contenu } of fichiers) {
  const chemin = resolve(dossier, `${nom}.json`);
  const ecrire = (donnees: unknown) => writeFileSync(chemin, JSON.stringify(donnees, null, 2) + "\n", "utf-8");
  mkdirSync(dirname(chemin), { recursive: true });

  if (!existsSync(chemin) || force) {
    ecrire(contenu);
    crees += 1;
    console.log(`  ecrit    src/donnees/${nom}.json`);
    continue;
  }

  let existant: Record<string, unknown>;
  try {
    existant = JSON.parse(readFileSync(chemin, "utf-8"));
  } catch {
    console.log(`  ignore   src/donnees/${nom}.json (illisible : corrigez-le ou relancez avec --force)`);
    intacts += 1;
    continue;
  }
  const ajoutes = completer(existant, contenu as Record<string, unknown>);
  if (ajoutes === 0) {
    intacts += 1;
    console.log(`  garde    src/donnees/${nom}.json (rien a ajouter)`);
  } else {
    ecrire(existant);
    completes += 1;
    console.log(`  complete src/donnees/${nom}.json (+${ajoutes} champ(s) manquant(s))`);
  }
}
console.log(`\n${crees} fichier(s) ecrit(s), ${completes} complete(s), ${intacts} intact(s).`);
