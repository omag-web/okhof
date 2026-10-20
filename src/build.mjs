// Static site generator for the Oklahoma Hall of Fame for City and Town Officials.
// No framework: reads data/*.json + content/*.html, writes the finished site to dist/.
// Usage: node src/build.mjs            (BASE_PATH=/repo-name for a github.io project URL)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const readJSON = (p, fallback) => (fs.existsSync(path.join(ROOT, p)) ? JSON.parse(read(p)) : fallback);

const site = readJSON("data/site.json");
const BASE = (process.env.BASE_PATH ?? site.basePath ?? "").replace(/\/$/, "");
const u = (p = "/") => `${BASE}${p}`;
const abs = (p = "/") => `${site.url}${p}`;
const BUILD_YEAR = new Date().getFullYear();

/* ---------- helpers ---------- */
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stripTags = (h = "") => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const slugify = (s) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/["'’.]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const SUFFIX = /^(jr|sr|ii|iii|iv|phd|md|esq)$/i;
const PREFIX = /^(dr|mr|mrs|ms|hon)$/i;
const nameWords = (name) =>
  name.replace(/\([^)]*\)/g, " ").replace(/"[^"]*"/g, " ").split(/[\s,]+/)
    .map((w) => w.replace(/\./g, "")).filter((w) => w && !SUFFIX.test(w) && !PREFIX.test(w));
