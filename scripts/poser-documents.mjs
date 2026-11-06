// scripts/poser-documents.mjs - branche les documents joints dans les 6 fichiers existants du projet.
//
// À lancer à la racine du projet : node scripts/poser-documents.mjs
// - Chaque modification s'appuie sur une ligne précise du fichier ; si une seule est introuvable ou
//   présente plusieurs fois, RIEN n'est écrit et le script dit laquelle.
// - Relançable sans danger : une modification déjà posée est reconnue et sautée.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const NOUVEAUX = [
  "src/components/Documents/documents.ts",
  "src/components/Documents/textes.ts",
  "src/components/Documents/lire-textes.ts",
  "src/components/Documents/ListeDocuments.astro",
  "src/components/Blocs/DocumentsBloc.astro",
  "src/keystatic/champ-documents.ts",
];

/** Un fichier : ses modifications. `deja` : un texte qui prouve que la modification est posée. `avant` ou `apres` : où insérer, par rapport à `ancre`. */
const MODIFICATIONS = [
  {
    fichier: "keystatic.config.ts",
    changes: [
      {
        deja: "champ-documents",
        ancre: "import { pagesLibres } from './src/keystatic/pages-libres';\n",
        avant: "import { textesDocumentsEn, textesDocumentsFr } from './src/keystatic/champ-documents';\n",
      },
      {
        deja: "'Documents joints'",
        ancre: "      'Pages libres': ['pagesLibres'],\n",
        apres: "      'Documents joints': ['textesDocumentsFr', 'textesDocumentsEn'],\n",
      },
      {
        deja: "    textesDocumentsFr,\n",
        ancre: "    ...pagesArticles,\n",
        apres: "    textesDocumentsFr,\n    textesDocumentsEn,\n",
      },
    ],
  },
  {
    fichier: "src/content.config.ts",
    changes: [
      {
        deja: "// Documents joints (PDF, Word, Excel, images...)",
        ancre: "      draft: z.boolean().default(false),\n",
        apres: `      // Documents joints (PDF, Word, Excel, images...) saisis dans Keystatic : le fichier est une adresse /documents/...
      documents: z
        .array(
          z.object({
            titre: z.string().nullish(),
            fichier: z.string().nullish(),
            description: z.string().nullish(),
            integre: z.boolean().nullish(),
          }),
        )
        .default([]),
`,
      },
    ],
  },
  {
    fichier: "src/keystatic/articles.ts",
    changes: [
      {
        deja: "champ-documents",
        ancre: 'import { collection, fields } from "@keystatic/core";\n',
        apres: 'import { documentsChamp } from "./champ-documents";\n',
      },
      {
        deja: "documentsChamp(",
        ancre: "      // Seulement dans les articles francais : la case qui declenche la copie anglaise.\n",
        avant: '      documents: documentsChamp("Documents joints (PDF, Word, Excel…)"),\n',
      },
    ],
  },
  {
    fichier: "src/keystatic/pages-libres.ts",
    changes: [
      {
        deja: "champ-documents",
        ancre: 'import { media } from "./champ-media";\n',
        apres: 'import { documentsChamp } from "./champ-documents";\n',
      },
      {
        deja: "documentsChamp(",
        ancre: '  espace: {\n    label: "Espace ou séparateur",\n',
        avant: `  documents: {
    label: "Documents (PDF, Word, Excel…)",
    schema: fields.object({ ...enTeteDeSection(), documents: documentsChamp("Les documents"), apparence: apparence() }),
  },
`,
      },
    ],
  },
  {
    fichier: "src/components/Blocs/Blocs.astro",
    changes: [
      {
        deja: "DocumentsBloc from",
        ancre: 'import DerniersArticles from "./DerniersArticles.astro";\n',
        apres: 'import DocumentsBloc from "./DocumentsBloc.astro";\n',
      },
      {
        deja: "documents: DocumentsBloc",
        ancre: "  carrousel: Carrousel,\n",
        apres: "  documents: DocumentsBloc,\n",
      },
    ],
  },
  {
    fichier: "src/components/Pages/ArticlePage.astro",
    changes: [
      {
        deja: "ListeDocuments from",
        ancre: 'import RelatedPosts from "@components/Sections/Post/RelatedPosts.astro";\n',
        apres: 'import ListeDocuments from "@components/Documents/ListeDocuments.astro";\n',
      },
      {
        deja: "const documents = ",
        ancre: "const locale = getLocale(Astro);\n",
        apres: "// Les documents joints saisis dans Keystatic (PDF, Word, Excel...), affichés sous le texte.\nconst documents = post.data.documents ?? [];\n",
      },
      {
        deja: "<ListeDocuments",
        ancre: "      <PostFooter {post} {author} {url} />\n",
        avant: '      <ListeDocuments documents={documents} locale={locale} avecTitre variante="article" />\n\n',
      },
    ],
  },
];

const erreurs = [];
const manquants = NOUVEAUX.filter((f) => !existsSync(f));
if (manquants.length) erreurs.push(`Fichiers à poser d'abord (décompressez l'archive à la racine du projet) :\n  - ${manquants.join("\n  - ")}`);
if (!existsSync("keystatic.config.ts")) erreurs.push("keystatic.config.ts est introuvable : lancez ce script à la racine du projet (/workspaces/reef).");

const resultats = [];
if (erreurs.length === 0) {
  for (const { fichier, changes } of MODIFICATIONS) {
    if (!existsSync(fichier)) {
      erreurs.push(`${fichier} : fichier introuvable.`);
      continue;
    }
    const brut = readFileSync(fichier, "utf8");
    const crlf = brut.includes("\r\n");
    let texte = crlf ? brut.replace(/\r\n/g, "\n") : brut;
    let posees = 0;
    for (const c of changes) {
      if (texte.includes(c.deja)) continue;
      const nombre = texte.split(c.ancre).length - 1;
      if (nombre !== 1) {
        erreurs.push(
          `${fichier} : la ligne repère ${nombre === 0 ? "est introuvable" : `apparaît ${nombre} fois`} :\n    ${JSON.stringify(c.ancre.trim())}`,
        );
        continue;
      }
      texte = c.avant !== undefined ? texte.replace(c.ancre, () => c.avant + c.ancre) : texte.replace(c.ancre, () => c.ancre + c.apres);
      posees += 1;
    }
    resultats.push({ fichier, texte: crlf ? texte.replace(/\n/g, "\r\n") : texte, posees });
  }
}

if (erreurs.length > 0) {
  console.error("\nRien n'a été modifié.\n");
  for (const e of erreurs) console.error(`✗ ${e}\n`);
  console.error("Envoyez-moi ce message et le fichier concerné : je corrige le script.");
  process.exit(1);
}

for (const { fichier, texte, posees } of resultats) {
  if (posees > 0) writeFileSync(fichier, texte);
  console.log(`${posees > 0 ? "✓" : "·"} ${fichier} : ${posees > 0 ? `${posees} modification(s) posée(s)` : "déjà à jour"}`);
}
console.log("\nTerminé. Vérifiez avec : git status");
