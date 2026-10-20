// Design concept 3 interactions: mobile menu, random inductee cards, town map, nomination season.
(function () {
  "use strict";
  var people = JSON.parse(document.getElementById("people").textContent);
  var esc = function (t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  };

  /* Mobile menu */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("hdr-nav");
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Close" : "Menu";
  });

  /* Four random inductees on every visit */
  var withPhotos = people.filter(function (p) { return p.t; });
  for (var k = withPhotos.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = withPhotos[k]; withPhotos[k] = withPhotos[j]; withPhotos[j] = t; }
  document.getElementById("pcards").innerHTML = withPhotos.slice(0, 4).map(function (p) {
    return '<li class="pcard"><a href="' + esc(p.u) + '"><span class="pcard-img"><img src="' + esc(p.t) + '" alt="" decoding="async"></span>' +
      '<span class="pcard-body"><span class="pcard-year">Class of ' + p.y + '</span><span class="pcard-name">' + esc(p.n) + '</span>' +
      '<span class="pcard-role">' + esc(p.r) + '</span><span class="pcard-more">View profile</span></span></a></li>';
  }).join("");

  /* Map of towns */
  var townTitle = document.getElementById("town-title");
  var townTop = document.getElementById("town-top");
  var townPeople = document.getElementById("town-people");
  var townPanel = document.getElementById("town-panel");
  var townBack = document.getElementById("town-back");
  var townDots = Array.prototype.slice.call(document.querySelectorAll(".town"));
  function showTown(town) {
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
  }
  // Bring the panel's top back into view if it has scrolled off screen (e.g. on phones, where it sits under the map)
  function keepPanelInView() {
    var top = townPanel.getBoundingClientRect().top;
    if (top < 80 || top > window.innerHeight - 120) townPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function resetTown() {
    townTitle.textContent = "Most represented";
    townTop.hidden = false;
    townPeople.hidden = true;
    townBack.hidden = true;
    townDots.forEach(function (d) { d.classList.remove("is-active"); });
    keepPanelInView();
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
  townBack.addEventListener("click", function (e) {
    if (e.target.closest("[data-back]")) resetTown();
  });

  /* Nomination season: open January 1 through June 1 */
  var now = new Date(), yr = now.getFullYear();
  var opens = new Date(yr, 0, 1), closes = new Date(yr, 5, 1, 23, 59);
  var text;
  if (now >= opens && now <= closes) {
    var left = Math.ceil((closes - now) / 864e5);
    text = "Nominations are open: " + left + " day" + (left === 1 ? "" : "s") + " left";
  } else {
    text = "Nominations open January 1, " + (now > closes ? yr + 1 : yr);
  }
    document.getElementById("season-cta").textContent = text;
})();
