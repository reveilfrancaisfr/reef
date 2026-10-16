// src/components/Sections/Global/_traduction.ts - la traduction automatique des pages SANS jumelle : le widget GTranslate prend le relais quand l'autre langue n'existe pas.
//
// LA REGLE. Un clic sur l'autre langue du selecteur (LocaleSwitcher.astro) va a la page jumelle, comme toujours, SI elle existe.
// Sinon, la page reste affichee et le widget la traduit. Le choix est retenu pour la visite (sessionStorage) : sur chaque
// page suivante, le site va a la version de la langue choisie si elle existe, et traduit sur place sinon.
//
// CE QUE CE FICHIER NE FAIT PAS. Il ne modifie pas le selecteur de langue : il ecoute le clic AVANT lui (phase de capture),
// annule la navigation du lien, puis decide. Le gestionnaire du selecteur tourne ensuite comme d'habitude (cookie de langue,
// glissement du curseur). Aucun widget n'est charge tant qu'une page sans jumelle n'a pas ete rencontree.
//
// LE ROUTEUR DE PAGES. Un widget qui traduit la page en place ne survit pas au remplacement du contenu par ClientRouter.
// Tant qu'une page est traduite (ou doit l'etre), astro:before-preparation est annule : Astro laisse alors le navigateur
// charger la page entiere (router.js : "not aborted -> delegate to browser"), et le widget repart de zero sur chaque page.
//
// Tout passe par un objet `Env` : le fichier se teste sans navigateur (voir demarrerDepuisLaPage pour le vrai).

/** La cle de sessionStorage : la langue dans laquelle le visiteur veut lire. */
export const CLE = "reef:traduction-auto";
const SCRIPT_DU_WIDGET = "https://cdn.gtranslate.net/widgets/latest/dropdown.js";

export interface ConfigTraduction {
  /** Le texte du bandeau, par langue VERS laquelle on traduit. */
  textes: Record<string, { avertissement: string; original: string }>;
  /** L'adresse du script du widget ; absente, celle de GTranslate. */
  script?: string;
}

type FenetreDuWidget = Window & {
  gtranslateSettings?: unknown;
  doGTranslate?: (paire: string) => void;
  GTranslateGetCurrentLang?: () => string | undefined;
  __traductionEnCours?: boolean;
};

export interface Env {
  doc: Document;
  win: FenetreDuWidget;
  fetchFn: (adresse: string, options?: RequestInit) => Promise<{ ok: boolean; status: number }>;
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
  aller: (adresse: string) => void;
  remplacer: (adresse: string) => void;
  recharger: () => void;
  attendre: (ms: number) => Promise<void>;
  config: ConfigTraduction;
}

/** "fr-FR" et "fr" donnent "fr". */
export const primaire = (code: string | null | undefined): string => (code ?? "").split("-")[0].toLowerCase();

export const langueDeLaPage = (doc: Document): string => primaire(doc.documentElement.lang);

export function lireCible(env: Env): string | null {
  try {
    return env.storage?.getItem(CLE) || null;
  } catch {
    return null;
  }
}

export function ecrireCible(env: Env, cible: string | null): void {
  try {
    if (cible) env.storage?.setItem(CLE, cible);
    else env.storage?.removeItem(CLE);
  } catch {
    // sessionStorage indisponible (navigation privee stricte) : la traduction marche sur la page courante, sans memoire.
  }
}

/** La page existe-t-elle ? true, false, ou null si on ne sait pas (erreur reseau ou serveur) : dans le doute, on ne touche a rien. */
export async function existe(env: Env, adresse: string): Promise<boolean | null> {
  try {
    const reponse = await env.fetchFn(adresse, { method: "HEAD", cache: "no-store", credentials: "same-origin" });
    if (reponse.ok) return true;
    if (reponse.status === 404 || reponse.status === 410) return false;
    return null;
  } catch {
    return null;
  }
}

