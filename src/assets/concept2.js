// Design concept 2 interactions: solid bar on scroll, live search, spotlight, roster views and portrait peek.
(function () {
  "use strict";
  var people = JSON.parse(document.getElementById("people").textContent);
  var bySlug = {};
  people.forEach(function (p) { bySlug[p.s] = p; p.h = (p.n + " " + p.r + " " + p.y).toLowerCase(); });
  var esc = function (t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- bar turns solid after the stage ---------- */
  var bar = document.getElementById("bar");
  var onScroll = function () { bar.classList.toggle("is-solid", window.scrollY > 80); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- live search ---------- */
  var input = document.getElementById("finder-q");
  var list = document.getElementById("finder-list");
  var results = [], active = -1;

  function render() {
    var terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) { close(); return; }
    results = people.filter(function (p) { return terms.every(function (t) { return p.h.indexOf(t) !== -1; }); }).slice(0, 7);
    active = results.length ? 0 : -1;
    list.innerHTML = results.length
      ? results.map(function (p, i) {
          return '<li role="option" id="opt-' + i + '" aria-selected="' + (i === active) + '"><a href="' + esc(p.u) + '">' +
            '<img src="' + esc(p.t) + '" alt=""><span><strong>' + esc(p.n) + "</strong><span>" + esc(p.r) + ", class of " + p.y + "</span></span></a></li>";
        }).join("")
      : '<li class="finder-empty">No one matches that. Try a last name or a town.</li>';
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-activedescendant", active >= 0 ? "opt-0" : "");
  }
  function close() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }
  function move(d) {
    if (!results.length) return;
    active = (active + d + results.length) % results.length;
    Array.prototype.forEach.call(list.children, function (li, i) { li.setAttribute("aria-selected", String(i === active)); });
    input.setAttribute("aria-activedescendant", "opt-" + active);
    list.children[active].scrollIntoView({ block: "nearest" });
  }
  input.addEventListener("input", render);
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter" && results[active]) { e.preventDefault(); location.href = results[active].u; }
    else if (e.key === "Escape") { input.value = ""; close(); }
  });
  input.addEventListener("focus", function () { if (input.value) render(); });
  document.addEventListener("click", function (e) { if (!e.target.closest(".finder")) close(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== input && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      e.preventDefault(); input.focus();
    }
  });

  /* ---------- spotlight: six random inductees with large portraits ---------- */
  var pool = people.filter(function (p) { return p.big && p.q; });
  for (var k = pool.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var tmp = pool[k]; pool[k] = pool[j]; pool[j] = tmp; }
  pool = pool.slice(0, 6);
  var spot = document.getElementById("spotlight");
  var rail = document.getElementById("spot-rail");
  var idx = 0, timer = null;
  var el = function (id) { return document.getElementById(id); };

  rail.innerHTML = pool.map(function (p, i) {
    return '<li><button type="button" data-i="' + i + '" aria-label="' + esc(p.n) + '"><img src="' + esc(p.t) + '" alt=""></button></li>';
  }).join("");

  function fill(p) {
    el("spot-img").src = p.p;
    el("spot-img").alt = "Portrait of " + p.n;
    el("spot-class").textContent = "Class of " + p.y;
    el("spot-name").textContent = p.n;
    el("spot-role").textContent = p.r;
    el("spot-quote").textContent = p.q;
    el("spot-link").href = p.u;
    var v = el("spot-video");
    v.hidden = !p.v;
    if (p.v) v.href = "https://www.youtube.com/watch?v=" + p.v;
    el("spot-count").textContent = (idx + 1) + " / " + pool.length;
    Array.prototype.forEach.call(rail.querySelectorAll("button"), function (b, i) { b.setAttribute("aria-current", String(i === idx)); });
  }
  function go(i) {
    if (!pool.length) return;
    idx = (i + pool.length) % pool.length;
    if (reduceMotion) { fill(pool[idx]); return; }
    spot.classList.add("is-changing");
    setTimeout(function () {
      fill(pool[idx]);
      var img = el("spot-img");
      var done = function () { spot.classList.remove("is-changing"); };
      if (img.complete) requestAnimationFrame(done); else { img.onload = done; img.onerror = done; }
    }, 320);
  }
  function restart() {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(function () { go(idx + 1); }, 8000);
  }
  spot.addEventListener("click", function (e) {
    var b = e.target.closest("[data-step]");
    if (b) { go(idx + Number(b.dataset.step)); restart(); }
    var r = e.target.closest("[data-i]");
    if (r) { go(Number(r.dataset.i)); restart(); }
  });
  spot.addEventListener("mouseenter", function () { clearInterval(timer); });
  spot.addEventListener("mouseleave", restart);
  spot.addEventListener("focusin", function () { clearInterval(timer); });
  if (pool.length) { fill(pool[0]); restart(); }

  /* ---------- roster: by class / A to Z ---------- */
  var toggles = Array.prototype.slice.call(document.querySelectorAll(".toggle button"));
  var views = Array.prototype.slice.call(document.querySelectorAll(".roster-view"));
  toggles.forEach(function (t) {
    t.addEventListener("click", function () {
      toggles.forEach(function (o) { o.setAttribute("aria-pressed", String(o === t)); });
      views.forEach(function (v) { v.hidden = v.dataset.view !== t.dataset.view; });
    });
  });

  /* ---------- floating portrait beside the cursor ---------- */
  var peek = document.getElementById("peek");
  var canHover = window.matchMedia("(hover: hover)").matches;
  if (canHover) {
    var x = 0, y = 0, raf = 0;
    var place = function () {
      raf = 0;
      var w = peek.offsetWidth || 176, h = peek.offsetHeight || 220;
      var px = x + 28, py = y - h / 2;
      if (px + w > window.innerWidth - 12) px = x - w - 28;
      py = Math.max(12, Math.min(py, window.innerHeight - h - 12));
      peek.style.transform = "translate3d(" + px + "px," + py + "px,0)";
    };
    views.forEach(function (v) {
      v.addEventListener("mouseover", function (e) {
        var a = e.target.closest("a[data-slug]");
        if (!a) return;
        var p = bySlug[a.dataset.slug];
        if (p && p.t) { peek.src = p.t; peek.classList.add("is-on"); v.classList.add("is-dim-others"); }
      });
      v.addEventListener("mouseout", function (e) {
        var a = e.target.closest("a[data-slug]");
        if (a && !a.contains(e.relatedTarget)) { peek.classList.remove("is-on"); v.classList.remove("is-dim-others"); }
      });
      v.addEventListener("mousemove", function (e) {
        x = e.clientX; y = e.clientY;
        if (!raf) raf = requestAnimationFrame(place);
      });
    });
  }

  /* ---------- nomination season: open January 1 through June 1 ---------- */
  var season = document.getElementById("season");
  var now = new Date(), yr = now.getFullYear();
  var opens = new Date(yr, 0, 1), closes = new Date(yr, 5, 1, 23, 59);
  if (now >= opens && now <= closes) {
    var left = Math.ceil((closes - now) / 864e5);
    season.textContent = "Nominations are open, " + left + " day" + (left === 1 ? "" : "s") + " left";
  } else {
    season.textContent = "Nominations open January 1, " + (now > closes ? yr + 1 : yr);
  }
})();
