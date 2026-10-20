// Design concept 3: /concept-3/
// Modeled on the structure of nationalsoccerhof.com: full-bleed hero with a bold stacked headline,
// feature cards overlapping the hero, a legends split, profile cards, a class timeline slider,
// a full-width photo call to action, supporters and a large footer. Not linked; noindex.

import fs from "node:fs";
import path from "node:path";

export function buildConcept3({ ROOT, site, inductees, years, byYear, u, esc, write, role }) {
  const thumbFor = (i) => (fs.existsSync(path.join(ROOT, "media/thumbs", `${i.slug}.webp`)) ? u(`/media/thumbs/${i.slug}.webp`) : i.photoSrc);
  const arch = (name) => u(`/media/archive/${name}`);
  const people = inductees.map((i) => ({ n: i.name, u: i.url, t: thumbFor(i), r: role(i), y: i.year }));

  const card = (p) => `<li class="pcard"><a href="${p.u}"><span class="pcard-img"><img src="${esc(p.t)}" alt="" loading="lazy" decoding="async"></span><span class="pcard-body"><span class="pcard-year">Class of ${p.y}</span><span class="pcard-name">${esc(p.n)}</span><span class="pcard-role">${esc(p.r)}</span><span class="pcard-more">View profile</span></span></a></li>`;

  // Timeline: two founding milestones, then every class, oldest first
  const milestones = [
    { y: "2000", title: "The foundation is created", text: "On January 19, three Oklahoma Municipal Assurance Group employees incorporate the foundation, following a proposal by Chickasha City Manager Larry Shelton." },
  ];
  const slides = [
    ...milestones.map((m) => `<li class="slide slide-milestone"><span class="slide-year">${m.y}</span><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></li>`),
    ...[...years].reverse().map((y) => {
      const cls = byYear[y];
      return `<li class="slide"><span class="slide-year">${y}</span><h3>The class of ${y}</h3>
        <ul class="slide-faces">${cls.map((i) => `<li><img src="${esc(thumbFor(i))}" alt="" loading="lazy" decoding="async"></li>`).join("")}</ul>
        <p class="slide-names">${cls.map((i) => esc(i.name)).join(", ")}</p>
        <a class="slide-link" href="${u(`/class/${y}/`)}">View the class</a></li>`;
    }),
  ].join("");

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
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${u("/assets/concept3.css")}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="note">Design concept 3 for review. Not linked from the live site. <a href="${u("/concept/")}">Concept 1</a> <a href="${u("/")}">Current site</a></div>

<header class="hdr">
  <div class="util"><div class="frame util-inner"><span id="season-util"></span><span class="util-links"><a href="tel:${site.contact.phoneHref}">${esc(site.contact.phone)}</a><a href="${u("/contact/")}">Contact</a></span></div></div>
  <div class="frame hdr-inner">
    <a class="hdr-brand" href="#top"><img class="hdr-seal" src="${u("/media/brand/seal.png")}" width="168" height="168" alt=""><img class="hdr-word" src="${u("/media/brand/wordmark.webp")}" width="1500" height="224" alt="${esc(site.name)}"></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="hdr-nav">Menu</button>
    <nav class="hdr-nav" id="hdr-nav" aria-label="Main">
      <a href="${u("/inductees/")}">Inductees</a>
      <a href="#timeline">Classes</a>
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

<section class="features" aria-label="Featured">
  <div class="frame">
    <ul class="fcards">
      <li class="fcard">
        <img src="${arch("104-dsc_0116.jpg")}" alt="Inductees wearing their Hall of Fame medals" loading="lazy">
        <div class="fcard-body"><span class="tag">Inductees</span><h2>Meet the Hall of Fame</h2><p>Mayors, managers, clerks, attorneys and chiefs honored since ${site.firstClass} for service that reached beyond their own communities.</p><a class="more" href="${u("/inductees/")}">Browse the inductees</a></div>
      </li>
      <li class="fcard">
        <img src="${arch("099-dsc_0395.jpg")}" alt="An inductee receives the Hall of Fame medal" loading="lazy">
        <div class="fcard-body"><span class="tag">Nominations</span><h2>Nominate an official</h2><p>Nominations are accepted until ${esc(site.nomination.deadline)} each year. Up to ${site.nomination.maxPerYear} officials are inducted annually.</p><a class="more" href="${u("/nominate/")}">How to nominate</a></div>
      </li>
      <li class="fcard">
        <img src="${arch("094-dsc_0386.jpg")}" alt="An inductee gives an acceptance speech at the podium" loading="lazy">
        <div class="fcard-body"><span class="tag">Ceremony</span><h2>Watch the speeches</h2><p>Hear inductees accept the honor at the ${esc(site.nomination.ceremony)}, in their own words.</p><a class="more" href="${u("/inductees/")}">Find a speech</a></div>
      </li>
    </ul>
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

<section class="timeline" id="timeline" aria-labelledby="timeline-title">
  <div class="frame">
    <div class="sec-head sec-head-light">
      <h2 id="timeline-title">Through the years</h2>
      <div class="tl-controls">
        <button type="button" class="tl-btn" data-dir="-1" aria-label="Earlier"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button>
        <button type="button" class="tl-btn" data-dir="1" aria-label="Later"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>
      </div>
    </div>
  </div>
  <div class="tl-track-wrap">
    <ol class="tl-track" id="tl-track" tabindex="0" aria-label="Classes from 2000 to ${years[0]}">${slides}</ol>
  </div>
  <div class="frame"><div class="tl-progress"><span id="tl-bar"></span></div></div>
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
