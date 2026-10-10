import { config, fields, collection } from '@keystatic/core';
import { accueilEn, accueilFr, dispositionAccueil } from './src/keystatic/accueil';
import { pagesLibres } from './src/keystatic/pages-libres';
import {
  aProposEn,
  aProposFr,
  conditionsEn,
  conditionsFr,
  confidentialiteEn,
  confidentialiteFr,
  contactEn,
  contactFr,
  mentionsEn,
  mentionsFr,
  siteEn,
  siteFr,
} from './src/keystatic/pages';

// Stockage : fichiers locaux avec `pnpm dev`, GitHub en ligne (chaque Save
// devient un commit sur main, et Vercel reconstruit le site).
// PUBLIC_KEYSTATIC_MODE=github force le mode GitHub en local : a n'utiliser
// qu'une fois, pour creer la GitHub App (voir l'etape 4).
const MODE_GITHUB = import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_MODE === 'github';

export default config({
  storage: MODE_GITHUB
    ? { kind: 'github', repo: 'reveilfrancaisfr/reef' }
    : { kind: 'local' },
  // Le menu de gauche de l'interface, range par theme.
  ui: {
    navigation: {
      Articles: ['posts'],
      'Pages libres': ['pagesLibres'],
      Accueil: ['accueilFr', 'accueilEn', 'dispositionAccueil'],
      'Navigation et pied de page': ['siteFr', 'siteEn'],
      Pages: ['aProposFr', 'aProposEn', 'contactFr', 'contactEn'],
      'Pages juridiques': [
        'mentionsFr',
        'mentionsEn',
        'confidentialiteFr',
        'confidentialiteEn',
        'conditionsFr',
        'conditionsEn',
      ],
    },
  },
  collections: {
    pagesLibres,
    posts: collection({
      label: 'Articles',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Titre' } }),
        publishedDate: fields.date({ label: 'Date de publication' }),
        description: fields.text({ label: 'Description', multiline: true }),
        content: fields.markdoc({
          label: 'Contenu de l’article',
        }),
      },
    }),
  },
  singletons: {
    accueilFr,
    accueilEn,
    dispositionAccueil,
    siteFr,
    siteEn,
    aProposFr,
    aProposEn,
    contactFr,
    contactEn,
    mentionsFr,
    mentionsEn,
    confidentialiteFr,
    confidentialiteEn,
    conditionsFr,
    conditionsEn,
  },
});
