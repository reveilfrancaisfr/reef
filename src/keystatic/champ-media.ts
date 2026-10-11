// src/keystatic/champ-media.ts - le champ "Choisir dans la mediatheque" : un selecteur de vignettes, avec televersement, pour toute image ou video d'un formulaire Keystatic.
//
// En developpement (pnpm dev), il lit la mediatheque (scripts/mediatheque.mjs) : il
// montre toutes les images et videos de public/medias/ et en televerse de nouvelles.
//
// Keystatic en ligne (mode GitHub) : la mediatheque n'existe pas. Un champ "image"
// devient alors le champ image natif de Keystatic, qui televerse le fichier et le
// commite dans public/medias/ au moment du Save. Un champ "video" ou "image ou
// video" reste un champ texte ou l'on colle l'adresse d'un fichier (/medias/clip.mp4),
// avec un lien vers le depot GitHub pour l'ajouter.
//
// Dans tous les cas, la valeur enregistree est une adresse en simple texte (/medias/photo.jpg).
//
// Ecrit sans JSX (createElement) pour fonctionner quel que soit le reglage JSX du projet.
import { fields } from "@keystatic/core";
import type { BasicFormField, ComponentSchema, FormFieldInputProps } from "@keystatic/core";
import { createElement as h, useEffect, useRef, useState } from "react";

export type GenreDeMedia = "image" | "video" | "tous";

interface MediaListe {
  nom: string;
  url: string;
  type: "image" | "video";
  taille: number;
  utilisations: string[];
}

interface Options {
  label: string;
  description?: string;
  genre?: GenreDeMedia;
}

const SOMBRE = "#1b1d1f";
const BORD = "#3a3f44";
const TEXTE = "#ececec";
const ACCENT = "#4c8dff";
const EXTENSIONS_VIDEO = /\.(mp4|webm|mov)(\?.*)?$/i;

/** Vrai quand Keystatic ecrit sur GitHub (en ligne, ou en local avec PUBLIC_KEYSTATIC_MODE=github) : meme regle que keystatic.config.ts. */
const EN_LIGNE = import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_MODE === "github";

/** La page GitHub qui televerse un fichier dans public/medias (pour les videos, en ligne). */
const DEPOT_MEDIAS = "https://github.com/reveilfrancaisfr/reef/upload/main/public/medias";

const estVideo = (adresse: string) => EXTENSIONS_VIDEO.test(adresse);

const bouton = (extra: Record<string, string | number> = {}) => ({
  background: "transparent",
  color: "inherit",
  border: `1px solid ${BORD}`,
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
  ...extra,
});

/** Un petit apercu : image ou video, ou rien si l'adresse est vide. */
function Apercu(props: { adresse: string; taille: number }) {
  const { adresse, taille } = props;
  const style = { width: taille, height: taille, objectFit: "cover" as const, borderRadius: 8, background: "#0d0e0f", flex: "none" };
  if (!adresse) return null;
  return estVideo(adresse)
    ? h("video", { src: adresse + "#t=0.1", muted: true, preload: "metadata", style })
    : h("img", { src: adresse, alt: "", style });
}

