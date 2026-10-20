// Mobile menu, home page (random inductees, town map, nomination season), inductee library,
// speech videos, photo archive and lightbox. No dependencies.
(function () {
  "use strict";

  var esc = function (t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  };

  /* Mobile menu */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("hdr-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.textContent = open ? "Close" : "Menu";
    });
  }

  /* Home page */
  var peopleEl = document.getElementById("people");
  if (peopleEl) {
    var people = [];
    try { people = JSON.parse(peopleEl.textContent); } catch (e) { people = []; }

    /* Four random inductees on every visit (the build picks a fallback four) */
    var pcards = document.getElementById("pcards");
    var withPhotos = people.filter(function (p) { return p.t; });
    if (pcards && withPhotos.length >= 4) {
      for (var k = withPhotos.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var tmp = withPhotos[k]; withPhotos[k] = withPhotos[j]; withPhotos[j] = tmp;
      }
      pcards.innerHTML = withPhotos.slice(0, 4).map(function (p) {
        return '<li class="card pcard"><a href="' + esc(p.u) + '"><span class="pcard-img"><img src="' + esc(p.t) + '" alt="" decoding="async"></span>' +
          '<span class="pcard-body"><span class="pcard-year">Class of ' + p.y + '</span><span class="pcard-name">' + esc(p.n) + '</span>' +
          (p.r ? '<span class="pcard-role">' + esc(p.r) + '</span>' : '') + '<span class="pcard-more">View profile</span></span></a></li>';
      }).join("");
    }

    /* Find inductees by town */
    var townTitle = document.getElementById("town-title");
    var townTop = document.getElementById("town-top");
    var townPeople = document.getElementById("town-people");
    var townPanel = document.getElementById("town-panel");
    var townBack = document.getElementById("town-back");
    var townDots = Array.prototype.slice.call(document.querySelectorAll(".town"));
    if (townPanel) {
      // Bring the panel's top back into view if it has scrolled off screen (on phones it sits under the map)
      var keepPanelInView = function () {
        var top = townPanel.getBoundingClientRect().top;
        if (top < 80 || top > window.innerHeight - 120) townPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      var showTown = function (town) {
        var list = people.filter(function (p) { return p.towns.indexOf(town) !== -1; });
        townTitle.textContent = town;
        townTop.hidden = true;
        townPeople.hidden = false;
        townPeople.innerHTML = list.map(function (p) {
          return '<li><a class="town-person" href="' + esc(p.u) + '"><img src="' + esc(p.t) + '" alt="" loading="lazy">' +
            "<span><strong>" + esc(p.n) + "</strong><span>" + esc(p.r) + ", class of " + p.y + "</span></span></a></li>";
        }).join("");
        townPeople.scrollTop = 0;
        townBack.hidden = false;
        townDots.forEach(function (d) { d.classList.toggle("is-active", d.dataset.town === town); });
        keepPanelInView();
      };
      var resetTown = function () {
        townTitle.textContent = "Most represented";
        townTop.hidden = false;
        townPeople.hidden = true;
        townBack.hidden = true;
        townDots.forEach(function (d) { d.classList.remove("is-active"); });
        keepPanelInView();
      };
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
      townBack.addEventListener("click", function (e) {
        if (e.target.closest("[data-back]")) resetTown();
      });
    }

    /* Nomination season: open January 1 through June 1 */
    var seasonEl = document.getElementById("season-cta");
    if (seasonEl) {
      var now = new Date(), yr = now.getFullYear();
      var opens = new Date(yr, 0, 1), closes = new Date(yr, 5, 1, 23, 59);
      if (now >= opens && now <= closes) {
        var left = Math.ceil((closes - now) / 864e5);
        seasonEl.textContent = "Nominations are open: " + left + " day" + (left === 1 ? "" : "s") + " left";
      } else {
        seasonEl.textContent = "Nominations open January 1, " + (now > closes ? yr + 1 : yr);
      }
    }
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

  /* Photo archive: masonry columns plus "Show more" */
  var gallery = document.getElementById("gallery");
  if (gallery) {
    var mItems = Array.prototype.slice.call(gallery.querySelectorAll(".m-item"));
    var batch = Number(gallery.dataset.batch) || 24;
    var moreBtn = document.getElementById("gallery-more");
    var shown = Math.min(batch, mItems.length);
    var lastCols = 0;
    var ratio = function (item) {
      var im = item.querySelector("img");
      var w = Number(im.getAttribute("width")), h = Number(im.getAttribute("height"));
      return w && h ? w / h : 4 / 3;
    };
    var colCount = function () {
      var w = gallery.clientWidth;
      return w >= 1000 ? 4 : w >= 640 ? 3 : 2;
    };
    // Place each visible photo, in order, into the currently shortest column.
    // Placement depends only on earlier photos, so adding more never moves the ones already shown.
    var layout = function (force) {
      var n = colCount();
      if (!force && n === lastCols) return;
      lastCols = n;
      var cols = [], heights = [];
      for (var c = 0; c < n; c++) {
        var col = document.createElement("div");
        col.className = "m-col";
        cols.push(col); heights.push(0);
      }
      mItems.forEach(function (item, i) {
        item.hidden = i >= shown;
        if (item.hidden) { cols[0].appendChild(item); return; }
        var k = heights.indexOf(Math.min.apply(null, heights));
        cols[k].appendChild(item);
        heights[k] += 1 / ratio(item);
      });
      gallery.textContent = "";
      cols.forEach(function (col) { gallery.appendChild(col); });
      gallery.classList.add("is-js");
    };
    layout(true);
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { layout(false); }, 150);
    });
    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        var firstNew = shown;
        shown = Math.min(shown + batch, mItems.length);
        layout(true);
        if (shown >= mItems.length) moreBtn.parentNode.hidden = true;
        var btn = mItems[firstNew] && mItems[firstNew].querySelector("button");
        if (btn) btn.focus({ preventScroll: true });
      });
    }
  }

  /* Photo lightbox */
  var box = document.getElementById("lightbox");
  if (box && typeof box.showModal === "function") {
    var photos = Array.prototype.slice.call(document.querySelectorAll(".photo"));
    var img = box.querySelector("img");
    var cap = box.querySelector("figcaption");
    var index = 0;
    function show(i) {
      var visible = photos.filter(function (p) { return !p.closest("[hidden]"); });
      var list = visible.length ? visible : photos;
      var cur = photos[index];
      var pos = typeof i === "object" ? list.indexOf(i) : (list.indexOf(cur) + i + list.length) % list.length;
      var p = list[pos];
      index = photos.indexOf(p);
      img.src = p.dataset.full;
      img.alt = p.querySelector("img").alt;
      cap.textContent = p.dataset.caption || "";
    }
    photos.forEach(function (p, i) {
      p.addEventListener("click", function () { show(p); box.showModal(); });
    });
    box.addEventListener("click", function (e) {
      var t = e.target;
      if (t === box || t.hasAttribute("data-close")) box.close();
      if (t.dataset.step) show(Number(t.dataset.step));
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(1);
      if (e.key === "ArrowLeft") show(-1);
    });
  }
})();
