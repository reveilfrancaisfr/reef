// src/components/Blocs/apparence.ts - traduit l'"Apparence et animation" saisie dans Keystatic en styles CSS, et le texte simple d'un paragraphe en HTML sur.
//
// Rien ici ne depend de Tailwind : les couleurs, formes et espaces passent par
// des variables CSS posees en style sur le bloc, que blocs.css lit. Les couleurs
// du theme (--color-*) sont reaffectees sur le bloc, pour que ses titres, boutons
// et textes les suivent sans qu'aucun composant du theme ne change.

type Choix = { discriminant?: string; value?: unknown } | undefined;

export interface ApparenceSaisie {
  fond?: Choix;
  texte?: Choix;
  accent?: Choix;
  police?: string;
  largeur?: string;
  coins?: string;
  separateurHaut?: string;
  separateurBas?: string;
  espacement?: string;
  alignement?: string;
  animation?: string;
  delai?: string;
}

export interface ApparenceCalculee {
  /** Variables de mise en page, toujours posees sur la section. */
  variables: string;
  /** Couleurs et fond : sur la section, ou sur la boite en largeur "carte". */
  couleurs: string;
  /** Forme des bords du haut et du bas (clip-path), seulement hors "carte". */
  decoupe: string;
  largeur: string;
  attributs: Record<string, string>;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const ENCRE = "#0b1220";
const BLANC = "#ffffff";
/** La hauteur, en pixels, que prennent les bords en diagonale, courbe ou vague. */
export const HAUTEUR_DES_BORDS = 48;

const hex = (valeur: unknown): string | undefined => (typeof valeur === "string" && HEX.test(valeur) ? valeur : undefined);

/** L'encre lisible sur un fond #RRGGBB : blanche sur fond sombre, sombre sur fond clair. */
export function encreSur(couleur: string): string {
  const n = parseInt(couleur.slice(1), 16);
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
  return luminance > 0.4 ? ENCRE : BLANC;
}

const ESPACEMENTS: Record<string, string> = {
  compact: "clamp(2rem, 5vw, 3rem)",
  normal: "clamp(3.5rem, 8vw, 5rem)",
  aere: "clamp(5rem, 12vw, 8rem)",
};
const RAYONS: Record<string, string> = { droits: "0px", arrondis: "1.25rem", tres: "2.5rem" };

/** Un bord du bloc, en points d'un polygone : de gauche a droite, ou de droite a gauche pour le bas. */
function bord(type: string | undefined, bas: boolean): string[] {
  const n = type === "vague" ? 48 : type === "courbe" ? 28 : 1;
  const points: string[] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    let retrait = 0;
    if (type === "diagonale") retrait = HAUTEUR_DES_BORDS * (1 - t);
    else if (type === "courbe") retrait = HAUTEUR_DES_BORDS * (1 - Math.sin(Math.PI * t));
    else if (type === "vague") retrait = HAUTEUR_DES_BORDS * (0.5 + 0.5 * Math.sin(Math.PI * 4 * t));
    const x = `${(t * 100).toFixed(2)}%`;
    const y = bas ? `calc(100% - ${retrait.toFixed(1)}px)` : `${retrait.toFixed(1)}px`;
    points.push(`${x} ${y}`);
  }
  return bas ? points.reverse() : points;
}

const avecBord = (type: string | undefined): boolean => type === "diagonale" || type === "courbe" || type === "vague";

