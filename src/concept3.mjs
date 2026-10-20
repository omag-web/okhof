// Design concept 3: /concept-3/
// Modeled on the structure of nationalsoccerhof.com: full-bleed hero with a bold stacked headline,
// feature cards, a legends split, profile cards,
// a full-width photo call to action, supporters and a large footer. Not linked; noindex.

import fs from "node:fs";
import path from "node:path";

export function buildConcept3({ ROOT, site, inductees, years, u, esc, write, role }) {
  const thumbFor = (i) => (fs.existsSync(path.join(ROOT, "media/thumbs", `${i.slug}.webp`)) ? u(`/media/thumbs/${i.slug}.webp`) : i.photoSrc);
  const arch = (name) => u(`/media/archive/${name}`);
  const concept = JSON.parse(fs.readFileSync(path.join(ROOT, "data/concept.json"), "utf8"));
  const townsOf = (i) => concept.inductees[i.slug]?.towns || [];
  const people = inductees.map((i) => ({ n: i.name, u: i.url, t: thumbFor(i), r: role(i), y: i.year, towns: townsOf(i) }));

  // ---- Map of towns: equirectangular projection corrected for Oklahoma's latitude ----
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
    const r = (3.4 + Math.sqrt(n) * 2.7).toFixed(1);
    return `<g class="town" tabindex="0" role="button" data-town="${esc(t)}" aria-label="${esc(t)}: ${n} inductee${n === 1 ? "" : "s"}"><circle cx="${px(lon)}" cy="${py(lat)}" r="${r}"></circle></g>`;
  }).join("");
  const MW = px(-94.3), MH = py(33.5);
  const topTowns = Object.entries(townCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);

  const card = (p) => `<li class="pcard"><a href="${p.u}"><span class="pcard-img"><img src="${esc(p.t)}" alt="" loading="lazy" decoding="async"></span><span class="pcard-body"><span class="pcard-year">Class of ${p.y}</span><span class="pcard-name">${esc(p.n)}</span><span class="pcard-role">${esc(p.r)}</span><span class="pcard-more">View profile</span></span></a></li>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#222222">
<title>Design concept 3 · ${esc(site.shortName)}</title>
<link rel="icon" href="${u("/assets/favicon.png")}" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${u("/assets/concept3.css")}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="note">Design concept 3 for review. Not linked from the live site. <a href="${u("/concept/")}">Concept 1</a> <a href="${u("/")}">Current site</a></div>

<header class="hdr">
  <div class="frame hdr-inner">
    <a class="hdr-brand" href="#top"><img class="hdr-word" src="${u("/media/brand/wordmark.webp")}" width="1500" height="224" alt="${esc(site.name)}"></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="hdr-nav">Menu</button>
    <nav class="hdr-nav" id="hdr-nav" aria-label="Main">
      <a href="${u("/inductees/")}">Inductees</a>
      <a href="${u("/inductees/")}">Classes</a>
      <a href="${u("/history/")}">About</a>
      <a href="${u("/photos/")}">Photos</a>
      <a class="btn btn-solid hdr-cta" href="${u("/nominate/")}">Nominate</a>
    </nav>
  </div>
</header>

<main id="main">
<section class="hero" id="top">
  <img class="hero-bg" src="${u("/media/brand/hero-dome.webp")}" alt="" fetchpriority="high">
  <div class="frame hero-inner">
    <p class="kicker">Oklahoma Hall of Fame for City and Town Officials</p>
    <h1>Honoring the leaders who built Oklahoma's cities and towns</h1>
    <div class="hero-actions">
      <a class="btn btn-solid" href="${u("/inductees/")}">Explore the inductees</a>
      <a class="btn btn-ghost" href="${u("/nominate/")}">Nominate someone</a>
    </div>
  </div>
</section>

<section class="townmap" id="towns" aria-labelledby="towns-title">
  <div class="frame townmap-grid">
    <div class="townmap-map">
      <p class="kicker kicker-dark">Across the state</p>
      <h2 id="towns-title">Find inductees by town</h2>
      <p class="townmap-lede">Inductees have served communities in every corner of Oklahoma. Choose a town on the map.</p>
      <svg class="ok-map" viewBox="0 0 ${MW} ${MH}" role="group" aria-label="Map of Oklahoma towns with inductees">
        <path class="ok-shape" d="${outlinePath}"></path>
        ${dots}
      </svg>
    </div>
    <div class="town-panel" id="town-panel" aria-live="polite">
      <h3 class="town-title" id="town-title">Most represented</h3>
      <ul class="town-top" id="town-top">${topTowns.map(([t, n]) => `<li><button type="button" class="town-link" data-town="${esc(t)}"><span>${esc(t)}</span><span>${n}</span></button></li>`).join("")}</ul>
      <ul class="town-people" id="town-people" hidden></ul>
      <p class="town-back-row" id="town-back" hidden><button type="button" class="linklike" data-back>Back to all towns</button></p>
    </div>
  </div>
</section>

<section class="legends">
  <div class="frame legends-grid">
    <figure class="legends-img"><img src="${arch("098-dsc_0393.jpg")}" alt="Hall of Fame inductees seated and standing together" loading="lazy"></figure>
    <div class="legends-copy">
      <p class="kicker kicker-dark">Since ${site.firstClass}</p>
      <h2>Oklahoma's municipal legends</h2>
      <p>The Hall of Fame recognizes public officials whose work strengthened city and town government across the state. Every inductee was nominated by peers and chosen by a board appointed by five of Oklahoma's municipal associations.</p>
      <a class="btn btn-dark" href="${u("/history/")}">Our history</a>
    </div>
  </div>
</section>

<section class="meet">
  <div class="frame">
    <div class="sec-head">
      <h2>Meet the inductees</h2>
      <a class="btn btn-outline" href="${u("/inductees/")}">View all</a>
    </div>
    <ul class="pcards" id="pcards">${people.slice(0, 4).map(card).join("")}</ul>
  </div>
</section>

<section class="cta">
  <img class="cta-bg" src="${arch("068-cz2d2084.jpg")}" alt="" loading="lazy">
  <div class="frame cta-inner">
    <p class="kicker" id="season-cta"></p>
    <h2>Know someone who belongs in the Hall?</h2>
    <p>Any elected, appointed or professional official who served an Oklahoma city, town, public trust or municipal organization with distinction can be nominated.</p>
    <a class="btn btn-solid" href="${u("/nominate/")}">Start a nomination</a>
  </div>
</section>

<section class="partners" aria-labelledby="partners-title">
  <div class="frame">
    <h2 id="partners-title">Governed and supported by Oklahoma's municipal organizations</h2>
    <ul class="partner-list">${[...site.appointingOrgs, ...site.supporters].map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
  </div>
</section>
</main>

<footer class="ftr">
  <div class="frame ftr-grid">
    <div class="ftr-brand">
      <img src="${u("/media/brand/seal.png")}" width="168" height="168" alt="">
      <p>${esc(site.name)}</p>
    </div>
    <div><h3>Visit us</h3><p>${esc(site.contact.street)}<br>${esc(site.contact.city)}, ${site.contact.state} ${site.contact.zip}</p></div>
    <div><h3>Contact</h3><p>${esc(site.contact.person)}, ${esc(site.contact.role)}<br><a href="tel:${site.contact.phoneHref}">${esc(site.contact.phone)}</a><br><a href="mailto:${site.contact.email}">${esc(site.contact.email)}</a></p></div>
    <div><h3>Explore</h3><ul><li><a href="${u("/inductees/")}">Inductees</a></li><li><a href="${u("/history/")}">History</a></li><li><a href="${u("/nominate/")}">Nominate</a></li><li><a href="${u("/photos/")}">Photos</a></li><li><a href="${u("/news/")}">News</a></li></ul></div>
  </div>
  <div class="frame ftr-base"><p>© ${new Date().getFullYear()} ${esc(site.name)}, a not-for-profit foundation established in ${site.founded}.</p></div>
</footer>

<script type="application/json" id="people">${JSON.stringify(people).replace(/</g, "\\u003c")}</script>
<script src="${u("/assets/concept3.js")}" defer></script>
</body>
</html>`;
  write("concept-3/index.html", html);
}
