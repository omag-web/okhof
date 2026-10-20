// Design concept 2: /concept-2/
// A dark, cinematic, editorial take: wordmark hero with live search, a rotating spotlight,
// and a typographic roster with floating portrait previews. Not linked from the menu; noindex.

import fs from "node:fs";
import path from "node:path";

export function buildConcept2({ ROOT, site, inductees, years, u, esc, stripTags, write, role }) {
  const quoteFor = (html) => {
    const sentences = stripTags(html || "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
      .split(/(?<=[.!?]["”]?)\s+(?=[A-Z“"])/);
    const good = sentences.find((s) => s.length > 60 && s.length < 240 && !/hall of fame|inductee|posthumous|foundation|nominat/i.test(s));
    return (good || "").trim().replace(/^(However|But|And),\s+(\w)/, (_, w, c) => c.toUpperCase());
  };
  const thumbFor = (i) => (fs.existsSync(path.join(ROOT, "media/thumbs", `${i.slug}.webp`)) ? u(`/media/thumbs/${i.slug}.webp`) : i.photoSrc);
  // Spotlight uses only portraits large enough to show big; most archive photos are 200px.
  const isLarge = (i) => {
    if (!i.photo) return false;
    const f = path.join(ROOT, i.photo);
    return fs.existsSync(f) && fs.statSync(f).size > 20000;
  };

  const people = inductees.map((i) => ({
    s: i.slug, n: i.name, u: i.url, t: thumbFor(i), p: i.photoSrc, r: role(i), y: i.year,
    q: quoteFor(i.bioHtml), v: i.videos?.[0]?.id || "", big: isLarge(i),
  }));
  const spotlightPool = people.filter((p) => p.big && p.q);
  const first = spotlightPool[0] || people[0];

  const byClass = years.map((y) => `
    <section class="r-group" data-key="${y}">
      <h3 class="r-key">${y}</h3>
      <ul class="r-names">${inductees.filter((i) => i.year === y).map((i) => `<li><a href="${i.url}" data-slug="${i.slug}"><span class="r-name">${esc(i.name)}</span><span class="r-role">${esc(role(i))}</span></a></li>`).join("")}</ul>
    </section>`).join("");

  const letters = [...new Set(inductees.map((i) => i.sortName[0].toUpperCase()))].sort();
  const byName = letters.map((l) => `
    <section class="r-group" data-key="${l}">
      <h3 class="r-key">${l}</h3>
      <ul class="r-names">${inductees.filter((i) => i.sortName[0].toUpperCase() === l).sort((a, b) => a.sortName.localeCompare(b.sortName)).map((i) => `<li><a href="${i.url}" data-slug="${i.slug}"><span class="r-name">${esc(i.name)}</span><span class="r-role">${esc(role(i))}, ${i.year}</span></a></li>`).join("")}</ul>
    </section>`).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#1c1c1b">
<title>Design concept 2 · ${esc(site.shortName)}</title>
<link rel="icon" href="${u("/assets/favicon.png")}" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Public+Sans:wght@300;400;500;600&family=Source+Serif+4:ital,opsz,wght@1,8..60,300;1,8..60,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${u("/assets/concept2.css")}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="note">Design concept 2 for review. Not linked from the live site. <a href="${u("/concept/")}">Concept 1</a> <a href="${u("/")}">Current site</a></div>

<header class="bar" id="bar">
  <div class="frame bar-inner">
    <a class="bar-seal" href="#top" aria-label="${esc(site.name)}, top of page"><img src="${u("/media/brand/seal.png")}" width="168" height="168" alt=""></a>
    <nav class="bar-nav" aria-label="Main">
      <a href="#roster">Inductees</a>
      <a href="${u("/history/")}">About</a>
      <a href="#nominate">Nominate</a>
    </nav>
  </div>
</header>

<main id="main">
<section class="stage" id="top">
  <img class="stage-bg" src="${u("/media/brand/hero-dome.webp")}" alt="" fetchpriority="high">
  <div class="frame stage-inner">
    <h1 class="stage-mark"><img src="${u("/media/brand/wordmark.webp")}" width="1500" height="224" alt="${esc(site.name)}"></h1>
    <p class="stage-line">Honoring the public servants who built Oklahoma's cities and towns, since ${site.firstClass}.</p>
    <div class="finder" role="search">
      <label class="visually-hidden" for="finder-q">Search inductees</label>
      <input id="finder-q" type="search" placeholder="Search a name, town or title" autocomplete="off"
        role="combobox" aria-expanded="false" aria-controls="finder-list" aria-autocomplete="list">
      <kbd class="finder-hint" aria-hidden="true">/</kbd>
      <ul class="finder-list" id="finder-list" role="listbox" hidden></ul>
    </div>
  </div>
  <a class="stage-cue" href="#spotlight">Spotlight</a>
</section>

<section class="spotlight" id="spotlight" aria-roledescription="carousel" aria-label="Inductee spotlight">
  <div class="frame spot-grid">
    <figure class="spot-figure">
      <img class="spot-img" id="spot-img" src="${esc(first.p)}" alt="Portrait of ${esc(first.n)}">
    </figure>
    <div class="spot-copy" aria-live="polite">
      <p class="spot-class" id="spot-class">Class of ${first.y}</p>
      <h2 class="spot-name" id="spot-name">${esc(first.n)}</h2>
      <p class="spot-role" id="spot-role">${esc(first.r)}</p>
      <blockquote class="spot-quote" id="spot-quote">${esc(first.q)}</blockquote>
      <div class="spot-actions">
        <a class="spot-link" id="spot-link" href="${first.u}">Read the full story</a>
        <a class="spot-link spot-link-quiet" id="spot-video" href="${first.v ? `https://www.youtube.com/watch?v=${first.v}` : "#"}" target="_blank" rel="noopener"${first.v ? "" : " hidden"}>Watch the acceptance speech</a>
      </div>
      <div class="spot-controls">
        <button type="button" class="spot-btn" data-step="-1" aria-label="Previous inductee"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg></button>
        <span class="spot-count" id="spot-count">1 / 6</span>
        <button type="button" class="spot-btn" data-step="1" aria-label="Next inductee"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>
        <ol class="spot-rail" id="spot-rail" aria-label="Choose an inductee"></ol>
      </div>
    </div>
  </div>
</section>

<section class="roster" id="roster" aria-labelledby="roster-title">
  <div class="frame">
    <div class="roster-head">
      <h2 id="roster-title">The roster</h2>
      <div class="toggle" role="group" aria-label="Order the roster">
        <button type="button" data-view="class" aria-pressed="true">By class</button>
        <button type="button" data-view="name" aria-pressed="false">A to Z</button>
      </div>
    </div>
    <div class="roster-view" data-view="class">${byClass}</div>
    <div class="roster-view" data-view="name" hidden>${byName}</div>
  </div>
  <img class="peek" id="peek" alt="" aria-hidden="true">
</section>

<section class="close" id="nominate" aria-labelledby="close-title">
  <div class="frame close-grid">
    <div class="close-date" aria-hidden="true"><span>Nominations close</span>${esc(site.nomination.deadline)}</div>
    <div class="close-copy">
      <p class="close-season" id="season"></p>
      <h2 id="close-title">Know someone who belongs here?</h2>
      <p>Any elected, appointed or professional official who has served an Oklahoma city, town, public trust or municipal organization with distinction and unquestioned ethics can be nominated. Up to ${site.nomination.maxPerYear} are inducted each year at the ${esc(site.nomination.ceremony)}.</p>
      <a class="spot-link" href="${u("/nominate/")}">How to nominate</a>
    </div>
  </div>
</section>
</main>

<footer class="foot">
  <div class="frame foot-inner">
    <img src="${u("/media/brand/seal.png")}" width="168" height="168" alt="">
    <p><span class="foot-name">${esc(site.name)}</span>${esc(site.contact.street)}, ${esc(site.contact.city)}, ${site.contact.state} ${site.contact.zip}<br>${esc(site.contact.phone)} &nbsp; ${esc(site.contact.email)}</p>
  </div>
</footer>

<script type="application/json" id="people">${JSON.stringify(people).replace(/</g, "\\u003c")}</script>
<script src="${u("/assets/concept2.js")}" defer></script>
</body>
</html>`;
  write("concept-2/index.html", html);
}
