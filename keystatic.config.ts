import { config } from '@keystatic/core';
import { accueilEn, accueilFr, dispositionAccueil } from './src/keystatic/accueil';
import { apparenceSite } from './src/keystatic/apparence-site';
import {
  articlesEn,
  articlesFr,
  ficheAuteurEn,
  ficheAuteurFr,
  ficheSujetEn,
  ficheSujetFr,
} from './src/keystatic/articles';
import { identiteSite } from './src/keystatic/identite-site';
import { pagesArticles } from './src/keystatic/pages-articles';
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
import {
  auteursEn,
  auteursFr,
  introuvableEn,
  introuvableFr,
  rechercheEn,
  rechercheFr,
  sujetsEn,
  sujetsFr,
} from './src/keystatic/pages-restantes';

// Stockage : fichiers locaux avec `pnpm dev`, GitHub en ligne (chaque Save
// devient un commit sur main, et Vercel reconstruit le site).
// PUBLIC_KEYSTATIC_MODE=github force le mode GitHub en local : a n'utiliser
// qu'une fois, pour creer la GitHub App.
const MODE_GITHUB = import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_MODE === 'github';

export default config({
  storage: MODE_GITHUB
    ? { kind: 'github', repo: 'reveilfrancaisfr/reef' }
    : { kind: 'local' },
  // Le menu de gauche de l'interface, range par theme.
  ui: {
    navigation: {
      Articles: ['articlesFr', 'articlesEn'],
      'Auteurs et sujets': ['ficheAuteurFr', 'ficheAuteurEn', 'ficheSujetFr', 'ficheSujetEn'],
      // Les formulaires de src/keystatic/pages-articles.ts : un nouveau formulaire s'y ajoute sans rouvrir ce fichier.
      'Pages des articles': Object.keys(pagesArticles) as (keyof typeof pagesArticles)[],
      'Pages libres': ['pagesLibres'],
      Accueil: ['accueilFr', 'accueilEn', 'dispositionAccueil'],
      'Identité du site': ['identiteSite'],
      'Apparence du site': ['apparenceSite'],
      'Navigation et pied de page': ['siteFr', 'siteEn'],
      Pages: [
        'aProposFr',
        'aProposEn',
        'contactFr',
        'contactEn',
        'sujetsFr',
        'sujetsEn',
        'auteursFr',
        'auteursEn',
        'rechercheFr',
        'rechercheEn',
        'introuvableFr',
        'introuvableEn',
      ],
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
    articlesFr,
    articlesEn,
    ficheAuteurFr,
    ficheAuteurEn,
    ficheSujetFr,
    ficheSujetEn,
  },
  singletons: {
    accueilFr,
    accueilEn,
    dispositionAccueil,
    identiteSite,
    apparenceSite,
    ...pagesArticles,
    siteFr,
    siteEn,
    aProposFr,
    aProposEn,
    contactFr,
    contactEn,
    sujetsFr,
    sujetsEn,
    auteursFr,
    auteursEn,
    rechercheFr,
    rechercheEn,
    introuvableFr,
    introuvableEn,
    mentionsFr,
    mentionsEn,
    confidentialiteFr,
    confidentialiteEn,
    conditionsFr,
    conditionsEn,
  },
});
