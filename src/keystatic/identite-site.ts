// src/keystatic/identite-site.ts - le formulaire Keystatic "Identité du site" : nom, logos, description, image de partage, e-mail, compte X, éditeur.
//
// Tout est pré-rempli avec les valeurs ACTUELLES du thème (src/config/siteData.json.ts), pour voir ce qui est où.
// Les deux logos et l'image de partage sont vides : sans logo, la barre, le tiroir mobile et le pied de page gardent
// la vague du thème ; sans image de partage, la carte reste la photo du thème. Sans logo du mode sombre, le logo
// principal sert aussi sur fond sombre.
// Lecture : src/moteur/identite-keystatic.ts (synchrone, branchée dans src/moteur/theme.ts) ; l'image de partage est
// recadrée en carte 1200x630 au build par scripts/og.mjs.
// Les deux adresses d'envoi (contact, lettre d'information) sont vides : tant qu'elles le sont, ces formulaires
// n'envoient rien, comme avant. Remplies, les formulaires du site (ContactForm.astro, NewsletterInvite.astro, pied
// de page) postent vers ce service.
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
        "Affiché à côté du logo dans la barre, dans le tiroir mobile, dans le pied de page et dans le titre des pages. Il devient aussi le titre du flux RSS. Vide : le nom du thème.",
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
    description: fields.object(
      {
        fr: fields.text({
          label: "En français",
          description: "Vide : la description anglaise sert aussi sur les pages françaises.",
          multiline: true,
        }),
        en: fields.text({
          label: "En anglais",
          multiline: true,
          defaultValue: siteData.description,
        }),
      },
      {
        label: "Description du site",
        description:
          "La phrase que les moteurs de recherche et les aperçus de partage affichent sous le nom du site, et que llms.txt donne aux agents. Le thème n'en fournit qu'une, en anglais.",
      },
    ),
    imagePartage: fields.image({
      label: "Image de partage",
      description:
        "La photo qui s'affiche quand un lien du site est partagé (réseaux sociaux, messageries). N'importe quelle photo : elle est recadrée en 1200 × 630 au build. Vide : la photo du thème.",
      directory: "public/medias",
      publicPath: "/medias/",
    }),
    texteImage: fields.object(
      {
        fr: fields.text({ label: "En français", defaultValue: siteData.defaultImage.alt.fr }),
        en: fields.text({ label: "En anglais", defaultValue: siteData.defaultImage.alt.en }),
      },
      {
        label: "Texte alternatif de l'image de partage",
        description:
          "Décrit la photo pour les lecteurs d'écran. Ces textes décrivent la photo du thème : à réécrire dès que vous choisissez votre image. Sans image choisie, ils ne servent pas.",
      },
    ),
    email: fields.text({
      label: "Adresse e-mail du site",
      description: "Celle que la page Contact et le pied de page proposent. Le thème met une adresse d'exemple.",
      defaultValue: siteData.author.email,
      validation: {
        pattern: {
          regex: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: "Une adresse e-mail, par exemple contact@monsite.fr",
        },
      },
    }),
    compteX: fields.text({
      label: "Compte X",
      description:
        "Le nom du compte, avec ou sans arobase (monsite ou @monsite), ou l'adresse complète du profil. Vide : aucun lien X.",
      defaultValue: siteData.author.twitter ?? "",
    }),
    editeur: fields.text({
      label: "Nom de l'éditeur",
      description: "Le nom qui signe le crédit du pied de page. Le thème met un nom d'exemple.",
      defaultValue: siteData.author.name,
    }),
    envoiContact: fields.text({
      label: "Formulaire de contact : adresse du service qui reçoit les messages",
      description:
        "L'adresse d'envoi que votre service de formulaires donne pour un formulaire HTML (par exemple https://formspree.io/f/xxxxxxx). Le nom, l'e-mail et le message du visiteur partent vers ce service, qui vous les transmet. Vide : le formulaire n'envoie rien. N'indiquez qu'un service de confiance, car il reçoit les données de vos visiteurs.",
      validation: {
        pattern: { regex: /^$|^https:\/\/\S+$/, message: "Une adresse qui commence par https://" },
      },
    }),
    envoiNewsletter: fields.text({
      label: "Lettre d'information : adresse du service qui reçoit les inscriptions",
      description:
        "L'adresse d'envoi que votre service de lettre d'information donne pour un formulaire d'inscription HTML. L'adresse e-mail du visiteur part vers ce service. Vide : les formulaires d'inscription n'envoient rien. N'indiquez qu'un service de confiance.",
      validation: {
        pattern: { regex: /^$|^https:\/\/\S+$/, message: "Une adresse qui commence par https://" },
      },
    }),
  },
});