/** L'adresse (chemin) de la jumelle dans la langue voulue, lue dans les balises hreflang de la page ; null sans balise (page introuvable). */
export function jumelle(doc: Document, cible: string): string | null {
  for (const lien of Array.from(doc.querySelectorAll<HTMLLinkElement>("link[rel='alternate'][hreflang]"))) {
    if (primaire(lien.getAttribute("hreflang")) !== cible) continue;
    try {
      const url = new URL(lien.href, doc.baseURI);
      // Un chemin et non l'adresse complete : sur un deploiement d'apercu, l'adresse du site (Astro.site) n'est pas celle de la page.
      return `${url.pathname}${url.search}`;
    } catch {
      return null;
    }
  }
  return null;
}

function bandeau(doc: Document): HTMLElement | null {
  return doc.querySelector<HTMLElement>("[data-traduction-bandeau]");
}

function afficherLeBandeau(env: Env, vers: string): void {
  const el = bandeau(env.doc);
  if (!el) return;
  const textes = env.config.textes[vers] ?? Object.values(env.config.textes)[0];
  if (!textes) return;
  const phrase = el.querySelector("[data-traduction-texte]");
  const bouton = el.querySelector("[data-traduction-original]");
  if (phrase) phrase.textContent = textes.avertissement;
  if (bouton) bouton.textContent = textes.original;
  el.hidden = false;
}

function masquerLeBandeau(env: Env): void {
  const el = bandeau(env.doc);
  if (el) el.hidden = true;
}

/** Le widget decide seul, au chargement, de traduire si ce cookie existe ; il est donc pose AVANT de charger son script. */
function poserLeCookie(env: Env, de: string, vers: string): void {
  env.doc.cookie = `googtrans=/${de}/${vers}; Path=/; SameSite=Lax`;
}

function effacerLeCookie(env: Env): void {
  const hote = env.doc.location?.hostname ?? "";
  const variantes = ["", hote ? `; Domain=${hote}` : "", hote ? `; Domain=.${hote}` : ""];
  for (const domaine of variantes) env.doc.cookie = `googtrans=; Path=/; Max-Age=0${domaine}`;
}

function relancer(env: Env, de: string, vers: string): void {
  const w = env.win;
  if (typeof w.doGTranslate !== "function") return;
  let courante: string | undefined;
  try {
    courante = w.GTranslateGetCurrentLang?.();
  } catch {
    courante = undefined;
  }
  if (primaire(courante) === vers) return;
  w.doGTranslate(`${de}|${vers}`);
}

/** Traduit la page affichee, de `de` vers `vers`, avec le widget. Une seule fois par document. */
export function traduireSurPlace(env: Env, de: string, vers: string): void {
  const { doc, win } = env;
  if (win.__traductionEnCours) return;
  win.__traductionEnCours = true;
  doc.documentElement.dataset.traductionOrigine = de;

  poserLeCookie(env, de, vers);

  // Ce que le widget ne doit pas toucher : le nom du site.
  for (const el of Array.from(doc.querySelectorAll("[data-header-brand], [data-traduction-non-traduire]"))) {
    el.setAttribute("translate", "no");
  }

  afficherLeBandeau(env, vers);

  win.gtranslateSettings = { default_language: de, languages: [de, vers], wrapper_selector: "#traduction-auto-cache" };
  const script = doc.createElement("script");
  script.src = env.config.script ?? SCRIPT_DU_WIDGET;
  script.defer = true;
  // Au chargement le cookie suffit normalement ; si le widget ne s'est pas mis en route, on le lui demande une fois.
  script.addEventListener("load", () => {
    void env.attendre(1500).then(() => relancer(env, de, vers));
  });
  doc.head.append(script);
}

/** A chaque page : si le visiteur a choisi une langue, aller a la jumelle si elle existe, sinon traduire sur place. */
export async function appliquer(env: Env): Promise<void> {
  const cible = lireCible(env);
  if (!cible) return;
  const page = langueDeLaPage(env.doc);
  if (page === cible) {
    masquerLeBandeau(env);
    return;
  }
  const adresse = jumelle(env.doc, cible);
  if (!adresse) return; // page introuvable : ni hreflang, ni traduction
  const presente = await existe(env, adresse);
  if (presente === true) {
    env.remplacer(adresse);
    return;
  }
  if (presente === null) return;
  traduireSurPlace(env, page, cible);
}

