/* Get a Grip: photo-traced hero wall, route filter, parallax, reveal */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  var COLORS = {
    gelb: "#FFC61E", gruen: "#48C46B", blau: "#3D8DFF", pink: "#FF4F9C",
    lila: "#9B6BFF", beige: "#D9C7A3", grau: "#7A8089", schwarz: "#31363D"
  };
  var RING = { schwarz: "#D7DCE2", grau: "#EFECE4" };
  var LABEL = {
    alle: "alle Routen", gelb: "Route Gelb", gruen: "Route Grün", blau: "Route Blau",
    pink: "Route Pink", lila: "Route Lila", beige: "Route Beige", schwarz: "Route Schwarz"
  };
  /* grey holds count toward Beige (beige/grau layer), like in the scan */
  function routeOf(c) { return c === "grau" ? "beige" : c; }

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function buildWall() {
    var panelsG = document.querySelector(".wall__panels");
    var volsG = document.querySelector(".wall__vols");
    var holdsG = document.querySelector(".wall__holds");
    if (!panelsG || typeof WALL_DATA === "undefined") return null;

    /* panels: alternating gradients, corner slivers darkest */
    var FILL = { A0: "url(#panelDim)", A: "url(#panelA)", B: "url(#panelB)", C: "url(#panelA)", D: "url(#panelC)", E: "url(#panelB)", ER: "url(#panelDim)" };
    var order = ["A0", "A", "B", "C", "D", "E", "ER"];
    order.forEach(function (key) {
      var q = WALL_DATA.panels[key];
      el("polygon", { points: q.map(function (p) { return p[0] + "," + p[1]; }).join(" "), fill: FILL[key] }, panelsG);
    });
    /* fold highlights */
    order.slice(1).forEach(function (key) {
      var q = WALL_DATA.panels[key];
      el("line", { x1: q[0][0], y1: q[0][1], x2: q[3][0], y2: q[3][1], stroke: "#fff", "stroke-opacity": "0.05", "stroke-width": "2" }, panelsG);
    });
    /* chalk clouds, roughly where the photos show heavy traffic */
    [[250, 320, 95, 55, -15], [330, 540, 80, 45, 10], [520, 190, 130, 65, -25],
     [610, 430, 95, 60, 15], [700, 300, 80, 90, 0], [880, 210, 150, 85, -10],
     [850, 520, 115, 60, 20], [1050, 140, 90, 55, 0], [1250, 310, 125, 70, -20],
     [1190, 560, 95, 50, 10], [1420, 200, 90, 60, 0], [1570, 430, 105, 60, -12]
    ].forEach(function (c) {
      el("ellipse", { cx: c[0], cy: c[1], rx: c[2], ry: c[3], transform: "rotate(" + c[4] + " " + c[0] + " " + c[1] + ")", fill: "url(#chalk)" }, panelsG);
    });
    /* floor mat */
    el("rect", { x: 0, y: 606, width: 1800, height: 34, fill: "#2E3136" }, panelsG);
    el("rect", { x: 0, y: 606, width: 1800, height: 5, fill: "#000", opacity: "0.35" }, panelsG);

    /* volumes */
    WALL_DATA.volumes.forEach(function (v) {
      var g = el("g", { transform: "translate(" + v.x + " " + v.y + ") rotate(" + v.rot + ")" });
      if (v.k === "fan") {
        /* circular quarter-pie: corner offset so (x,y) is the visual centre */
        var r = (v.r + v.r2) / 2, a = 0.45 * r;
        var d = "M" + (-a) + " " + (-a) + " L" + (r - a) + " " + (-a) +
                " A" + r + " " + r + " 0 0 1 " + (-a) + " " + (r - a) + " Z";
        g.setAttribute("class", "hold vol--route");
        g.setAttribute("data-route", "gelb");
        el("path", { d: d, fill: "url(#volYellow)", stroke: "#7A5C0B", "stroke-width": "1.5" }, g);
        if (v.seam) el("line", { x1: -a, y1: -a, x2: 0.68 * r - a, y2: 0.68 * r - a, stroke: "#0D0F12", "stroke-width": "3", "stroke-opacity": "0.75" }, g);
        el("circle", { "class": "hold__ring", r: r * 0.72, cx: 0.12 * r, cy: 0.12 * r, fill: "none", stroke: COLORS.gelb, "stroke-width": "2.5" }, g);
      } else if (v.k === "half") {
        /* half-disc: flat edge through the centre, arc bulging to +x */
        var hr = (v.r + v.r2) / 2;
        g.setAttribute("class", "hold vol--route");
        g.setAttribute("data-route", "gelb");
        el("path", { d: "M0 " + (-hr) + " A" + hr + " " + hr + " 0 0 1 0 " + hr + " Z", fill: "url(#volYellow)", stroke: "#7A5C0B", "stroke-width": "1.5" }, g);
        if (v.seam) el("line", { x1: 0, y1: 0, x2: hr * 0.95, y2: hr * 0.12, stroke: "#0D0F12", "stroke-width": "3", "stroke-opacity": "0.7" }, g);
        el("circle", { "class": "hold__ring", r: hr * 0.8, cx: hr * 0.3, fill: "none", stroke: COLORS.gelb, "stroke-width": "2.5" }, g);
      } else if (v.k === "leaf" || v.k === "lens") {
        var rx = v.r, ry = v.r2;
        g.setAttribute("class", "hold vol--route");
        g.setAttribute("data-route", "gelb");
        el("path", { d: "M" + (-rx) + " 0 C" + (-rx * 0.3) + " " + (-ry) + " " + (rx * 0.3) + " " + (-ry) + " " + rx + " 0 C" + (rx * 0.3) + " " + ry + " " + (-rx * 0.3) + " " + ry + " " + (-rx) + " 0 Z", fill: "url(#volYellow)", stroke: "#7A5C0B", "stroke-width": "1.5" }, g);
        if (v.seam) el("line", { x1: -rx * 0.55, y1: ry * 0.4, x2: rx * 0.6, y2: -ry * 0.45, stroke: "#0D0F12", "stroke-width": "3", "stroke-opacity": "0.7" }, g);
        el("circle", { "class": "hold__ring", r: Math.max(rx, ry) + 8, fill: "none", stroke: COLORS.gelb, "stroke-width": "2.5" }, g);
      } else if (v.k === "pyr") {
        var w = v.r, h = v.r2;
        g.setAttribute("class", "vol");
        el("polygon", { points: (-w) + "," + (h * 0.62) + " 0," + (-h) + " " + w + "," + (h * 0.7), fill: "url(#volDark)", stroke: "#000", "stroke-opacity": "0.4", "stroke-width": "1" }, g);
        el("polygon", { points: "0," + (-h) + " " + w + "," + (h * 0.7) + " " + (w * 0.2) + "," + (h * 0.74), fill: "#0B0D10", opacity: "0.8" }, g);
      } else { /* dome */
        g.setAttribute("class", "vol");
        el("ellipse", { rx: v.r, ry: v.r2 * 0.8, fill: "url(#volDark)", stroke: "#000", "stroke-opacity": "0.4" }, g);
        el("ellipse", { rx: v.r * 0.45, ry: v.r2 * 0.3, cx: -v.r * 0.2, cy: -v.r2 * 0.25, fill: "#fff", opacity: "0.06" }, g);
      }
      volsG.appendChild(g);
    });

    /* holds */
    WALL_DATA.holds.forEach(function (hh) {
      var g = el("g", {
        "class": "hold", "data-route": routeOf(hh.c),
        transform: "translate(" + hh.x + " " + hh.y + ") rotate(" + hh.rot + ")"
      });
      var color = COLORS[hh.c];
      el("circle", { "class": "hold__ring", r: Math.max(hh.rx, hh.ry) + 8, fill: "none", stroke: RING[hh.c] || color, "stroke-width": "2" }, g);
      if (hh.s === "lens") {
        el("path", { d: "M" + (-hh.rx) + " 0 C" + (-hh.rx * 0.3) + " " + (-hh.ry) + " " + (hh.rx * 0.3) + " " + (-hh.ry) + " " + hh.rx + " 0 C" + (hh.rx * 0.3) + " " + hh.ry + " " + (-hh.rx * 0.3) + " " + hh.ry + " " + (-hh.rx) + " 0 Z", fill: color }, g);
      } else {
        el("ellipse", { rx: hh.rx, ry: hh.ry, fill: color }, g);
      }
      el("ellipse", { rx: hh.rx * 0.5, ry: hh.ry * 0.42, cx: -hh.rx * 0.22, cy: -hh.ry * 0.28, fill: "#fff", opacity: hh.c === "schwarz" ? "0.12" : "0.22" }, g);
      holdsG.appendChild(g);
    });

    return holdsG;
  }

  var group = buildWall();
  if (group) {
    var routed = Array.prototype.slice.call(document.querySelectorAll(".wall__vols .hold, .wall__holds .hold"));
    var total = routed.length;
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
    var countOut = document.querySelector("[data-readout-count]");
    var routeOut = document.querySelector("[data-readout-route]");
    var svg = document.querySelector(".wall__svg");

    function select(key) {
      var visible = total;
      var filtered = key !== "alle";
      svg.classList.toggle("is-filtered", filtered);
      if (filtered) visible = 0;
      routed.forEach(function (n) {
        var on = !filtered || n.getAttribute("data-route") === key;
        n.classList.toggle("is-on", filtered && on);
        if (filtered && on) visible++;
      });
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

    svg.addEventListener("click", function (e) {
      var hold = e.target.closest(".hold");
      if (!hold) return;
      select(hold.getAttribute("data-route"));
    });

    /* deep link: #gruen etc. selects a route on load */
    var initial = (location.hash || "").replace("#", "");
    select(LABEL[initial] && initial !== "alle" ? initial : "alle");
  }

  /* parallax: panel, volume and hold layers at different depths */
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
