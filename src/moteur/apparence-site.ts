// src/moteur/apparence-site.ts - les reglages "Apparence du site" (couleurs et polices) et leur traduction en CSS.
//
// Ce fichier ne lit aucun fichier et n'importe rien : le formulaire Keystatic
// (src/keystatic/apparence-site.ts) y prend ses valeurs par defaut et ses listes,
// et BaseLayout y prend le CSS a poser (voir src/moteur/apparence-keystatic.ts).
//
// Les valeurs par defaut sont les couleurs ACTUELLES du theme (src/styles/tokens.css) :
// le formulaire est donc pre-rempli avec ce que le site montre deja. Un groupe de
// couleurs qui n'a pas ete change n'ecrit aucune regle : le theme garde la main.

export const DEFAUTS = {
  clair: { fond: "#fbfcfe", texte: "#0a0f17", principale: "#147ea0", accent: "#e6411c" },
  sombre: { fond: "#0a0f17", texte: "#fbfcfe", principale: "#3fc0e0", accent: "#ff7a59" },
} as const;

/** Les polices proposees : les deux du theme (deja chargees) et des polices du systeme (rien a telecharger). */
export const POLICES = {
  grotesk: { label: "Space Grotesk (la police des titres du thème)", pile: '"Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif' },
  instrument: { label: "Instrument Sans (la police du texte du thème)", pile: '"Instrument Sans Variable", "Instrument Sans", system-ui, sans-serif' },
  serif: { label: "Serif classique (Georgia)", pile: 'Georgia, "Times New Roman", Times, serif' },
  systeme: { label: "Police de l'appareil", pile: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  mono: { label: "Machine à écrire (monospace)", pile: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
} as const;

export type ClePolice = keyof typeof POLICES;

interface Couleurs {
  fond?: string;
  texte?: string;
  principale?: string;
  accent?: string;
}

/** Ce que le formulaire enregistre dans src/donnees/apparence-site.json. */
export interface ApparenceSaisie {
  activer?: boolean;
  polices?: { titres?: string; texte?: string };
  clair?: Couleurs;
  sombre?: Couleurs;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const ENCRE = "#0b1220";
const BLANC = "#ffffff";

const hex = (valeur: unknown): string | undefined => (typeof valeur === "string" && HEX.test(valeur.trim()) ? valeur.trim().toLowerCase() : undefined);

/** L'encre lisible sur une couleur #RRGGBB : blanche sur fond sombre, sombre sur fond clair (meme regle que les blocs). */
export function encreSur(couleur: string): string {
  const n = parseInt(couleur.slice(1), 16);
  const canal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
  return luminance > 0.4 ? ENCRE : BLANC;
}

/** La couleur saisie, seulement si elle est valide ET differente de celle du theme. */
const change = (saisie: unknown, defaut: string): string | undefined => {
  const c = hex(saisie);
  return c && c !== defaut ? c : undefined;
};

function reglesClair(c: Couleurs | undefined): string[] {
  const r: string[] = [];
  const fond = change(c?.fond, DEFAUTS.clair.fond);
  const texte = change(c?.texte, DEFAUTS.clair.texte);
  if (fond || texte) {
    const f = fond ?? DEFAUTS.clair.fond;
    const t = texte ?? DEFAUTS.clair.texte;
    r.push(
      `--reef-background:${f}`,
      `--reef-foreground:${t}`,
      `--reef-card-foreground:${t}`,
      `--reef-muted:color-mix(in oklab, ${f} 94%, ${t} 6%)`,
      `--reef-surface:color-mix(in oklab, ${f} 94%, ${t} 6%)`,
      `--reef-card:color-mix(in oklab, ${f} 30%, #ffffff)`,
      `--reef-muted-foreground:color-mix(in oklab, ${t} 78%, ${f})`,
      `--reef-border:color-mix(in oklab, ${t} 12%, transparent)`,
    );
  }
  const principale = change(c?.principale, DEFAUTS.clair.principale);
  if (principale) {
    r.push(
      `--reef-primary:${principale}`,
      `--reef-primary-foreground:${encreSur(principale)}`,
      `--reef-primary-text:color-mix(in oklab, ${principale} 78%, #000000)`,
      `--reef-ring:${principale}`,
    );
  }
  const accent = change(c?.accent, DEFAUTS.clair.accent);
  if (accent) {
    r.push(
      `--reef-accent:${accent}`,
      `--reef-accent-foreground:${encreSur(accent)}`,
      `--reef-accent-text:color-mix(in oklab, ${accent} 78%, #000000)`,
    );
  }
  return r;
}

function reglesSombre(c: Couleurs | undefined): string[] {
  const r: string[] = [];
  const fond = change(c?.fond, DEFAUTS.sombre.fond);
  const texte = change(c?.texte, DEFAUTS.sombre.texte);
  if (fond || texte) {
    const f = fond ?? DEFAUTS.sombre.fond;
    const t = texte ?? DEFAUTS.sombre.texte;
    r.push(
      `--reef-background:${f}`,
      `--reef-foreground:${t}`,
      `--reef-card-foreground:${t}`,
      `--reef-muted:color-mix(in oklab, ${f} 92%, ${t} 8%)`,
      `--reef-surface:color-mix(in oklab, ${f} 92%, ${t} 8%)`,
      `--reef-card:color-mix(in oklab, ${f} 92%, ${t} 8%)`,
      `--reef-muted-foreground:color-mix(in oklab, ${t} 70%, ${f})`,
      `--reef-border:color-mix(in oklab, ${t} 15%, transparent)`,
    );
  }
  const principale = change(c?.principale, DEFAUTS.sombre.principale);
  if (principale) {
    r.push(
      `--reef-primary:${principale}`,
      `--reef-primary-foreground:${encreSur(principale)}`,
      `--reef-primary-text:${principale}`,
      `--reef-ring:${principale}`,
    );
  }
  const accent = change(c?.accent, DEFAUTS.sombre.accent);
  if (accent) {
    r.push(`--reef-accent:${accent}`, `--reef-accent-foreground:${encreSur(accent)}`, `--reef-accent-text:${accent}`);
  }
  return r;
}

const pile = (cle: unknown): string | undefined => (typeof cle === "string" && cle in POLICES ? POLICES[cle as ClePolice].pile : undefined);

/**
 * Le CSS a poser dans le <head> de chaque page ; une chaine vide tant que l'editeur n'a rien
 * active ni rien change. Les selecteurs sont un cran plus specifiques que ceux de tokens.css
 * (html:not(.dark) contre :root, html.dark contre .dark) : l'ordre des feuilles ne compte donc pas,
 * et les couleurs du clair ne fuient pas dans le sombre.
 */
export function cssApparence(saisie: ApparenceSaisie | null | undefined): string {
  if (!saisie || !saisie.activer) return "";
  const blocs: string[] = [];

  const clair = reglesClair(saisie.clair);
  if (clair.length > 0) blocs.push(`html:not(.dark){${clair.join(";")}}`);

  const sombre = reglesSombre(saisie.sombre);
  if (sombre.length > 0) blocs.push(`html.dark{${sombre.join(";")}}`);

  const polices: string[] = [];
  const titres = pile(saisie.polices?.titres);
  const texte = pile(saisie.polices?.texte);
  if (titres) polices.push(`--font-display:${titres}`);
  if (texte) polices.push(`--font-sans:${texte}`);
  if (polices.length > 0) blocs.push(`html:root{${polices.join(";")}}`);

  return blocs.join("\n");
}