const lastName = (name) => { const w = nameWords(name); return w[w.length - 1] || name; };
const initials = (name) => { const w = nameWords(name); return ((w[0]?.[0] || "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); };
const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
const excerpt = (html, n = 155) => { const t = stripTags(html); return t.length > n ? t.slice(0, t.lastIndexOf(" ", n)) + "…" : t; };

// PREVIEW=1 rewrites root links to relative ones (../../inductees/index.html) so the site can be
// opened from any host or folder. Normal builds keep clean root URLs.
const PREVIEW = process.env.PREVIEW === "1";
function relativize(rel, html) {
  const up = "../".repeat(rel.split("/").length - 1);
  return html.replace(/(href|src|action|url)=(["']?)\/(?!\/)([^"'\s>]*)/g, (_, attr, q, p) => {
    const [pathPart, rest = ""] = p.split(/(?=[?#])/);
    const target = pathPart === "" || pathPart.endsWith("/") ? pathPart + "index.html" : pathPart;
    return `${attr}=${q}${up}${target}${rest}`;
  });
}
function write(rel, html) {
  if (PREVIEW && rel.endsWith(".html")) html = relativize(rel, html);
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

/* ---------- data ---------- */
const raw = readJSON("data/inductees.json", []);
const used = new Set();
const inductees = raw.map((r) => {
  let slug = r.slug || slugify(r.name.replace(/\([^)]*\)/g, " ").replace(/"[^"]*"/g, " "));
  while (used.has(slug)) slug += "-" + r.year;
  used.add(slug);
  const photo = r.photo ? u("/" + r.photo.replace(/^\//, "")) : r.photoRemote || "";
  return { ...r, slug, photoSrc: photo, sortName: r.sortName || lastName(r.name), url: u(`/inductees/${slug}/`) };
});
// Chronological order: newest class first, alphabetical inside a class.
inductees.sort((a, b) => b.year - a.year || a.sortName.localeCompare(b.sortName));
const years = [...new Set(inductees.map((i) => i.year))].sort((a, b) => b - a);
const byYear = Object.fromEntries(years.map((y) => [y, inductees.filter((i) => i.year === y)]));
const latestYear = years[0];
const photos = readJSON("data/photos.json", []);
const pages = readJSON("data/pages.json", {}); // optional overrides from the Squarespace import
// Towns each inductee served, for the home page map and search (data/towns.json)
const townData = readJSON("data/towns.json", { towns: {}, inductees: {} });
const townsOf = (i) => townData.inductees[i.slug]?.towns || [];
// Small 4:5 portrait for cards; the full photo is used on the inductee page
const thumbFor = (i) => (fs.existsSync(path.join(ROOT, "media/thumbs", `${i.slug}.webp`)) ? u(`/media/thumbs/${i.slug}.webp`) : i.photoSrc);

/* ---------- shared chrome ---------- */
const NAV = [
  ["/inductees/", "Inductees"],
  ["/history/", "History"],
  ["/photos/", "Photos"],
];

function layout({ title, description, path: p, body, active = "", jsonld = null, ogImage = "", bodyClass = "" }) {
  const fullTitle = title ? `${title} · ${site.shortName}` : site.name;
  const desc = description || site.tagline;
  const canonical = abs(p);
  const og = ogImage && /^https?:/.test(ogImage) ? ogImage : ogImage ? abs(ogImage.replace(BASE, "")) : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title || site.name)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${esc(og || abs("/media/brand/seal.png"))}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#222222">
<link rel="icon" href="${u("/assets/favicon.png")}" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${u("/assets/styles.css")}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
<header class="hdr">
  <div class="wrap hdr-inner">
    <a class="hdr-brand" href="${u("/")}"><img class="hdr-word" src="${u("/media/brand/wordmark.webp")}" width="1500" height="224" alt="${esc(site.name)}"></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="hdr-nav">Menu</button>
    <nav class="hdr-nav" id="hdr-nav" aria-label="Main">
      ${NAV.map(([href, label]) => `<a href="${u(href)}"${active === href ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
      <a class="btn btn-solid hdr-cta" href="${u("/nominate/")}"${active === "/nominate/" ? ' aria-current="page"' : ""}>Nominate</a>
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="ftr">
  <div class="wrap ftr-grid">
    <div class="ftr-brand">
      <img src="${u("/media/brand/seal.png")}" width="168" height="168" alt="">
      <p>${esc(site.name)}</p>
    </div>
    <div><h3>Visit us</h3><p>${esc(site.contact.street)}<br>${esc(site.contact.city)}, ${site.contact.state} ${site.contact.zip}</p></div>
    <div><h3>Contact</h3><p>${esc(site.contact.person)}, ${esc(site.contact.role)}<br><a href="tel:${site.contact.phoneHref}">${esc(site.contact.phone)}</a><br><a href="mailto:${site.contact.email}">${esc(site.contact.email)}</a></p></div>
    <div><h3>Explore</h3><ul><li><a href="${u("/inductees/")}">Inductees</a></li><li><a href="${u("/history/")}">History</a></li><li><a href="${u("/nominate/")}">Nominate</a></li><li><a href="${u("/photos/")}">Photos</a></li><li><a href="${u("/news/")}">News</a></li><li><a href="${u("/contact/")}">Contact</a></li></ul></div>
  </div>
  <div class="wrap ftr-base"><p>© ${BUILD_YEAR} ${esc(site.name)}, a not-for-profit foundation established in ${site.founded}.</p></div>
</footer>
<script src="${u("/assets/site.js")}" defer></script>
</body>
</html>`;
}

/* ---------- components ---------- */
function portrait(i, size = "card") {
  const src = size === "card" ? thumbFor(i) : i.photoSrc;
  if (src) return `<img src="${esc(src)}" alt="${size === "card" ? "" : `Portrait of ${esc(i.name)}`}" loading="lazy" decoding="async">`;
  return `<div class="monogram" aria-hidden="true"><span>${esc(initials(i.name))}</span></div>`;
}
function videoBlock(i) {
  if (!i.videos?.length) return "";
  return i.videos.map((v) => `
<figure class="video">
  <button type="button" class="video-play" data-youtube="${esc(v.id)}" aria-label="Play ${esc(v.label.toLowerCase())} by ${esc(i.name)}">
    <img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy" decoding="async">
    <span class="video-icon" aria-hidden="true"></span>
  </button>
  <figcaption>${esc(v.label)}, ${i.year} induction. <a href="https://www.youtube.com/watch?v=${esc(v.id)}">Watch on YouTube</a></figcaption>
</figure>`).join("");
}
function role(i) {
  return [i.title, i.city].filter(Boolean).join(", ");
}
function card(i, { showYear = true } = {}) {
  const search = [i.name, i.city, i.title, i.year, townsOf(i).join(" "), stripTags(i.bioHtml || "").slice(0, 700)].join(" ").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ");
  const label = showYear ? `Class of ${i.year}${i.posthumous ? ", posthumous" : ""}` : i.posthumous ? "Posthumous" : "";
  return `<li class="card pcard" data-year="${i.year}" data-name="${esc(i.sortName.toLowerCase())}" data-letter="${esc(i.sortName[0].toUpperCase())}" data-search="${esc(search)}">
  <a href="${i.url}">
    <span class="pcard-img">${portrait(i)}</span>
    <span class="pcard-body">
      ${label ? `<span class="pcard-year">${label}</span>` : ""}
      <span class="pcard-name">${esc(i.name)}</span>
      ${role(i) ? `<span class="pcard-role">${esc(role(i))}</span>` : ""}
      <span class="pcard-more">View profile</span>
    </span>
  </a>
</li>`;
}
const pageHead = (title, intro = "", crumbs = []) => `
<section class="page-head"><div class="wrap">
  ${crumbs.length ? `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs.map(([h, l]) => `<li><a href="${u(h)}">${esc(l)}</a></li>`).join("")}</ol></nav>` : ""}
  <h1>${esc(title)}</h1>
  ${intro ? `<p class="intro">${intro}</p>` : ""}
</div></section>`;

function fill(tpl) {
  const c = site.contact;
  const li = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join("");
  return tpl
    .replace(/{{appointingOrgs}}/g, li(site.appointingOrgs))
    .replace(/{{supporters}}/g, li(site.supporters))
    .replace(/{{deadline}}/g, esc(site.nomination.deadline))
    .replace(/{{maxPerYear}}/g, site.nomination.maxPerYear)
    .replace(/{{ceremony}}/g, esc(site.nomination.ceremony))
    .replace(/{{formPdf}}/g, esc(site.nomination.formPdf))
    .replace(/{{total}}/g, inductees.length)
    .replace(/{{contactBlock}}/g, `<br>${esc(c.person)}, ${esc(c.role)}<br>${esc(c.street)}, ${esc(c.city)}, ${c.state} ${c.zip}<br><a href="tel:${c.phoneHref}">${esc(c.phone)}</a>, <a href="mailto:${c.email}">${esc(c.email)}</a>`);
}

/* ---------- pages ---------- */
function pickRandom(list, n) {
  const a = list.slice();
  for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; }
  return a.slice(0, n);
}

function buildHome() {
  const arch = (name) => u(`/media/archive/${name}`);
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
  for (const i of inductees) for (const t of townsOf(i)) townCounts[t] = (townCounts[t] || 0) + 1;
  const mapped = Object.entries(townCounts).filter(([t]) => townData.towns[t]);
  const dots = mapped.sort((a, b) => a[1] - b[1]).map(([t, n]) => {
    const [lat, lon] = townData.towns[t];
    const r = (3.4 + Math.sqrt(n) * 2.7).toFixed(1);
    return `<g class="town" tabindex="0" role="button" data-town="${esc(t)}" aria-label="${esc(t)}: ${n} inductee${n === 1 ? "" : "s"}"><circle cx="${px(lon)}" cy="${py(lat)}" r="${r}"></circle></g>`;
  }).join("");
  const MW = px(-94.3), MH = py(33.5);
  const topTowns = [...mapped].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  const people = inductees.map((i) => ({ n: i.name, u: i.url, t: thumbFor(i), r: role(i), y: i.year, towns: townsOf(i) }));

  const body = `
<section class="hero">
  <img class="hero-bg" src="${u("/media/brand/hero-dome.webp")}" alt="" fetchpriority="high">
  <div class="wrap hero-inner">
    <p class="kicker">${esc(site.name)}</p>
    <h1>Honoring the leaders who built Oklahoma's cities and towns</h1>
    <div class="hero-actions">
      <a class="btn btn-solid" href="${u("/inductees/")}">Explore the inductees</a>
      <a class="btn btn-ghost" href="${u("/nominate/")}">Nominate someone</a>
    </div>
  </div>
</section>

<section class="townmap" id="towns" aria-labelledby="towns-title">
  <div class="wrap townmap-grid">
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
  <div class="wrap legends-grid">
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
  <div class="wrap">
    <div class="sec-head">
      <h2>Meet the inductees</h2>
      <a class="btn btn-outline" href="${u("/inductees/")}">View all</a>
    </div>
    <ul class="cards pcards" id="pcards">${pickRandom(inductees.filter((i) => i.photoSrc), 4).map((i) => card(i)).join("")}</ul>
  </div>
</section>

<section class="cta">
  <img class="cta-bg" src="${arch("068-cz2d2084.jpg")}" alt="" loading="lazy">
  <div class="wrap cta-inner">
    <p class="kicker" id="season-cta">Nominations close ${esc(site.nomination.deadline)} each year</p>
    <h2>Know someone who belongs in the Hall?</h2>
    <p>Any elected, appointed or professional official who served an Oklahoma city, town, public trust or municipal organization with distinction can be nominated.</p>
    <a class="btn btn-solid" href="${u("/nominate/")}">Start a nomination</a>
  </div>
</section>

<section class="partners" aria-labelledby="partners-title">
  <div class="wrap">
    <h2 id="partners-title">Governed and supported by Oklahoma's municipal organizations</h2>
    <ul class="partner-list">${[...site.appointingOrgs, ...site.supporters].map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
  </div>
</section>
<script type="application/json" id="people">${JSON.stringify(people).replace(/</g, "\\u003c")}</script>`;
  write("index.html", layout({
    title: "", path: "/", body, bodyClass: "home",
    jsonld: { "@context": "https://schema.org", "@type": "Organization", name: site.name, url: site.url, foundingDate: String(site.founded), email: site.contact.email, telephone: site.contact.phone, address: { "@type": "PostalAddress", streetAddress: site.contact.street, addressLocality: site.contact.city, addressRegion: site.contact.state, postalCode: site.contact.zip, addressCountry: "US" } },
  }));
}

function buildLibrary() {
  const letters = [...new Set(inductees.map((i) => i.sortName[0].toUpperCase()))].sort();
  const body = `${pageHead("Inductees", `Every official honored since ${site.firstClass}. Search by name, town or title, or browse by class.`)}
<section class="section library"><div class="wrap">
  <form class="filters" role="search" aria-controls="results" onsubmit="return false">
    <div class="field field-q"><label for="q">Search</label><input id="q" name="q" type="search" placeholder="Name, town or title" autocomplete="off"></div>
    <div class="field"><label for="year">Class</label><select id="year" name="year"><option value="">All classes</option>${years.map((y) => `<option value="${y}">${y}</option>`).join("")}</select></div>
    <div class="field"><label for="sort">Sort</label><select id="sort" name="sort"><option value="class">Newest class first</option><option value="name">Last name, A–Z</option></select></div>
  </form>
  <nav class="letters" aria-label="Filter by last name"><button type="button" data-letter="" aria-pressed="true">All</button>${letters.map((l) => `<button type="button" data-letter="${l}" aria-pressed="false">${l}</button>`).join("")}</nav>
  <p class="result-count" id="count" aria-live="polite"></p>
  <ul class="cards" id="results">${inductees.map((i) => card(i)).join("")}</ul>
  <p class="empty" id="empty" hidden>No inductees match that search. Try a last name or a town. <button type="button" class="linklike" id="reset">Clear the filters</button></p>
</div></section>`;
  write("inductees/index.html", layout({ title: "Inductees", description: `Browse every inductee of the ${site.name} since ${site.firstClass}.`, path: "/inductees/", body, active: "/inductees/", bodyClass: "page-library" }));
}

function buildClasses() {
  years.forEach((y, idx) => {
    const newer = years[idx - 1], older = years[idx + 1];
    const body = `${pageHead(`Class of ${y}`, plural(byYear[y].length, "inductee") + ".", [["/inductees/", "Inductees"]])}
<section class="section"><div class="wrap">
  <ul class="cards">${byYear[y].map((i) => card(i, { showYear: false })).join("")}</ul>
  <nav class="pager" aria-label="Other classes">
    ${older ? `<a rel="prev" href="${u(`/class/${older}/`)}"><span>Earlier class</span>${older}</a>` : "<span></span>"}
    ${newer ? `<a rel="next" href="${u(`/class/${newer}/`)}"><span>Later class</span>${newer}</a>` : "<span></span>"}
  </nav>
</div></section>`;
    write(`class/${y}/index.html`, layout({ title: `Class of ${y}`, description: `The ${y} inductees of the ${site.name}: ${byYear[y].map((i) => i.name).join(", ")}.`, path: `/class/${y}/`, body, active: "/inductees/" }));
  });
}

function buildInductees() {
  inductees.forEach((i, idx) => {
    const prev = inductees[idx + 1], next = inductees[idx - 1];
    const classmates = byYear[i.year].filter((x) => x !== i);
    const bio = i.bioHtml?.trim()
      ? i.bioHtml
      : `<p class="bio-missing">A full biography for ${esc(i.name)} has not been added yet.</p>`;
    const body = `
<article class="inductee"><div class="wrap">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${u("/inductees/")}">Inductees</a></li><li><a href="${u(`/class/${i.year}/`)}">Class of ${i.year}</a></li></ol></nav>
  <div class="plaque">
    <div class="plaque-photo">${portrait(i, "large")}</div>
    <header class="plaque-head">
      <p class="plaque-class label"><a href="${u(`/class/${i.year}/`)}">Class of ${i.year}</a>${i.posthumous ? ", inducted posthumously" : ""}</p>
      <h1>${esc(i.name)}</h1>
      ${role(i) ? `<p class="plaque-role">${esc(role(i))}</p>` : ""}
    </header>
    <div class="bio prose">${bio}${videoBlock(i)}</div>
  </div>
  ${classmates.length ? `<section class="classmates"><h2>Also inducted in ${i.year}</h2><ul class="cards cards-small">${classmates.map((c) => card(c, { showYear: false })).join("")}</ul></section>` : ""}
  <nav class="pager" aria-label="More inductees">
    ${prev ? `<a rel="prev" href="${prev.url}"><span>Previous</span>${esc(prev.name)}</a>` : "<span></span>"}
    ${next ? `<a rel="next" href="${next.url}"><span>Next</span>${esc(next.name)}</a>` : "<span></span>"}
  </nav>
</div></article>`;
    write(`inductees/${i.slug}/index.html`, layout({
      title: i.name,
      description: i.bioHtml ? excerpt(i.bioHtml) : `${i.name} was inducted into the ${site.name} in ${i.year}.`,
      path: `/inductees/${i.slug}/`, body, active: "/inductees/", ogImage: i.photoSrc,
      jsonld: { "@context": "https://schema.org", "@type": "Person", name: i.name, ...(i.title && { jobTitle: i.title }), ...(i.photoSrc && { image: /^https?:/.test(i.photoSrc) ? i.photoSrc : abs(i.photoSrc.replace(BASE, "")) }), award: `${site.name}, ${i.year}`, url: abs(`/inductees/${i.slug}/`) },
    }));
  });
}

function buildContentPage(key, file, title, intro, active) {
  const html = pages[key]?.html || fill(read(file));
  const body = `${pageHead(title, intro)}<section class="section"><div class="wrap"><div class="prose">${html}</div></div></section>`;
  write(`${key}/index.html`, layout({ title, description: intro ? stripTags(intro) : "", path: `/${key}/`, body, active }));
}

function buildNews() {
  const body = `${pageHead("News", "Announcements of each year's inductees.")}
<section class="section"><div class="wrap">
  <ul class="news-list">${site.news.map((n) => `<li><time class="label" datetime="${n.date}">${fmtDate(n.date)}</time><h2><a href="${esc(n.url)}">${esc(n.title)}</a></h2><p>${esc(n.label)} (PDF)</p></li>`).join("")}</ul>
</div></section>`;
  write("news/index.html", layout({ title: "News", path: "/news/", body, active: "/news/" }));
}

function buildPhotos() {
  const BATCH = 24;
  const items = photos.map((p, n) => {
    const full = p.file ? u("/" + p.file) : p.remote;
    const thumb = p.thumb ? u("/" + p.thumb) : full;
    const alt = p.caption || `Hall of Fame archive photo ${n + 1}`;
    const dims = p.w && p.h ? ` width="${p.w}" height="${p.h}" style="--ar:${(p.w / p.h).toFixed(4)}"` : "";
    return `<div class="m-item"${n >= BATCH ? " hidden" : ""}><button type="button" class="photo" data-full="${esc(full)}" data-caption="${esc(p.caption || "")}"><img src="${esc(thumb)}" alt="${esc(alt)}" loading="lazy" decoding="async"${dims}></button></div>`;
  }).join("");
  const body = `${pageHead("Photo archive", "Photos from past induction ceremonies and the Hall of Fame wall. Select a photo to see it full size.")}
<section class="section"><div class="wrap">
  ${photos.length ? `<div class="masonry" id="gallery" data-batch="${BATCH}">${items}</div>
  ${photos.length > BATCH ? `<p class="gallery-more"><button type="button" class="btn btn-dark" id="gallery-more">Show more photos</button></p>` : ""}` : `<p>The photo archive is being moved over.</p>`}
</div></section>
<dialog class="lightbox" id="lightbox" aria-label="Photo viewer">
  <figure><img alt=""><figcaption></figcaption></figure>
  <div class="lightbox-controls"><button type="button" data-step="-1">Previous photo</button><button type="button" data-close>Close</button><button type="button" data-step="1">Next photo</button></div>
</dialog>`;
  write("photos/index.html", layout({ title: "Photo archive", path: "/photos/", body, active: "/photos/" }));
}

function buildContact() {
  const c = site.contact;
  const body = `${pageHead("Contact", "Questions about nominations, inductees or the foundation go to the Foundation Secretary.")}
<section class="section"><div class="wrap"><div class="contact-card">
  <p class="contact-name">${esc(c.person)}<span class="label">${esc(c.role)}</span></p>
  <dl>
    <dt>Phone</dt><dd><a href="tel:${c.phoneHref}">${esc(c.phone)}</a></dd>
    <dt>Email</dt><dd><a href="mailto:${c.email}">${esc(c.email)}</a></dd>
    <dt>Mail</dt><dd>${esc(site.name)}<br>${esc(c.street)}<br>${esc(c.city)}, ${c.state} ${c.zip}</dd>
  </dl>
</div></div></section>`;
  write("contact/index.html", layout({ title: "Contact", path: "/contact/", body, active: "/contact/" }));
}

function build404() {
  const body = `${pageHead("Page not found", "That page isn't here. If you followed an old link to an inductee, try searching the library.")}
<section class="section"><div class="wrap"><form class="search-404" action="${u("/inductees/")}" role="search"><label class="search-label" for="nf-q">Find an inductee</label><div class="search-row"><input id="nf-q" name="q" type="search" placeholder="Name or town"><button class="btn btn-solid" type="submit">Search</button></div></form></div></section>`;
  write("404.html", layout({ title: "Page not found", path: "/404.html", body }));
}

// Old Squarespace URLs → new pages, so links and search results keep working after the domain moves.
function buildRedirects() {
  const stub = (to) => `<!doctype html><meta charset="utf-8"><title>Moved</title><link rel="canonical" href="${abs(to)}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${u(to)}"><p>This page has moved to <a href="${u(to)}">${abs(to)}</a>.</p>`;
  const map = {
    "home-1": "/", "past-inductees": "/inductees/", "past-inductees-1": "/inductees/",
    "nomination-information": "/nominate/", "pages/nomination-information": "/nominate/",
    "contact-us": "/contact/", "new-folder": "/news/",
    // retired design previews
    "concept": "/", "concept-3": "/",
  };
  for (const [from, to] of Object.entries(map)) write(`${from}/index.html`, stub(to));
  for (const y of years) write(`past-inductees-1/tag/${y}/index.html`, stub(`/class/${y}/`));
  for (const i of inductees) if (i.oldSlug) write(`past-inductees-1/${i.oldSlug}/index.html`, stub(`/inductees/${i.slug}/`));
  // /inductees and /history and /photos keep the same paths.
}

function buildSeo() {
  const urls = ["/", "/inductees/", "/history/", "/nominate/", "/photos/", "/news/", "/contact/",
    ...years.map((y) => `/class/${y}/`), ...inductees.map((i) => `/inductees/${i.slug}/`)];
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((p) => `  <url><loc>${abs(p)}</loc></url>`).join("\n")}\n</urlset>\n`);
  write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${abs("/sitemap.xml")}\n`);
  if (fs.existsSync(path.join(ROOT, "CNAME"))) fs.copyFileSync(path.join(ROOT, "CNAME"), path.join(DIST, "CNAME"));
  write(".nojekyll", "");
}

/* ---------- run ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
copyDir(path.join(ROOT, "src/assets"), path.join(DIST, "assets"));
copyDir(path.join(ROOT, "media"), path.join(DIST, "media"));
buildHome();
buildLibrary();
buildClasses();
buildInductees();
buildContentPage("history", "content/history.html", "History", "An independent foundation, created by Oklahoma's municipal associations to honor their own.", "/history/");
buildContentPage("nominate", "content/nominate.html", "Nominate someone", "How to put forward an Oklahoma official for the Hall of Fame.", "/nominate/");
buildNews();
buildPhotos();
buildContact();
build404();
if (!PREVIEW) {
  buildRedirects();
  buildSeo();
}

const missingBio = inductees.filter((i) => !i.bioHtml?.trim()).length;
const missingPhoto = inductees.filter((i) => !i.photoSrc).length;
console.log(`Built ${inductees.length} inductees in ${years.length} classes → dist/`);
if (missingBio) console.log(`  ${missingBio} inductees have no biography yet (run the Squarespace import).`);
if (missingPhoto) console.log(`  ${missingPhoto} inductees have no photo yet.`);