export function calculerApparence(saisie?: ApparenceSaisie | null): ApparenceCalculee {
  const a = saisie ?? {};
  const variables: string[] = [];
  const couleurs: string[] = [];
  const attributs: Record<string, string> = {};

  // --- Fond et encre
  let fond: string | undefined;
  let fondUni: string | undefined;
  let encre: string | undefined;
  const choixFond = a.fond?.discriminant ?? "theme";
  if (choixFond === "surface") fondUni = "var(--color-surface)";
  else if (choixFond === "primaire") {
    fondUni = "var(--color-primary)";
    encre = "var(--color-primary-foreground)";
  } else if (choixFond === "sombre") {
    fondUni = "var(--color-scrim, #0b1220)";
    encre = BLANC;
  } else if (choixFond === "blanc") {
    fondUni = BLANC;
    encre = ENCRE;
  } else if (choixFond === "perso") {
    const couleur = hex(a.fond?.value);
    if (couleur) {
      fondUni = couleur;
      encre = encreSur(couleur);
    }
  } else if (choixFond === "degrade") {
    const valeur = (a.fond?.value ?? {}) as { de?: string; a?: string; angle?: string };
    const de = hex(valeur.de);
    const vers = hex(valeur.a);
    if (de && vers) {
      fond = `linear-gradient(${Number(valeur.angle) || 135}deg, ${de}, ${vers})`;
      encre = encreSur(de);
    }
  }
  fond ??= fondUni;

  // --- Couleur du texte : l'encre automatique, sauf choix explicite
  const choixTexte = a.texte?.discriminant ?? "auto";
  if (choixTexte === "clair") encre = BLANC;
  else if (choixTexte === "sombre") encre = ENCRE;
  else if (choixTexte === "perso") encre = hex(a.texte?.value) ?? encre;

  if (fond) couleurs.push(`background:${fond}`);
  if (fondUni) {
    couleurs.push(`--color-background:${fondUni}`);
    if (encre) couleurs.push(`--color-surface:color-mix(in srgb, ${fondUni} 90%, ${encre} 10%)`);
  }
  if (encre) {
    couleurs.push(
      `color:${encre}`,
      `--color-foreground:${encre}`,
      `--color-muted-foreground:color-mix(in srgb, ${encre} 72%, transparent)`,
      `--color-border:color-mix(in srgb, ${encre} 20%, transparent)`,
    );
  }

  // --- Couleur d'accent
  if ((a.accent?.discriminant ?? "theme") === "perso") {
    const accent = hex(a.accent?.value);
    if (accent) couleurs.push(`--color-primary:${accent}`, `--color-primary-foreground:${encreSur(accent)}`);
  }

  // --- Espaces, coins, alignement, animation
  variables.push(`--bl-pad:${ESPACEMENTS[a.espacement ?? "normal"] ?? ESPACEMENTS.normal}`);
  variables.push(`--bl-rayon:${RAYONS[a.coins ?? "arrondis"] ?? RAYONS.arrondis}`);
  variables.push(`--bl-bord:${HAUTEUR_DES_BORDS}px`);
  if (a.police && a.police !== "theme") attributs["data-police"] = a.police;
  if (a.alignement === "centre") attributs["data-align"] = "centre";
  if (a.animation && a.animation !== "aucune") {
    attributs["data-bl-anim"] = a.animation;
    const delai = Number(a.delai);
    if (delai > 0) variables.push(`--bl-delai:${delai}ms`);
  }

  // --- Forme des bords : un polygone, avec l'espace en plus pour ne rien couper
  let decoupe = "";
  if (avecBord(a.separateurHaut) || avecBord(a.separateurBas)) {
    decoupe = `clip-path:polygon(${[...bord(a.separateurHaut, false), ...bord(a.separateurBas, true)].join(", ")})`;
    if (avecBord(a.separateurHaut)) attributs["data-sep-haut"] = "";
    if (avecBord(a.separateurBas)) attributs["data-sep-bas"] = "";
  }

  return {
    variables: variables.join(";"),
    couleurs: couleurs.join(";"),
    decoupe,
    largeur: a.largeur ?? "large",
    attributs,
  };
}

/* ------------------------------------------------------------------ texte et adresses */

const ECHAPPEMENTS: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/**
 * Un paragraphe saisi dans Keystatic, en HTML sur : tout est echappe d'abord,
 * puis seuls **gras**, *italique* et [lien](adresse) sont reconnus. Une adresse
 * n'est acceptee que si elle est relative, ancree, mailto: ou en https.
 */
export function enrichir(texte: string): string {
  const sur = texte.replace(/[&<>"']/g, (c) => ECHAPPEMENTS[c]);
  return sur
    .replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:|\/|#)[^)\s]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\n/g, "<br>");
}

/** L'adresse publique d'une image saisie : le chemin tel quel s'il est complet, sinon dans le dossier des pages libres. */
export function urlImage(valeur: unknown): string | undefined {
  if (typeof valeur !== "string" || valeur.trim() === "") return undefined;
  const v = valeur.trim();
  if (/^(https?:)?\/\//.test(v) || v.startsWith("/")) return v;
  return `/images/pages-libres/${v}`;
}

/** Une adresse de lien saisie : relative, ancree, mailto: ou https, sinon rien (jamais javascript:). */
export function adresseSure(valeur: unknown): string | undefined {
  if (typeof valeur !== "string") return undefined;
  const v = valeur.trim();
  return /^(https?:\/\/|mailto:|\/|#)/.test(v) ? v : undefined;
}
