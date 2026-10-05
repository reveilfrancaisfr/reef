import { config, fields, collection } from '@keystatic/core';
import { accueilEn, accueilFr, dispositionAccueil } from './src/keystatic/accueil';
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

export default config({
  storage: {
    kind: 'local',
  },
  // Le menu de gauche de l'interface, range par theme.
  ui: {
    navigation: {
      Articles: ['posts'],
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