/* Get a Grip: hero wall, route filter, parallax, reveal */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* deterministic pseudo-random so the wall is the same wall on every visit */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  var ROUTES = [
    { key: "gelb",  color: "#FFC61E", start: 0.16, drift: 0.055, count: 11 },
    { key: "gruen", color: "#48C46B", start: 0.34, drift: -0.04, count: 12 },
    { key: "blau",  color: "#3D8DFF", start: 0.52, drift: 0.07,  count: 10 },
    { key: "pink",  color: "#FF4F9C", start: 0.70, drift: -0.05, count: 11 },
    { key: "lila",  color: "#9B6BFF", start: 0.86, drift: -0.09, count: 9 }
  ];

  var W = 1000, H = 640;

  function buildHolds(group) {
    var rand = rng(20260721);
    var holds = [];

    ROUTES.forEach(function (route, ri) {
      var r = rng(1000 + ri * 37);
      for (var i = 0; i < route.count; i++) {
        var t = i / (route.count - 1);
        var x = (route.start + route.drift * t + (r() - 0.5) * 0.075) * W;
        var y = H - 60 - t * (H - 210) + (r() - 0.5) * 46;
        holds.push({
          route: route.key,
          color: route.color,
          x: Math.max(38, Math.min(W - 38, x)),
          y: Math.max(46, Math.min(H - 34, y)),
          rx: 7 + r() * 7,
          ry: 5 + r() * 5,
          rot: r() * 180
        });
      }
    });

    /* neutral holds: on a real wall most of what you see is not your route */
    for (var n = 0; n < 46; n++) {
      holds.push({
        route: "neutral",
        color: n % 3 === 0 ? "#D9C7A3" : "#6E747D",
        x: 40 + rand() * (W - 80),
        y: 50 + rand() * (H - 100),
        rx: 5 + rand() * 6,
        ry: 4 + rand() * 4,
        rot: rand() * 180
      });
    }

    holds.forEach(function (h) {
      var g = document.createElementNS(SVGNS, "g");
      g.setAttribute("class", "hold");
      g.setAttribute("data-route", h.route);
      g.setAttribute("transform", "translate(" + h.x.toFixed(1) + " " + h.y.toFixed(1) + ") rotate(" + h.rot.toFixed(0) + ")");

      var ring = document.createElementNS(SVGNS, "circle");
      ring.setAttribute("class", "hold__ring");
      ring.setAttribute("r", (Math.max(h.rx, h.ry) + 9).toFixed(1));
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", h.color);
      ring.setAttribute("stroke-width", "2");
      g.appendChild(ring);

      var body = document.createElementNS(SVGNS, "ellipse");
      body.setAttribute("rx", h.rx.toFixed(1));
      body.setAttribute("ry", h.ry.toFixed(1));
      body.setAttribute("fill", h.color);
      g.appendChild(body);

      var light = document.createElementNS(SVGNS, "ellipse");
      light.setAttribute("rx", (h.rx * 0.52).toFixed(1));
      light.setAttribute("ry", (h.ry * 0.46).toFixed(1));
      light.setAttribute("cx", (-h.rx * 0.22).toFixed(1));
      light.setAttribute("cy", (-h.ry * 0.26).toFixed(1));
      light.setAttribute("fill", "#ffffff");
      light.setAttribute("opacity", "0.22");
      g.appendChild(light);

      group.appendChild(g);
    });

    return holds;
  }

  var group = document.querySelector(".wall__holds");
  if (group) {
    var holds = buildHolds(group);
    var total = holds.length;
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
    var countOut = document.querySelector("[data-readout-count]");
    var routeOut = document.querySelector("[data-readout-route]");
    var LABEL = { alle: "alle Routen", gelb: "Route Gelb", gruen: "Route Grün", blau: "Route Blau", pink: "Route Pink", lila: "Route Lila" };

    function select(key) {
      var visible = total;
      if (key === "alle") {
        group.classList.remove("is-filtered");
        Array.prototype.forEach.call(group.children, function (el) { el.classList.remove("is-on"); });
      } else {
        group.classList.add("is-filtered");
        visible = 0;
        Array.prototype.forEach.call(group.children, function (el) {
          var on = el.getAttribute("data-route") === key;
          el.classList.toggle("is-on", on);
          if (on) visible++;
        });
      }
      countOut.textContent = visible;
      routeOut.textContent = LABEL[key] || key;
      chips.forEach(function (c) {
        var active = c.getAttribute("data-route") === key;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", c.classList.contains("is-active") ? "true" : "false");
      c.addEventListener("click", function () { select(c.getAttribute("data-route")); });
    });

    group.addEventListener("click", function (e) {
      var hold = e.target.closest(".hold");
      if (!hold) return;
      var key = hold.getAttribute("data-route");
      select(key === "neutral" ? "alle" : key);
    });

    select("alle");
  }

  /* parallax: the panels sit at different depths, like the real prow */
  var frame = document.querySelector(".wall__frame");
  if (frame && !reduced && window.matchMedia("(pointer: fine)").matches) {
    var layers = Array.prototype.slice.call(frame.querySelectorAll(".wall__layer"));
    frame.addEventListener("pointermove", function (e) {
      var r = frame.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute("data-depth")) || 0;
        l.style.transform = "translate(" + (-px * d).toFixed(2) + "px," + (-py * d * 0.6).toFixed(2) + "px)";
      });
    });
    frame.addEventListener("pointerleave", function () {
      layers.forEach(function (l) { l.style.transform = ""; });
    });
  }

  /* reveal on scroll */
  var targets = document.querySelectorAll(".secthead, .card, .step, .specs > div, .proof, .pilot__col, .contact > *");
  if (!reduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    Array.prototype.forEach.call(targets, function (t, i) {
      t.classList.add("reveal");
      t.style.transitionDelay = (Math.min(i % 4, 3) * 60) + "ms";
      io.observe(t);
    });
  }
})();