/** Le clic sur une langue du selecteur : la jumelle si elle existe, le widget sinon. */
export function surClicSurUneLangue(env: Env, evenement: MouseEvent): void {
  if (evenement.defaultPrevented || evenement.button !== 0) return;
  if (evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return; // nouvel onglet : on laisse faire
  const source = evenement.target as Element | null;
  // Le selecteur ne rend que des ancres : pas besoin de verifier le type de l'element.
  const lien = source?.closest?.("[data-slot='locale-switcher'] a[hreflang]") as HTMLAnchorElement | null | undefined;
  if (!lien) return;

  const cible = primaire(lien.getAttribute("hreflang"));
  const adresse = `${lien.pathname}${lien.search}`;
  const de = env.doc.documentElement.dataset.traductionOrigine || langueDeLaPage(env.doc);
  if (!cible || cible === de) return;

  // Annule la navigation du lien, tout de suite : la reponse du serveur arrive apres. Le gestionnaire du selecteur
  // (cookie de langue, glissement du curseur) tourne ensuite normalement, il ne tient pas compte de cette annulation.
  evenement.preventDefault();
  ecrireCible(env, cible);
  void existe(env, adresse).then((presente) => {
    if (presente === false) traduireSurPlace(env, de, cible);
    else env.aller(adresse); // elle existe, ou on ne sait pas : comportement habituel
  });
}

/** Tant qu'une page est ou doit etre traduite, chaque navigation est une page entiere (le widget ne survit pas au remplacement du contenu). */
export function avantLaNavigation(env: Env, evenement: Event): void {
  const cible = lireCible(env);
  if (!cible) return;
  const traduite = Boolean(env.doc.documentElement.dataset.traductionOrigine);
  if (traduite || langueDeLaPage(env.doc) !== cible) evenement.preventDefault();
}

/** "Voir l'original" : on oublie le choix, on efface le cookie du widget, on recharge. */
export function revenirALOriginal(env: Env): void {
  ecrireCible(env, null);
  effacerLeCookie(env);
  env.recharger();
}

/** Branche les ecouteurs, une seule fois par document. */
export function demarrer(env: Env): void {
  const racine = env.doc.documentElement;
  if (racine.dataset.traductionBranchee === "true") return;
  racine.dataset.traductionBranchee = "true";

  env.doc.addEventListener("click", (e) => surClicSurUneLangue(env, e as MouseEvent), true);
  env.doc.addEventListener("click", (e) => {
    const bouton = (e.target as Element | null)?.closest?.("[data-traduction-original]");
    if (bouton) revenirALOriginal(env);
  });
  env.doc.addEventListener("astro:before-preparation", (e) => avantLaNavigation(env, e));
  env.doc.addEventListener("astro:page-load", () => void appliquer(env));
  void appliquer(env);
}

/** Le vrai navigateur : lit la configuration posee par TraductionAuto.astro ; sans elle (reglage decoche), ne fait rien. */
export function demarrerDepuisLaPage(): void {
  const noeud = document.getElementById("traduction-auto-config");
  if (!noeud) return;
  let config: ConfigTraduction;
  try {
    config = JSON.parse(noeud.textContent ?? "") as ConfigTraduction;
  } catch {
    return;
  }
  let storage: Env["storage"] = null;
  try {
    storage = window.sessionStorage;
  } catch {
    storage = null;
  }
  demarrer({
    doc: document,
    win: window as FenetreDuWidget,
    fetchFn: (adresse, options) => window.fetch(adresse, options),
    storage,
    aller: (adresse) => window.location.assign(adresse),
    remplacer: (adresse) => window.location.replace(adresse),
    recharger: () => window.location.reload(),
    attendre: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    config,
  });
}
