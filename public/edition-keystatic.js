/*
 * public/edition-keystatic.js - le mode edition Keystatic : pastilles "Modifier" sur les blocs, panneau Keystatic a droite.
 *
 * Charge seulement quand le mode est allume (?edition=1, retenu pour la session ; ?edition=0 l'eteint)
 * par le petit script de BaseLayout.astro. Un visiteur ne telecharge jamais ce fichier.
 *
 * Les blocs viennent de <script type="application/json" id="ks-edition-donnees"> (src/moteur/edition-keystatic.ts) :
 * le script les associe, dans l'ordre, aux enfants de <main id="content">. Si le compte ne tombe pas juste,
 * les pastilles sont desactivees et la barre le dit. Les pages sans donnees n'ont que la barre, dont le
 * bouton "Modifier cette page" ouvre le bon formulaire d'apres l'adresse.
 */
(function () {
  "use strict";

  if (window.__ksEdition) {
    window.__ksEdition.demarrer();
    return;
  }

  var LOCAL = /^(localhost|127\.0\.0\.1)$|\.github\.dev$/.test(location.hostname);
  var RACINE = LOCAL ? "/keystatic" : "/keystatic/branch/main";

  var etat = { couche: null, barre: null, panneau: null, items: [], attente: false, observateur: null };

  var CSS =
    ".ksed-barre{position:fixed;left:12px;bottom:12px;z-index:2147483600;font:13px/1.3 system-ui,sans-serif;background:#111827;color:#fff;border-radius:10px;padding:8px 10px;box-shadow:0 4px 16px rgba(0,0,0,.35);display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-width:calc(100vw - 24px)}" +
    ".ksed-barre strong{font-size:12px;letter-spacing:.02em}" +
    ".ksed-barre button,.ksed-onglet,.ksed-act{cursor:pointer;border:0;border-radius:6px;padding:5px 9px;background:#374151;color:#fff;font:600 12px system-ui,sans-serif}" +
    ".ksed-barre button:hover,.ksed-onglet:hover,.ksed-act:hover{background:#4b5563}" +
    ".ksed-avis{flex-basis:100%;font-size:11px;color:#fcd34d}" +
    ".ksed-couche{position:absolute;top:0;left:0;width:0;height:0;z-index:2147483000}" +
    ".ksed-cadre{position:absolute;pointer-events:none;border:2px dashed #2563eb;background:rgba(37,99,235,.06);display:none;z-index:0}" +
    ".ksed-pastille{position:absolute;z-index:1;cursor:pointer;border:0;border-radius:999px;padding:6px 12px;background:#2563eb;color:#fff;font:600 12px/1.2 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.35)}" +
    ".ksed-pastille:hover{background:#1d4ed8}" +
    ".ksed-panneau{position:fixed;top:0;right:0;bottom:0;width:min(46vw,680px);z-index:2147483640;background:#fff;color:#111827;display:flex;flex-direction:column;box-shadow:-6px 0 24px rgba(0,0,0,.3);font:13px system-ui,sans-serif}" +
    "@media(max-width:900px){.ksed-panneau{width:100vw}}" +
    ".ksed-haut{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 10px;background:#111827;color:#fff}" +
    ".ksed-onglets{display:flex;gap:4px;flex-wrap:wrap}" +
    ".ksed-onglet[aria-pressed=true]{background:#2563eb}" +
    ".ksed-actions{margin-left:auto;display:flex;gap:4px}" +
    ".ksed-note{padding:5px 10px;background:#f3f4f6;color:#4b5563;font-size:11px}" +
    ".ksed-iframe{flex:1;border:0;width:100%;background:#fff}";

  function el(balise, attributs, enfants) {
    var e = document.createElement(balise);
    for (var k in attributs || {}) {
      if (k === "texte") e.textContent = attributs[k];
      else if (k === "classe") e.className = attributs[k];
      else e.setAttribute(k, attributs[k]);
    }
    (enfants || []).forEach(function (c) {
      e.appendChild(c);
    });
    return e;
  }

  function lien(chemin) {
    return RACINE + "/" + chemin;
  }

  function langue() {
    return /^\/fr(\/|$)/.test(location.pathname) ? "fr" : "en";
  }

  /** Le formulaire de la page en cours d'apres son adresse, ou null. */
  function pageCourante() {
    var s = langue() === "fr" ? "Fr" : "En";
    var p = location.pathname.replace(/^\/fr(?=\/|$)/, "").replace(/\/+$/, "") || "/";
    var seuls = {
      "/": "accueil",
      "/about": "aPropos",
      "/contact": "contact",
      "/topics": "sujets",
      "/authors": "auteurs",
      "/search": "recherche",
      "/privacy": "confidentialite",
      "/terms": "conditions",
      "/legal": "mentions",
    };
    if (seuls[p]) return { texte: "Cette page", chemin: "singleton/" + seuls[p] + s };
    var m;
    if (p === "/blog" || /^\/blog\/\d+$/.test(p)) return { texte: "Articles", chemin: "collection/articles" + s };
    if ((m = /^\/blog\/([^/]+)$/.exec(p))) return { texte: "Cet article", chemin: "collection/articles" + s + "/item/" + m[1] };
    if ((m = /^\/p\/([^/]+)$/.exec(p))) return { texte: "Cette page libre", chemin: "collection/pagesLibres/item/" + m[1] };
    if ((m = /^\/topics\/([^/]+)(?:\/\d+)?$/.exec(p))) return { texte: "Ce sujet", chemin: "collection/ficheSujet" + s + "/item/" + m[1] };
    if ((m = /^\/authors\/([^/]+)$/.exec(p))) return { texte: "Cet auteur", chemin: "collection/ficheAuteur" + s + "/item/" + m[1] };
    return null;
  }

  function lireDonnees() {
    var e = document.getElementById("ks-edition-donnees");
    if (!e) return null;
    try {
      return JSON.parse(e.textContent || "");
    } catch (erreur) {
      return null;
    }
  }

  /** Les blocs du DOM : les enfants de <main>, sans scripts ni espaceurs vides. */
  function blocsDuDom() {
    var main = document.getElementById("content");
    if (!main) return [];
    return Array.prototype.filter.call(main.children, function (e) {
      var t = e.tagName;
      if (t === "SCRIPT" || t === "STYLE" || t === "TEMPLATE") return false;
      if (e.getAttribute("aria-hidden") === "true" && !e.textContent.trim()) return false;
      return true;
    });
  }

  /* ---------------------------------------------------------------- */
  /* Panneau Keystatic a droite                                       */
  /* ---------------------------------------------------------------- */

  function fermerPanneau() {
    if (etat.panneau) {
      etat.panneau.remove();
      etat.panneau = null;
    }
  }

  function ouvrirPanneau(titre, liens) {
    fermerPanneau();
    if (!liens || liens.length === 0) return;

    var cible = liens[0].chemin;
    var iframe = el("iframe", { classe: "ksed-iframe", title: titre });
    var onglets = el("div", { classe: "ksed-onglets" });

    function aller(i) {
      cible = liens[i].chemin;
      iframe.src = lien(cible);
      Array.prototype.forEach.call(onglets.children, function (b, j) {
        b.setAttribute("aria-pressed", j === i ? "true" : "false");
      });
    }

    liens.forEach(function (l, i) {
      var b = el("button", { type: "button", classe: "ksed-onglet", texte: l.texte });
      b.addEventListener("click", function () {
        aller(i);
      });
      onglets.appendChild(b);
    });

    var ouvrirOnglet = el("button", { type: "button", classe: "ksed-act", texte: "↗ Onglet", title: "Ouvrir ce formulaire dans un onglet" });
    ouvrirOnglet.addEventListener("click", function () {
      window.open(lien(cible), "_blank", "noopener");
    });
    var recharger = el("button", { type: "button", classe: "ksed-act", texte: "⟳ Page", title: "Recharger la page du site (après un Save, attendez la reconstruction)" });
    recharger.addEventListener("click", function () {
      location.reload();
    });
    var fermer = el("button", { type: "button", classe: "ksed-act", texte: "✕", title: "Fermer (Échap)" });
    fermer.addEventListener("click", fermerPanneau);

    var haut = el("div", { classe: "ksed-haut" }, [
      el("strong", { texte: titre }),
      onglets,
      el("div", { classe: "ksed-actions" }, [ouvrirOnglet, recharger, fermer]),
    ]);
    var note = el("div", {
      classe: "ksed-note",
      texte: LOCAL
        ? "Après un Save, la page se met à jour toute seule."
        : "Après un Save, le site se reconstruit (environ une minute) : cliquez ensuite sur « ⟳ Page ». Si le cadre reste vide, ouvrez Keystatic une fois dans un onglet pour vous connecter.",
    });

    etat.panneau = el("div", { classe: "ksed-panneau", role: "dialog", "aria-label": titre }, [haut, note, iframe]);
    document.body.appendChild(etat.panneau);
    aller(0);
  }

  /* ---------------------------------------------------------------- */
  /* Pastilles sur les blocs                                          */
  /* ---------------------------------------------------------------- */

  function placer() {
    etat.attente = false;
    etat.items.forEach(function (item) {
      var r = item.bloc.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        item.pastille.style.display = "none";
        return;
      }
      var haut = r.top + window.pageYOffset;
      var gauche = r.left + window.pageXOffset;
      item.pastille.style.display = "";
      item.pastille.style.top = haut + (haut < 90 ? 84 : 10) + "px";
      item.pastille.style.left = Math.max(8, gauche + r.width - item.pastille.offsetWidth - 12) + "px";
      item.cadre.style.top = haut + "px";
      item.cadre.style.left = gauche + "px";
      item.cadre.style.width = r.width + "px";
      item.cadre.style.height = r.height + "px";
    });
  }

  function replanifier() {
    if (etat.attente) return;
    etat.attente = true;
    window.requestAnimationFrame(placer);
  }

  function poserPastilles(donnees) {
    var blocs = blocsDuDom();
    if (!donnees || !donnees.blocs) return null;
    if (blocs.length !== donnees.blocs.length) {
      var avis = donnees.blocs.length + " blocs attendus, " + blocs.length + " trouvés : pastilles désactivées.";
      if (window.console && console.warn) {
        console.warn("[édition Keystatic] " + avis, {
          attendus: donnees.blocs.map(function (b) {
            return b.id;
          }),
          trouves: blocs.map(function (b) {
            return b.tagName.toLowerCase() + (b.id ? "#" + b.id : "") + (b.className ? "." + String(b.className).split(" ")[0] : "");
          }),
        });
      }
      return avis;
    }

    etat.couche = el("div", { classe: "ksed-couche" });
    donnees.blocs.forEach(function (info, i) {
      var cadre = el("div", { classe: "ksed-cadre" });
      var pastille = el("button", { type: "button", classe: "ksed-pastille", texte: "✎ " + info.titre, title: "Modifier : " + info.titre });
      pastille.addEventListener("click", function () {
        ouvrirPanneau(info.titre, info.liens);
      });
      pastille.addEventListener("mouseenter", function () {
        cadre.style.display = "block";
      });
      pastille.addEventListener("mouseleave", function () {
        cadre.style.display = "none";
      });
      etat.couche.appendChild(cadre);
      etat.couche.appendChild(pastille);
      etat.items.push({ bloc: blocs[i], pastille: pastille, cadre: cadre });
    });
    document.body.appendChild(etat.couche);
    placer();
    window.setTimeout(placer, 600);
    window.setTimeout(placer, 2000);
    if (window.ResizeObserver && !etat.observateur) {
      etat.observateur = new ResizeObserver(replanifier);
      etat.observateur.observe(document.body);
    }
    return null;
  }

  /* ---------------------------------------------------------------- */
  /* Barre                                                            */
  /* ---------------------------------------------------------------- */

  function poserBarre(avis) {
    var page = pageCourante();
    var boutons = [el("strong", { texte: "Mode édition" })];

    if (page) {
      var b = el("button", { type: "button", texte: "Modifier cette page" });
      b.addEventListener("click", function () {
        ouvrirPanneau(page.texte, [page]);
      });
      boutons.push(b);
    }
    var tous = el("button", { type: "button", texte: "Tous les formulaires" });
    tous.addEventListener("click", function () {
      ouvrirPanneau("Keystatic", [{ texte: "Tableau de bord", chemin: "" }]);
    });
    boutons.push(tous);

    var quitter = el("button", { type: "button", texte: "Quitter" });
    quitter.addEventListener("click", function () {
      try {
        sessionStorage.removeItem("ks-edition");
      } catch (erreur) {
        /* rien */
      }
      location.href = location.pathname + "?edition=0";
    });
    boutons.push(quitter);

    if (avis) boutons.push(el("div", { classe: "ksed-avis", texte: avis }));
    etat.barre = el("div", { classe: "ksed-barre" }, boutons);
    document.body.appendChild(etat.barre);
  }

  /* ---------------------------------------------------------------- */
  /* Demarrage                                                        */
  /* ---------------------------------------------------------------- */

  function nettoyer() {
    fermerPanneau();
    if (etat.barre) etat.barre.remove();
    if (etat.couche) etat.couche.remove();
    etat.barre = null;
    etat.couche = null;
    etat.items = [];
  }

  function demarrer() {
    nettoyer();
    if (!document.getElementById("ksed-style")) {
      var style = el("style", { id: "ksed-style" });
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    var avis = poserPastilles(lireDonnees());
    poserBarre(avis);
  }

  window.addEventListener("resize", replanifier);
  window.addEventListener("load", replanifier);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") fermerPanneau();
  });
  document.addEventListener("astro:page-load", demarrer);

  window.__ksEdition = { demarrer: demarrer };
  demarrer();
})();
