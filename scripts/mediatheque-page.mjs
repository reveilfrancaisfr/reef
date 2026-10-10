// scripts/mediatheque-page.mjs - la page /mediatheque : galerie de toutes les images et videos, avec televersement par glisser-deposer. HTML autonome, sans dependance.
// Le script de la page n'emploie aucun gabarit entre accents graves : la page est elle-meme dans une chaine JavaScript.
export const PAGE = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Médiathèque</title>
<style>
  :root { color-scheme: dark; --fond:#161718; --carte:#1f2123; --bord:#33373b; --texte:#ececec; --doux:#9aa0a6; --accent:#4c8dff; --danger:#ff6b6b; }
  * { box-sizing: border-box; }
  body { margin:0; font:15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; background:var(--fond); color:var(--texte); }
  header { position:sticky; top:0; z-index:5; display:flex; flex-wrap:wrap; gap:.75rem 1.25rem; align-items:center; padding:.9rem 1.5rem; background:rgba(22,23,24,.94); backdrop-filter:blur(8px); border-bottom:1px solid var(--bord); }
  h1 { margin:0; font-size:1.15rem; }
  .compte { color:var(--doux); font-size:.85rem; }
  .outils { display:flex; flex-wrap:wrap; gap:.5rem; margin-left:auto; align-items:center; }
  input[type=search] { background:var(--carte); color:inherit; border:1px solid var(--bord); border-radius:8px; padding:.5rem .75rem; min-width:14rem; }
  .filtres { display:flex; border:1px solid var(--bord); border-radius:8px; overflow:hidden; }
  .filtres button { background:transparent; color:var(--doux); border:0; padding:.5rem .8rem; cursor:pointer; }
  .filtres button[aria-pressed=true] { background:var(--accent); color:#fff; }
  main { padding:1.25rem 1.5rem 4rem; max-width:96rem; margin:0 auto; }
  #zone { border:2px dashed var(--bord); border-radius:14px; padding:1.4rem; text-align:center; color:var(--doux); cursor:pointer; transition:.15s; }
  #zone.survol { border-color:var(--accent); background:rgba(76,141,255,.08); color:var(--texte); }
  #zone strong { color:var(--texte); }
  #zone small { display:block; margin-top:.35rem; }
  #envois { list-style:none; padding:0; margin:.75rem 0 0; display:grid; gap:.4rem; }
  #envois li { display:grid; grid-template-columns:1fr auto; gap:.2rem .75rem; align-items:center; font-size:.85rem; background:var(--carte); border:1px solid var(--bord); border-radius:8px; padding:.45rem .7rem; }
  #envois progress { grid-column:1 / -1; width:100%; height:5px; }
  #envois .erreur { color:var(--danger); }
  #grille { display:grid; gap:1rem; margin-top:1.25rem; grid-template-columns:repeat(auto-fill, minmax(14rem, 1fr)); }
  .media { background:var(--carte); border:1px solid var(--bord); border-radius:12px; overflow:hidden; display:flex; flex-direction:column; }
  .vignette { position:relative; aspect-ratio:4 / 3; background:#0d0e0f; cursor:zoom-in; border:0; padding:0; display:block; width:100%; }
  .vignette img, .vignette video { width:100%; height:100%; object-fit:cover; display:block; }
  .genre { position:absolute; top:.5rem; left:.5rem; background:rgba(0,0,0,.65); color:#fff; font-size:.7rem; padding:.15rem .5rem; border-radius:999px; }
  .infos { padding:.65rem .8rem .3rem; min-width:0; }
  .nom { font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .meta { color:var(--doux); font-size:.8rem; }
  .meta .usage { color:#7fd68a; }
  .meta .libre { color:#e5b567; }
  .actions { display:flex; gap:.4rem; padding:.5rem .8rem .8rem; margin-top:auto; flex-wrap:wrap; }
  .actions button, .actions a { background:transparent; color:var(--texte); border:1px solid var(--bord); border-radius:8px; padding:.35rem .6rem; font-size:.8rem; cursor:pointer; text-decoration:none; }
  .actions button:hover, .actions a:hover { border-color:var(--accent); }
  .actions .suppr { margin-left:auto; color:var(--danger); }
  .vide { color:var(--doux); text-align:center; padding:3rem 1rem; grid-column:1 / -1; }
  #toast { position:fixed; bottom:1.25rem; left:50%; transform:translateX(-50%); background:#fff; color:#111; padding:.6rem 1rem; border-radius:10px; font-size:.9rem; opacity:0; pointer-events:none; transition:.2s; z-index:20; }
  #toast.visible { opacity:1; }
  dialog { background:var(--carte); color:var(--texte); border:1px solid var(--bord); border-radius:14px; max-width:min(92vw, 70rem); padding:1rem; }
  dialog::backdrop { background:rgba(0,0,0,.75); }
  dialog img, dialog video { max-width:100%; max-height:78vh; display:block; margin:auto; border-radius:8px; }
  dialog form { text-align:right; margin-top:.75rem; }
  dialog button { background:var(--accent); color:#fff; border:0; border-radius:8px; padding:.45rem .9rem; cursor:pointer; }
</style>
</head>
<body>
<header>
  <h1>Médiathèque</h1>
  <span class="compte" id="compte"></span>
  <div class="outils">
    <input type="search" id="recherche" placeholder="Rechercher un nom…" aria-label="Rechercher">
    <div class="filtres" role="group" aria-label="Type">
      <button type="button" data-filtre="tous" aria-pressed="true">Tout</button>
      <button type="button" data-filtre="image" aria-pressed="false">Images</button>
      <button type="button" data-filtre="video" aria-pressed="false">Vidéos</button>
    </div>
  </div>
</header>
<main>
  <div id="zone" tabindex="0" role="button" aria-label="Ajouter des fichiers">
    <strong>Glissez vos images et vidéos ici</strong>, ou cliquez pour les choisir
    <small>Images : JPG, PNG, WebP, AVIF, GIF · Vidéos : MP4, WebM, MOV · 100 Mo maximum par fichier. Les grandes photos sont réduites à 2400 px de large.</small>
    <input id="champ" type="file" multiple hidden accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime">
  </div>
  <ul id="envois" aria-live="polite"></ul>
  <div id="grille"></div>
</main>
<div id="toast" role="status"></div>
<dialog id="apercu"><div id="apercuContenu"></div><form method="dialog"><button>Fermer</button></form></dialog>
<script>
(function () {
  var etat = { medias: [], filtre: "tous", recherche: "" };
  var grille = document.getElementById("grille");
  var zone = document.getElementById("zone");
  var champ = document.getElementById("champ");
  var envois = document.getElementById("envois");

  function taille(octets) {
    if (octets > 1048576) return (octets / 1048576).toFixed(1).replace(".", ",") + " Mo";
    return Math.max(1, Math.round(octets / 1024)) + " Ko";
  }
  function annoncer(texte) {
    var t = document.getElementById("toast");
    t.textContent = texte;
    t.classList.add("visible");
    clearTimeout(annoncer.minuteur);
    annoncer.minuteur = setTimeout(function () { t.classList.remove("visible"); }, 2600);
  }
  function element(nom, classe, texte) {
    var e = document.createElement(nom);
    if (classe) e.className = classe;
    if (texte !== undefined) e.textContent = texte;
    return e;
  }

  function charger() {
    return fetch("/api/mediatheque").then(function (r) { return r.json(); }).then(function (d) {
      etat.medias = d.medias || [];
      dessiner();
    }).catch(function () { annoncer("Impossible de lire la médiathèque."); });
  }

  function visibles() {
    var q = etat.recherche.trim().toLowerCase();
    return etat.medias.filter(function (m) {
      return (etat.filtre === "tous" || m.type === etat.filtre) && (!q || m.nom.toLowerCase().indexOf(q) !== -1);
    });
  }

  function dessiner() {
    var liste = visibles();
    var total = etat.medias.reduce(function (s, m) { return s + m.taille; }, 0);
    document.getElementById("compte").textContent = etat.medias.length + " fichier(s) · " + taille(total);
    grille.textContent = "";
    if (liste.length === 0) {
      grille.appendChild(element("p", "vide", etat.medias.length === 0 ? "Aucun fichier pour l'instant. Glissez-en ci-dessus." : "Rien ne correspond à cette recherche."));
      return;
    }
    liste.forEach(function (m) { grille.appendChild(carte(m)); });
  }

  function carte(m) {
    var c = element("article", "media");
    var v = element("button", "vignette");
    v.type = "button";
    v.setAttribute("aria-label", "Agrandir " + m.nom);
    var visuel;
    if (m.type === "video") { visuel = document.createElement("video"); visuel.muted = true; visuel.preload = "metadata"; visuel.src = m.url + "#t=0.1"; }
    else { visuel = document.createElement("img"); visuel.loading = "lazy"; visuel.alt = ""; visuel.src = m.url; }
    v.appendChild(visuel);
    v.appendChild(element("span", "genre", m.type === "video" ? "Vidéo" : "Image"));
    v.addEventListener("click", function () { agrandir(m); });
    c.appendChild(v);

    var infos = element("div", "infos");
    infos.appendChild(element("div", "nom", m.nom));
    var meta = element("div", "meta", taille(m.taille) + " · ");
    var usage = element("span", m.utilisations.length ? "usage" : "libre", m.utilisations.length ? "utilisée " + m.utilisations.length + " fois" : "non utilisée");
    if (m.utilisations.length) usage.title = m.utilisations.join("\\n");
    meta.appendChild(usage);
    infos.appendChild(meta);
    c.appendChild(infos);

    var actions = element("div", "actions");
    var copier = element("button", "", "Copier l'adresse");
    copier.type = "button";
    copier.addEventListener("click", function () {
      var fin = function () { annoncer("Adresse copiée : " + m.url); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(m.url).then(fin, function () { window.prompt("Copiez l'adresse :", m.url); });
      else window.prompt("Copiez l'adresse :", m.url);
    });
    actions.appendChild(copier);
    var ouvrir = element("a", "", "Ouvrir");
    ouvrir.href = m.url; ouvrir.target = "_blank"; ouvrir.rel = "noopener";
    actions.appendChild(ouvrir);
    var suppr = element("button", "suppr", "Supprimer");
    suppr.type = "button";
    suppr.addEventListener("click", function () { supprimer(m); });
    actions.appendChild(suppr);
    c.appendChild(actions);
    return c;
  }

  function agrandir(m) {
    var conteneur = document.getElementById("apercuContenu");
    conteneur.textContent = "";
    var e;
    if (m.type === "video") { e = document.createElement("video"); e.controls = true; e.src = m.url; }
    else { e = document.createElement("img"); e.src = m.url; e.alt = m.nom; }
    conteneur.appendChild(e);
    var d = document.getElementById("apercu");
    d.addEventListener("close", function () { conteneur.textContent = ""; }, { once: true });
    d.showModal();
  }

  function supprimer(m) {
    var avertissement = m.utilisations.length
      ? "Ce fichier est utilisé dans :\\n- " + m.utilisations.join("\\n- ") + "\\n\\nLe supprimer cassera ces emplacements. Continuer ?"
      : "Supprimer " + m.nom + " ?";
    if (!window.confirm(avertissement)) return;
    fetch("/api/mediatheque?nom=" + encodeURIComponent(m.nom), { method: "DELETE", headers: { "X-Mediatheque": "1" } })
      .then(function (r) { if (!r.ok) throw new Error(); annoncer(m.nom + " supprimé."); return charger(); })
      .catch(function () { annoncer("La suppression a échoué."); });
  }

  function envoyer(fichier) {
    var ligne = element("li");
    ligne.appendChild(element("span", "", fichier.name));
    var etatLigne = element("span", "", "0 %");
    ligne.appendChild(etatLigne);
    var barre = document.createElement("progress");
    barre.max = 100; barre.value = 0;
    ligne.appendChild(barre);
    envois.appendChild(ligne);
    return new Promise(function (fini) {
      var donnees = new FormData();
      donnees.append("fichiers", fichier);
      var x = new XMLHttpRequest();
      x.open("POST", "/api/mediatheque");
      x.setRequestHeader("X-Mediatheque", "1");
      x.upload.onprogress = function (e) {
        if (!e.lengthComputable) return;
        var p = Math.round((e.loaded / e.total) * 100);
        barre.value = p; etatLigne.textContent = p + " %";
      };
      x.onload = function () {
        var reponse = {};
        try { reponse = JSON.parse(x.responseText); } catch (e) {}
        if (x.status === 200 && reponse.ajoutes && reponse.ajoutes.length) {
          etatLigne.textContent = "ajouté" + (reponse.ajoutes[0].optimise ? " (réduit)" : "");
          barre.remove();
        } else {
          var refus = (reponse.refuses && reponse.refuses[0] && reponse.refuses[0].raison) || reponse.erreur || "refusé";
          etatLigne.textContent = refus; etatLigne.className = "erreur"; barre.remove();
        }
        fini();
      };
      x.onerror = function () { etatLigne.textContent = "échec de l'envoi"; etatLigne.className = "erreur"; barre.remove(); fini(); };
      x.send(donnees);
    });
  }

  function envoyerTous(fichiers) {
    var liste = Array.prototype.slice.call(fichiers);
    if (!liste.length) return;
    envois.textContent = "";
    liste.reduce(function (suite, f) { return suite.then(function () { return envoyer(f); }); }, Promise.resolve())
      .then(function () { return charger(); })
      .then(function () { setTimeout(function () { envois.textContent = ""; }, 6000); });
  }

  zone.addEventListener("click", function () { champ.click(); });
  zone.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); champ.click(); } });
  champ.addEventListener("change", function () { envoyerTous(champ.files); champ.value = ""; });
  ["dragenter", "dragover"].forEach(function (nom) { document.addEventListener(nom, function (e) { e.preventDefault(); zone.classList.add("survol"); }); });
  ["dragleave", "drop"].forEach(function (nom) { document.addEventListener(nom, function (e) { e.preventDefault(); if (nom === "drop" || e.target === document.documentElement) zone.classList.remove("survol"); }); });
  document.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files) envoyerTous(e.dataTransfer.files); });

  document.getElementById("recherche").addEventListener("input", function (e) { etat.recherche = e.target.value; dessiner(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-filtre]"), function (b) {
    b.addEventListener("click", function () {
      etat.filtre = b.dataset.filtre;
      Array.prototype.forEach.call(document.querySelectorAll("[data-filtre]"), function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      dessiner();
    });
  });

  charger();
})();
</script>
</body>
</html>`;
