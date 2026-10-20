// Design concept interactions: wall filtering, plaque panel, town map, nomination season.
(function () {
  "use strict";
  var people = JSON.parse(document.getElementById("people").textContent);
  var bySlug = {};
  people.forEach(function (p) { bySlug[p.s] = p; });

  var esc = function (t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  };
  var norm = function (t) { return String(t).toLowerCase().replace(/[^a-z0-9 ]+/g, " "); };

  /* ---------- the wall: search, role chips and class dim non-matches in place ---------- */
  var q = document.getElementById("wall-q");
  var yearSel = document.getElementById("wall-year");
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile"));
  var count = document.getElementById("hall-count");
  var empty = document.getElementById("wall-empty");
  var activeRole = "";
  var activeTown = "";
  var total = people.length;

  function haystack(p) { return norm([p.n, p.r, p.y, p.towns.join(" ")].join(" ")); }
  people.forEach(function (p) { p.h = haystack(p); });

  function applyFilters() {
    var terms = norm(q.value).split(/\s+/).filter(Boolean);
    var y = yearSel.value;
    var shown = 0;
    tiles.forEach(function (t) {
      var p = bySlug[t.dataset.slug];
      var ok = (!activeRole || p.roles.indexOf(activeRole) !== -1) &&
        (!y || String(p.y) === y) &&
        (!activeTown || p.towns.indexOf(activeTown) !== -1) &&
        terms.every(function (term) { return p.h.indexOf(term) !== -1; });
      t.classList.toggle("is-dim", !ok);
      t.tabIndex = ok ? 0 : -1;
      if (ok) shown++;
    });
    var filtered = terms.length || y || activeRole || activeTown;
    count.textContent = filtered ? (shown === 1 ? "1 match" : shown + " matches") : "Every class since 2001";
    empty.hidden = shown !== 0;
  }

  q.addEventListener("input", applyFilters);
  q.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); document.getElementById("hall").scrollIntoView(); }
  });
  yearSel.addEventListener("change", applyFilters);
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      activeRole = activeRole === c.dataset.role ? "" : c.dataset.role;
      chips.forEach(function (o) { o.setAttribute("aria-pressed", String(o.dataset.role === activeRole)); });
      applyFilters();
    });
  });
  document.querySelectorAll("[data-reset]").forEach(function (b) {
    b.addEventListener("click", function () {
      q.value = ""; yearSel.value = ""; activeRole = ""; activeTown = "";
      chips.forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
      applyFilters();
    });
  });

  /* ---------- plaque panel ---------- */
  var panel = document.getElementById("plaque");
  var lastFocus = null;
  function openPlaque(slug) {
    var p = bySlug[slug];
    if (!p) return;
    document.getElementById("plaque-img").src = p.p || p.t;
    document.getElementById("plaque-img").alt = "Portrait of " + p.n;
    document.getElementById("plaque-class").textContent = "Inducted " + p.y + (p.ph ? ", posthumously" : "");
    document.getElementById("plaque-name").textContent = p.n;
    document.getElementById("plaque-role").textContent = p.r;
    var quote = document.getElementById("plaque-quote");
    quote.textContent = p.q;
    quote.hidden = !p.q;
    document.getElementById("plaque-towns").innerHTML = p.towns.map(function (t) {
      return '<li><button type="button" data-town="' + esc(t) + '">' + esc(t) + "</button></li>";
    }).join("");
    document.getElementById("plaque-link").href = p.u;
    var vid = document.getElementById("plaque-video");
    vid.hidden = !p.v;
    if (p.v) vid.href = "https://www.youtube.com/watch?v=" + p.v;
    lastFocus = document.activeElement;
    if (typeof panel.showModal === "function") { if (!panel.open) panel.showModal(); } else { location.href = p.u; }
    panel.scrollTop = 0;
  }
  function closePlaque() { if (panel.open) panel.close(); }
  panel.addEventListener("close", function () { if (lastFocus) lastFocus.focus(); });
  panel.addEventListener("click", function (e) {
    if (e.target === panel || e.target.closest("[data-close]")) closePlaque();
    var tb = e.target.closest("[data-town]");
    if (tb) { closePlaque(); showTown(tb.dataset.town, true); }
  });
  tiles.forEach(function (t) { t.addEventListener("click", function () { openPlaque(t.dataset.slug); }); });

  /* ---------- map of towns ---------- */
  var townTitle = document.getElementById("town-title");
  var townTop = document.getElementById("town-top");
  var townPeople = document.getElementById("town-people");
  var townDots = Array.prototype.slice.call(document.querySelectorAll(".town"));

  function showTown(town, scroll) {
    var list = people.filter(function (p) { return p.towns.indexOf(town) !== -1; });
    townTitle.textContent = town;
    townTop.hidden = true;
    townPeople.hidden = false;
    townPeople.innerHTML = list.map(function (p) {
      return '<li><button type="button" class="person" data-slug="' + p.s + '"><img src="' + esc(p.t) + '" alt="" loading="lazy">' +
        "<span><strong>" + esc(p.n) + "</strong><span>" + esc(p.r) + ", class of " + p.y + "</span></span></button></li>";
    }).join("") + '<li class="town-back"><button type="button" class="linklike" data-back>Show the most represented towns</button></li>';
    townDots.forEach(function (d) { d.classList.toggle("is-active", d.dataset.town === town); });
    if (scroll) document.getElementById("explore").scrollIntoView();
  }
  function resetTown() {
    townTitle.textContent = "Most represented";
    townTop.hidden = false;
    townPeople.hidden = true;
    townDots.forEach(function (d) { d.classList.remove("is-active"); });
  }
  townDots.forEach(function (d) {
    d.addEventListener("click", function () { showTown(d.dataset.town); });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showTown(d.dataset.town); }
    });
  });
  townTop.addEventListener("click", function (e) {
    var b = e.target.closest("[data-town]");
    if (b) showTown(b.dataset.town);
  });
  townPeople.addEventListener("click", function (e) {
    if (e.target.closest("[data-back]")) { resetTown(); return; }
    var b = e.target.closest("[data-slug]");
    if (b) openPlaque(b.dataset.slug);
  });

  /* ---------- nomination season: open January 1 through June 1 ---------- */
  var season = document.getElementById("season");
  var now = new Date();
  var yr = now.getFullYear();
  var opens = new Date(yr, 0, 1), closes = new Date(yr, 5, 1, 23, 59);
  var day = 864e5;
  if (now >= opens && now <= closes) {
    var left = Math.ceil((closes - now) / day);
    season.textContent = "Nominations are open: " + left + " day" + (left === 1 ? "" : "s") + " left";
  } else {
    var next = now > closes ? new Date(yr + 1, 0, 1) : opens;
    season.textContent = "Nominations open January 1, " + next.getFullYear();
  }

  applyFilters();
})();
