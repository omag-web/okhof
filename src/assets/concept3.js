// Design concept 3 interactions: mobile menu, random inductee cards, nomination season.
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