function Selecteur(props: { genre: GenreDeMedia; valeur: string; onChoisir(adresse: string): void; onFermer(): void }) {
  const { genre, valeur, onChoisir, onFermer } = props;
  const [medias, setMedias] = useState<MediaListe[] | null>(null);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [envoi, setEnvoi] = useState("");
  const champ = useRef<HTMLInputElement | null>(null);

  const charger = () =>
    fetch("/api/mediatheque")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: { medias: MediaListe[] }) => setMedias(d.medias))
      .catch(() => setErreur("La médiathèque n'est disponible qu'en développement (pnpm dev). Collez à la place l'adresse du fichier dans le champ."));

  useEffect(() => {
    charger();
  }, []);

  useEffect(() => {
    const touche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, []);

  const televerser = (fichiers: FileList | null) => {
    if (!fichiers || fichiers.length === 0) return;
    const donnees = new FormData();
    Array.from(fichiers).forEach((f) => donnees.append("fichiers", f));
    setEnvoi("Envoi en cours…");
    fetch("/api/mediatheque", { method: "POST", headers: { "X-Mediatheque": "1" }, body: donnees })
      .then((r) => r.json())
      .then((d: { ajoutes?: { url: string; type: string }[]; refuses?: { nom: string; raison: string }[] }) => {
        const premier = d.ajoutes?.find((a) => genre === "tous" || a.type === genre);
        if (premier) return onChoisir(premier.url);
        if (d.ajoutes && d.ajoutes.length > 0) setEnvoi(`Ajouté à la médiathèque, mais ce champ attend ${genre === "video" ? "une vidéo" : "une image"}.`);
        else setEnvoi(d.refuses?.[0] ? `${d.refuses[0].nom} : ${d.refuses[0].raison}` : "Rien n'a été ajouté.");
        return charger();
      })
      .catch(() => setEnvoi("L'envoi a échoué."));
  };

  const liste = (medias ?? []).filter(
    (m) => (genre === "tous" || m.type === genre) && (!recherche.trim() || m.nom.toLowerCase().includes(recherche.trim().toLowerCase())),
  );

  const vignette = (m: MediaListe) =>
    h(
      "button",
      {
        key: m.nom,
        type: "button",
        onClick: () => onChoisir(m.url),
        title: m.nom,
        "aria-label": `Choisir ${m.nom}`,
        style: {
          padding: 0,
          border: `2px solid ${valeur === m.url ? ACCENT : "transparent"}`,
          borderRadius: 10,
          background: "#0d0e0f",
          cursor: "pointer",
          overflow: "hidden",
          textAlign: "left" as const,
          color: TEXTE,
        },
      },
      h("div", { style: { aspectRatio: "4 / 3" } }, h(Apercu, { adresse: m.url, taille: 0 } as never)),
      h("div", { style: { padding: "4px 8px", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, m.nom),
    );

  return h(
    "div",
    {
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Médiathèque",
      onClick: (e: { target: unknown; currentTarget: unknown }) => e.target === e.currentTarget && onFermer(),
      style: { position: "fixed", inset: 0, zIndex: 100000, background: "rgba(0,0,0,.7)", display: "grid", placeItems: "center", padding: 16 },
    },
    h(
      "div",
      { style: { background: SOMBRE, color: TEXTE, border: `1px solid ${BORD}`, borderRadius: 14, width: "min(960px, 100%)", maxHeight: "88vh", display: "flex", flexDirection: "column" as const } },
      h(
        "div",
        { style: { display: "flex", flexWrap: "wrap" as const, gap: 8, alignItems: "center", padding: 12, borderBottom: `1px solid ${BORD}` } },
        h("strong", { style: { marginRight: "auto" } }, genre === "video" ? "Choisir une vidéo" : genre === "image" ? "Choisir une image" : "Choisir un fichier"),
        h("input", {
          type: "search",
          placeholder: "Rechercher…",
          value: recherche,
          onChange: (e: { target: { value: string } }) => setRecherche(e.target.value),
          style: { background: "#26292c", color: "inherit", border: `1px solid ${BORD}`, borderRadius: 8, padding: "6px 10px" },
        }),
        h("button", { type: "button", onClick: () => champ.current?.click(), style: bouton({ background: ACCENT, borderColor: ACCENT, color: "#fff" }) }, "Téléverser"),
        h("input", {
          ref: champ,
          type: "file",
          multiple: true,
          hidden: true,
          accept: genre === "video" ? "video/mp4,video/webm,video/quicktime" : genre === "image" ? "image/jpeg,image/png,image/webp,image/avif,image/gif" : "image/*,video/mp4,video/webm,video/quicktime",
          onChange: (e: { target: HTMLInputElement }) => {
            televerser(e.target.files);
            e.target.value = "";
          },
        }),
        h("a", { href: "/mediatheque", target: "_blank", rel: "noopener", style: { ...bouton(), textDecoration: "none" } }, "Ouvrir la médiathèque"),
        h("button", { type: "button", onClick: onFermer, style: bouton(), "aria-label": "Fermer" }, "Fermer"),
      ),
      envoi ? h("div", { role: "status", style: { padding: "8px 12px", color: "#e5b567", fontSize: 13 } }, envoi) : null,
      h(
        "div",
        { style: { overflow: "auto", padding: 12 } },
        erreur
          ? h("p", { style: { color: "#e5b567" } }, erreur)
          : medias === null
            ? h("p", null, "Chargement…")
            : liste.length === 0
              ? h("p", { style: { opacity: 0.7 } }, medias.length === 0 ? "Aucun fichier pour l'instant : cliquez sur « Téléverser »." : "Rien ne correspond.")
              : h("div", { style: { display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" } }, liste.map(vignette)),
      ),
    ),
  );
}

function Entree(props: FormFieldInputProps<string> & Options) {
  const { value, onChange, label, description, genre = "image" } = props;
  const [ouvert, setOuvert] = useState(false);
  // La mediatheque n'existe qu'avec `pnpm dev` : en ligne, on ne l'appelle pas.
  const avecMediatheque = !EN_LIGNE;
  return h(
    "div",
    { style: { display: "grid", gap: 6, margin: "4px 0" } },
    h("label", { style: { fontWeight: 500, fontSize: 14 } }, label),
    description ? h("div", { style: { opacity: 0.7, fontSize: 12 } }, description) : null,
    h(
      "div",
      { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const } },
      h(Apercu, { adresse: value, taille: 56 }),
      h("input", {
        type: "text",
        value,
        placeholder: "/medias/nom-du-fichier.jpg",
        "aria-label": label,
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
        style: { flex: "1 1 14rem", background: "transparent", color: "inherit", border: `1px solid ${BORD}`, borderRadius: 8, padding: "6px 10px" },
      }),
      avecMediatheque
        ? h("button", { type: "button", onClick: () => setOuvert(true), style: bouton() }, value ? "Changer" : "Choisir dans la médiathèque")
        : null,
      value ? h("button", { type: "button", onClick: () => onChange(""), style: bouton({ color: "#ff8a8a" }) }, "Retirer") : null,
    ),
    avecMediatheque
      ? null
      : h(
          "div",
          { style: { opacity: 0.7, fontSize: 12 } },
          "La médiathèque n'existe pas en ligne. Pour une nouvelle vidéo : ",
          h("a", { href: DEPOT_MEDIAS, target: "_blank", rel: "noopener", style: { color: ACCENT } }, "ajoutez le fichier dans public/medias sur GitHub"),
          ", puis collez ici son adresse (/medias/nom-du-fichier.mp4).",
        ),
    ouvert && avecMediatheque
      ? h(Selecteur, {
          genre,
          valeur: value,
          onChoisir: (adresse: string) => {
            onChange(adresse);
            setOuvert(false);
          },
          onFermer: () => setOuvert(false),
        })
      : null,
  );
}

/**
 * Un champ Keystatic qui choisit une image ou une video. La valeur est son adresse (/medias/…).
 * En ligne, un champ "image" devient le champ image natif de Keystatic (televersement vers GitHub).
 */
export function media(options: Options): ComponentSchema {
  const genre = options.genre ?? "image";

  if (EN_LIGNE && genre === "image") {
    return fields.image({
      label: options.label,
      description: options.description,
      directory: "public/medias",
      publicPath: "/medias/",
    });
  }

  const lire = (v: unknown): string => (typeof v === "string" ? v : "");
  const champ: BasicFormField<string> = {
    kind: "form",
    label: options.label,
    Input: (props) => h(Entree, { ...props, ...options }),
    defaultValue: () => "",
    parse: lire,
    serialize: (valeur) => ({ value: valeur === "" ? undefined : valeur }),
    validate: (valeur) => valeur,
    reader: { parse: lire },
  };
  return champ;
}