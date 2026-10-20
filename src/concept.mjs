// Design concept page: /concept/
// The portrait wall, role filters, map of towns, plaque view and seasonal nomination status,
// built from the same data as the live site. Not linked from the menu and kept out of search engines.

import fs from "node:fs";
import path from "node:path";

export function buildConcept({ ROOT, site, inductees, years, u, esc, stripTags, write, role }) {
  const conceptPath = path.join(ROOT, "data/concept.json");
  if (!fs.existsSync(conceptPath)) return;
  const concept = JSON.parse(fs.readFileSync(conceptPath, "utf8"));
  const thumbDir = path.join(ROOT, "media/thumbs");

  // A pull quote: the first sentence of the bio that is about the person, not about the Hall of Fame.
  const quoteFor = (html) => {
    const sentences = stripTags(html || "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
      .split(/(?<=[.!?]["”]?)\s+(?=[A-Z“"])/);
    const good = sentences.find((s) => s.length > 60 && s.length < 260 && !/hall of fame|inductee|posthumous|foundation|nominat/i.test(s));
    return (good || sentences[0] || "").trim().replace(/^(However|But|And),\s+(\w)/, (_, w, c) => c.toUpperCase());
  };

  const people = inductees.map((i) => {
    const c = concept.inductees[i.slug] || { towns: [], roles: [] };
    const thumb = fs.existsSync(path.join(thumbDir, `${i.slug}.webp`)) ? u(`/media/thumbs/${i.slug}.webp`) : i.photoSrc;
    return {
      s: i.slug, n: i.name, u: i.url, t: thumb, p: i.photoSrc, r: role(i), y: i.year,
      towns: c.towns, roles: c.roles, q: quoteFor(i.bioHtml), v: i.videos?.[0]?.id || "", ph: !!i.posthumous,
    };
  });

  // ---- Map: simple equirectangular projection, corrected for Oklahoma's latitude ----
  const LON0 = -103.15, LAT0 = 37.12, KX = 81.5, KY = 100;
  const px = (lon) => +((lon - LON0) * KX).toFixed(1);
  const py = (lat) => +((LAT0 - lat) * KY).toFixed(1);
  const outline = [
    [-103.002, 37.0], [-94.618, 37.0], [-94.618, 36.5], [-94.55, 35.9], [-94.43, 35.39], [-94.46, 34.5], [-94.485, 33.64],
    [-94.9, 33.82], [-95.3, 33.87], [-95.8, 33.86], [-96.15, 33.82], [-96.6, 33.85], [-96.95, 33.75], [-97.15, 33.72],
    [-97.6, 33.92], [-98.05, 34.12], [-98.5, 34.14], [-98.95, 34.21], [-99.25, 34.37], [-99.6, 34.38], [-100.0, 34.56],
    [-100.0, 36.5], [-103.002, 36.5],
  ];
  const outlinePath = "M" + outline.map(([lon, lat]) => `${px(lon)},${py(lat)}`).join("L") + "Z";
  const townCounts = {};
  for (const p of people) for (const t of p.towns) townCounts[t] = (townCounts[t] || 0) + 1;
  const dots = Object.entries(townCounts).sort((a, b) => a[1] - b[1]).map(([t, n]) => {
    const [lat, lon] = concept.towns[t];
    const r = (3.2 + Math.sqrt(n) * 2.6).toFixed(1);
    return `<g class="town" tabindex="0" role="button" data-town="${esc(t)}" aria-label="${esc(t)}: ${n} inductee${n === 1 ? "" : "s"}"><circle cx="${px(lon)}" cy="${py(lat)}" r="${r}"></circle></g>`;
  }).join("");
  const W = px(-94.3), H = py(33.5);
  const topTowns = Object.entries(townCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);

  // ---- Nomination season: open January 1 through June 1 ----
  const roleChips = concept.roles.map(([k, label]) => {
    const n = people.filter((p) => p.roles.includes(k)).length;
    return `<button type="button" class="chip" data-role="${k}" aria-pressed="false">${esc(label)} <span>${n}</span></button>`;
  }).join("");

  const tiles = people.map((p) => `<li><button type="button" class="tile" data-slug="${p.s}" aria-label="${esc(p.n)}, ${esc(p.r)}, class of ${p.y}"><img src="${esc(p.t)}" alt="" loading="lazy" decoding="async" width="160" height="200"><span class="tile-label"><span class="tile-name">${esc(p.n)}</span><span class="tile-year">${p.y}</span></span></button></li>`).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Design concept · ${esc(site.shortName)}</title>
<link rel="icon" href="${u("/assets/favicon.png")}" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Public+Sans:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${u("/assets/concept.css")}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="concept-note"><div class="wrap">Design concept for review. This page isn't linked from the live site. <a href="${u("/")}">Back to the current site</a></div></div>

<header class="c-header">
  <div class="wrap c-header-inner">
    <a class="brand" href="#top"><img src="${u("/media/brand/wordmark.webp")}" width="1500" height="224" alt="${esc(site.name)}"></a>
    <nav class="c-nav" aria-label="Main">
      <a href="#hall">Inductees</a>
      <a href="#explore">Explore</a>
      <a href="#nominate">Nominate</a>
      <a href="${u("/history/")}">About</a>
    </nav>
  </div>
</header>

<main id="main">
<section class="c-hero" id="top">
  <img class="c-hero-bg" src="${u("/media/brand/hero-dome.webp")}" alt="" fetchpriority="high">
  <div class="wrap c-hero-inner">
    <h1>${inductees.length} public servants who built Oklahoma's cities and towns.</h1>
    <p>Mayors, managers, clerks, attorneys, chiefs and council members honored by the Oklahoma Hall of Fame for City and Town Officials since ${site.firstClass}.</p>
    <label class="c-search" for="wall-q">
      <span class="visually-hidden">Search inductees</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>
      <input id="wall-q" type="search" placeholder="Search by name, town or title" autocomplete="off">
    </label>
  </div>
</section>

<section class="c-hall" id="hall" aria-labelledby="hall-title">
  <div class="wrap-wide">
    <div class="hall-head">
      <h2 id="hall-title">The Hall</h2>
      <p class="hall-count" id="hall-count" aria-live="polite">All ${inductees.length} inductees, ${site.firstClass}–${years[0]}</p>
    </div>
    <div class="hall-filters">
      <div class="chips" role="group" aria-label="Filter by role">${roleChips}</div>
      <label class="class-select" for="wall-year"><span class="visually-hidden">Class</span>
        <select id="wall-year"><option value="">Every class</option>${years.map((y) => `<option value="${y}">Class of ${y}</option>`).join("")}</select>
      </label>
    </div>
    <ul class="wall" id="wall">${tiles}</ul>
    <p class="wall-empty" id="wall-empty" hidden>No inductees match. <button type="button" class="linklike" data-reset>Clear the filters</button></p>
  </div>
</section>

<section class="c-explore" id="explore" aria-labelledby="explore-title">
  <div class="wrap explore-grid">
    <div class="map-col">
      <h2 id="explore-title">Find inductees by town</h2>
      <p class="explore-lede">${Object.keys(townCounts).length} Oklahoma communities have an inductee. Choose a town on the map.</p>
      <svg class="ok-map" viewBox="0 0 ${W} ${H}" role="group" aria-label="Map of Oklahoma towns with inductees">
        <path class="ok-shape" d="${outlinePath}"></path>
        ${dots}
      </svg>
    </div>
    <div class="town-panel" id="town-panel" aria-live="polite">
      <h3 class="town-title" id="town-title">Most represented</h3>
      <ul class="town-top" id="town-top">${topTowns.map(([t, n]) => `<li><button type="button" class="town-link" data-town="${esc(t)}"><span>${esc(t)}</span><span>${n}</span></button></li>`).join("")}</ul>
      <ul class="town-people" id="town-people" hidden></ul>
    </div>
  </div>
</section>

<section class="c-nominate" id="nominate" aria-labelledby="nominate-title">
  <div class="wrap nominate-grid">
    <div>
      <p class="season" id="season"></p>
      <h2 id="nominate-title">Know someone who belongs here?</h2>
      <p>Anyone who has served an Oklahoma city, town, public trust or municipal organization with distinction and unquestioned ethics can be nominated. Up to ${site.nomination.maxPerYear} officials are inducted each year.</p>
    </div>
    <ol class="steps">
      <li><strong>Check eligibility</strong><span>The nominee's work must have made a difference beyond their own community.</span></li>
      <li><strong>Gather support</strong><span>Two to four one-page reference letters and the nominee's résumé.</span></li>
      <li><strong>Submit online</strong><span>A guided form with uploads replaces the paper application. Nominations close ${esc(site.nomination.deadline)}.</span></li>
    </ol>
  </div>
</section>
</main>

<footer class="c-footer">
  <div class="wrap c-footer-inner">
    <img class="c-footer-seal" src="${u("/media/brand/seal.png")}" width="168" height="168" alt="">
    <div>
      <p class="c-footer-name">${esc(site.name)}</p>
      <p>${esc(site.contact.street)}, ${esc(site.contact.city)}, ${site.contact.state} ${site.contact.zip}<br>${esc(site.contact.phone)}, ${esc(site.contact.email)}</p>
    </div>
  </div>
</footer>

<dialog class="plaque-panel" id="plaque" aria-labelledby="plaque-name">
  <button type="button" class="plaque-close" data-close aria-label="Close">×</button>
  <div class="plaque-body">
    <img class="plaque-img" id="plaque-img" alt="">
    <p class="plaque-class" id="plaque-class"></p>
    <h2 id="plaque-name"></h2>
    <p class="plaque-role" id="plaque-role"></p>
    <blockquote class="plaque-quote" id="plaque-quote"></blockquote>
    <ul class="plaque-towns" id="plaque-towns"></ul>
    <div class="plaque-actions">
      <a class="c-button" id="plaque-link" href="#">Read the full biography</a>
      <a class="c-button c-button-quiet" id="plaque-video" href="#" target="_blank" rel="noopener">Watch the acceptance speech</a>
    </div>
  </div>
</dialog>

<script type="application/json" id="people">${JSON.stringify(people).replace(/</g, "\\u003c")}</script>
<script src="${u("/assets/concept.js")}" defer></script>
</body>
</html>`;
  write("concept/index.html", html);
}
