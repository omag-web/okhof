// Mobile menu, inductee library filtering, and photo lightbox. No dependencies.
(function () {
  "use strict";

  /* Mobile menu */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
    });
  }

  /* Home page: show three random inductees on every visit */
  var featured = document.getElementById("featured");
  var pool = document.getElementById("featured-pool");
  if (featured && pool) {
    try {
      var all = JSON.parse(pool.textContent);
      for (var k = all.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var tmp = all[k]; all[k] = all[j]; all[j] = tmp;
      }
      var esc = function (t) {
        return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
      };
      featured.innerHTML = all.slice(0, 3).map(function (i) {
        return '<li class="card"><a href="' + esc(i.u) + '">' +
          '<img class="portrait portrait-card" src="' + esc(i.p) + '" alt="Portrait of ' + esc(i.n) + '" decoding="async">' +
          '<span class="card-body"><span class="card-name">' + esc(i.n) + '</span>' +
          (i.r ? '<span class="card-role">' + esc(i.r) + '</span>' : '') +
          '<span class="card-year">Class of ' + esc(i.y) + '</span></span></a></li>';
      }).join("");
    } catch (e) { /* keep the three chosen at build time */ }
  }

  /* Inductee library */
  var results = document.getElementById("results");
  if (results && document.querySelector(".filters")) {
    var q = document.getElementById("q");
    var year = document.getElementById("year");
    var sort = document.getElementById("sort");
    var count = document.getElementById("count");
    var empty = document.getElementById("empty");
    var letterButtons = Array.prototype.slice.call(document.querySelectorAll(".letters button"));
    var cards = Array.prototype.slice.call(results.children);
    var original = cards.slice();
    var letter = "";

    var params = new URLSearchParams(location.search);
    if (params.get("q")) q.value = params.get("q");
    if (params.get("year")) year.value = params.get("year");
    if (params.get("sort")) sort.value = params.get("sort");
    if (params.get("letter")) letter = params.get("letter").toUpperCase();

    function apply() {
      var terms = q.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      var y = year.value;
      var shown = 0;

      var ordered = sort.value === "name"
        ? original.slice().sort(function (a, b) { return a.dataset.name.localeCompare(b.dataset.name); })
        : original;
      ordered.forEach(function (c) { results.appendChild(c); });

      cards.forEach(function (c) {
        var ok = (!y || c.dataset.year === y) &&
          (!letter || c.dataset.letter === letter) &&
          terms.every(function (t) { return c.dataset.search.indexOf(t) !== -1; });
        c.hidden = !ok;
        if (ok) shown++;
      });

      letterButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.letter === letter)); });
      var filtered = terms.length || y || letter;
      count.textContent = filtered ? (shown === 1 ? "1 match" : shown + " matches") : "";
      empty.hidden = shown !== 0;

      var p = new URLSearchParams();
      if (q.value.trim()) p.set("q", q.value.trim());
      if (y) p.set("year", y);
      if (letter) p.set("letter", letter);
      if (sort.value !== "class") p.set("sort", sort.value);
      var qs = p.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
    }

    q.addEventListener("input", apply);
    year.addEventListener("change", apply);
    sort.addEventListener("change", apply);
    letterButtons.forEach(function (b) {
      b.addEventListener("click", function () { letter = b.dataset.letter; apply(); });
    });
    document.getElementById("reset").addEventListener("click", function () {
      q.value = ""; year.value = ""; sort.value = "class"; letter = ""; apply(); q.focus();
    });
    apply();
  }

  /* Acceptance speech videos: swap the thumbnail for the YouTube player on click */
  Array.prototype.forEach.call(document.querySelectorAll(".video-play"), function (btn) {
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + btn.dataset.youtube + "?autoplay=1&rel=0";
      f.title = btn.getAttribute("aria-label").replace(/^Play /, "");
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture";
      f.allowFullscreen = true;
      btn.replaceWith(f);
      f.focus();
    });
  });

  /* Photo lightbox */
  var box = document.getElementById("lightbox");
  if (box && typeof box.showModal === "function") {
    var photos = Array.prototype.slice.call(document.querySelectorAll(".photo"));
    var img = box.querySelector("img");
    var cap = box.querySelector("figcaption");
    var index = 0;
    function show(i) {
      index = (i + photos.length) % photos.length;
      var p = photos[index];
      img.src = p.dataset.full;
      img.alt = p.querySelector("img").alt;
      cap.textContent = p.dataset.caption || "Photo " + (index + 1) + " of " + photos.length;
    }
    photos.forEach(function (p, i) {
      p.addEventListener("click", function () { show(i); box.showModal(); });
    });
    box.addEventListener("click", function (e) {
      var t = e.target;
      if (t === box || t.hasAttribute("data-close")) box.close();
      if (t.dataset.step) show(index + Number(t.dataset.step));
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(index + 1);
      if (e.key === "ArrowLeft") show(index - 1);
    });
  }
})();
