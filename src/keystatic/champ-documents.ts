// src/keystatic/champ-documents.ts - le champ « Documents joints » (articles et bloc « Documents » des pages libres) et les formulaires de leurs textes.
//
// Le fichier se dépose avec le champ fichier natif de Keystatic : il est enregistré dans
// public/documents/<adresse de l'article ou de la page>/ (un commit par Save en ligne, comme les images),
// et le site le sert tel quel. Keystatic décide du nom du fichier enregistré : c'est le « Titre » qui s'affiche.
import { fields, singleton } from "@keystatic/core";
import { TEXTES_PAR_DEFAUT } from "../components/Documents/textes";

export const documentsChamp = (label = "Documents joints") =>
  fields.array(
    fields.object({
      titre: fields.text({ label: "Titre affiché", validation: { isRequired: true } }),
      fichier: fields.file({
        label: "Fichier",
        description: "PDF, Word, Excel, PowerPoint, image… Idéalement moins de 25 Mo.",
        directory: "public/documents",
        publicPath: "/documents/",
        validation: { isRequired: true },
      }),
      description: fields.text({ label: "Description (facultative)", multiline: true }),
      integre: fields.checkbox({
        label: "Afficher le document déjà ouvert dans la page",
        description: "Décoché, le lecteur s'ouvre quand le visiteur clique sur « Consulter ».",
        defaultValue: false,
      }),
    }),
    {
      label,
      description:
        "Un PDF, une image ou un texte s'affiche dans la page ; Word, Excel et PowerPoint s'affichent via le lecteur de Microsoft une fois le site publié ; les autres formats se téléchargent.",
      itemLabel: (props) => props.fields.titre.value || "(document)",
    },
  );

const textesDe = (langue: "fr" | "en") => {
  const t = TEXTES_PAR_DEFAUT[langue];
  return {
    titreSection: fields.text({ label: "Titre de la liste (page d'un article)", defaultValue: t.titreSection }),
    consulter: fields.text({ label: "Bouton : consulter", defaultValue: t.consulter }),
    masquer: fields.text({ label: "Bouton : masquer", defaultValue: t.masquer }),
    ouvrir: fields.text({ label: "Bouton : ouvrir dans un nouvel onglet", defaultValue: t.ouvrir }),
    telecharger: fields.text({ label: "Bouton : télécharger", defaultValue: t.telecharger }),
    pleinEcran: fields.text({ label: "Bouton : plein écran", defaultValue: t.pleinEcran }),
    repli: fields.text({
      label: "Message quand l'appareil n'affiche pas le PDF dans la page (téléphone, tablette)",
      multiline: true,
      defaultValue: t.repli,
    }),
  };
};

export const textesDocumentsFr = singleton({
  label: "Documents joints : textes (français)",
  path: "src/donnees/documents-fr",
  format: { data: "json" },
  schema: textesDe("fr"),
});

export const textesDocumentsEn = singleton({
  label: "Documents joints : textes (anglais)",
  path: "src/donnees/documents-en",
  format: { data: "json" },
  schema: textesDe("en"),
});
