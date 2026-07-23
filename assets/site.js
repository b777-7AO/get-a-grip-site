/* Get a Grip: photo-traced walls (hall bay + training wall), route filter, parallax, reveal */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  var COLORS = {
    gelb: "#FFC61E", gruen: "#48C46B", blau: "#3D8DFF", pink: "#FF4F9C",
    lila: "#9B6BFF", beige: "#D9C7A3", grau: "#8A9099", schwarz: "#31363D",
    rot: "#E8482B", orange: "#F97C27"
  };
  var RING = { schwarz: "#D7DCE2" };
  var LABEL = {
    alle: "alle Routen", gelb: "Route Gelb", gruen: "Route Grün", blau: "Route Blau",
    pink: "Route Pink", lila: "Route Lila", beige: "Route Beige", schwarz: "Route Schwarz",
    rot: "Route Rot", orange: "Route Orange", grau: "Route Grau"
  };
  var CHIP = {
    gelb: "Gelb", gruen: "Grün", blau: "Blau", pink: "Pink", lila: "Lila",
    beige: "Beige", schwarz: "Schwarz", rot: "Rot", orange: "Orange", grau: "Grau"
  };
  var WALLS = {
    halle: { routes: ["gelb", "gruen", "blau", "pink", "lila", "beige", "schwarz"] },
    training: { routes: ["orange", "rot", "gelb", "gruen", "blau", "pink", "grau"] }
  };

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* deterministic per-hold randomness so the wall never changes between visits */
  function rng(seed) {
    var s = (seed * 2654435761) >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /* organic hold outline: jittered radii around an ellipse, smoothed */
  function blobPath(rx, ry, seed, jitter) {
    var r = rng(seed), n = 9, pts = [];
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var k = 1 + (r() - 0.5) * 2 * jitter;
      pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
    }
    var d = "";
    for (i = 0; i < n; i++) {
      var p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      if (i === 0) d = "M" + p1[0].toFixed(1) + " " + p1[1].toFixed(1);
      d += "C" + c1[0].toFixed(1) + " " + c1[1].toFixed(1) + " " + c2[0].toFixed(1) + " " + c2[1].toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d + "Z";
  }

  /* teardrop: dome top, tapering tail (the classic screw-on shape) */
  function tearPath(r) {
    return "M" + (-r) + " 0" +
      " C" + (-r) + " " + (-1.15 * r) + " " + r + " " + (-1.15 * r) + " " + r + " 0" +
      " C" + r + " " + (0.55 * r) + " " + (0.35 * r) + " " + (1.05 * r) + " 0 " + (1.3 * r) +
      " C" + (-0.35 * r) + " " + (1.05 * r) + " " + (-r) + " " + (0.55 * r) + " " + (-r) + " 0 Z";
  }

  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
    return "rgb(" + Math.min(r, 255) + "," + Math.min(g, 255) + "," + Math.min(b, 255) + ")";
  }

  /* bolt holes scattered on a volume face, like the real plywood bodies */
  function bolts(g, seed, spread) {
    var r = rng(seed + 77);
    for (var i = 0; i < 4; i++) {
      el("circle", {
        cx: ((r() - 0.4) * 2 * spread).toFixed(1), cy: ((r() - 0.4) * 2 * spread).toFixed(1),
        r: 1.6, fill: "#3A2E06", opacity: "0.8"
      }, g);
    }
  }

  /* ---------- hall bay (photo-traced, 5 facets) ---------- */
  function buildHalle(panelsG, volsG, holdsG) {
    var FILL = { A0: "url(#panelDim)", A: "url(#panelA)", B: "url(#panelB)", C: "url(#panelA)", D: "url(#panelC)", E: "url(#panelB)", ER: "url(#panelDim)" };
    var order = ["A0", "A", "B", "C", "D", "E", "ER"];
    order.forEach(function (key) {
      var q = WALL_DATA.panels[key];
      el("polygon", { points: q.map(function (p) { return p[0] + "," + p[1]; }).join(" "), fill: FILL[key] }, panelsG);
    });
    order.slice(1).forEach(function (key) {
      var q = WALL_DATA.panels[key];
      el("line", { x1: q[0][0], y1: q[0][1], x2: q[3][0], y2: q[3][1], stroke: "#fff", "stroke-opacity": "0.05", "stroke-width": "2" }, panelsG);
    });
    [[250, 320, 95, 55, -15], [330, 540, 80, 45, 10], [520, 190, 130, 65, -25],
     [610, 430, 95, 60, 15], [700, 300, 80, 90, 0], [880, 210, 150, 85, -10],
     [850, 520, 115, 60, 20], [1050, 140, 90, 55, 0], [1250, 310, 125, 70, -20],
     [1190, 560, 95, 50, 10], [1420, 200, 90, 60, 0], [1570, 430, 105, 60, -12]
    ].forEach(function (c) {
      el("ellipse", { cx: c[0], cy: c[1], rx: c[2], ry: c[3], transform: "rotate(" + c[4] + " " + c[0] + " " + c[1] + ")", fill: "url(#chalk)" }, panelsG);
    });
    el("rect", { x: 0, y: 606, width: 1800, height: 34, fill: "#2E3136" }, panelsG);
    el("rect", { x: 0, y: 606, width: 1800, height: 5, fill: "#000", opacity: "0.35" }, panelsG);

    WALL_DATA.volumes.forEach(function (v, vi) {
      var g = el("g", { transform: "translate(" + v.x + " " + v.y + ") rotate(" + v.rot + ")" });
      var rad = -v.rot * Math.PI / 180;
      var ox = 5 * Math.cos(rad) - 7 * Math.sin(rad);
      var oy = 5 * Math.sin(rad) + 7 * Math.cos(rad);
      function depthPair(d) {
        el("path", { d: d, transform: "translate(" + ox.toFixed(1) + " " + oy.toFixed(1) + ")", fill: "#6B4F09" }, g);
        return el("path", { d: d, fill: "url(#volYellow)", stroke: "#7A5C0B", "stroke-width": "1" }, g);
      }
      if (v.k === "fan") {
        var r = (v.r + v.r2) / 2, a = 0.45 * r;
        var d = "M" + (-a) + " " + (-a) + " L" + (r - a) + " " + (-a) +
                " A" + r + " " + r + " 0 0 1 " + (-a) + " " + (r - a) + " Z";
        g.setAttribute("class", "hold vol--route");
        g.setAttribute("data-route", "gelb");
        depthPair(d);
        el("path", { d: "M" + (r - a) + " " + (-a) + " A" + r + " " + r + " 0 0 1 " + (-a) + " " + (r - a), fill: "none", stroke: "#FFE38A", "stroke-width": "1.5", "stroke-opacity": "0.35" }, g);
        if (v.seam) el("line", { x1: -a, y1: -a, x2: 0.68 * r - a, y2: 0.68 * r - a, stroke: "#0D0F12", "stroke-width": "3", "stroke-opacity": "0.75" }, g);
        bolts(g, vi, r * 0.6);
        el("circle", { "class": "hold__ring", r: r * 0.72, cx: 0.12 * r, cy: 0.12 * r, fill: "none", stroke: COLORS.gelb, "stroke-width": "2.5" }, g);
      } else if (v.k === "half") {
        var hr = (v.r + v.r2) / 2;
        var hd = "M0 " + (-hr) + " A" + hr + " " + hr + " 0 0 1 0 " + hr + " Z";
        g.setAttribute("class", "hold vol--route");
        g.setAttribute("data-route", "gelb");
        depthPair(hd);
        el("path", { d: "M0 " + (-hr) + " A" + hr + " " + hr + " 0 0 1 0 " + hr, fill: "none", stroke: "#FFE38A", "stroke-width": "1.5", "stroke-opacity": "0.35" }, g);
        if (v.seam) el("line", { x1: 0, y1: 0, x2: hr * 0.95, y2: hr * 0.12, stroke: "#0D0F12", "stroke-width": "3", "stroke-opacity": "0.7" }, g);
        bolts(g, vi, hr * 0.55);
        el("circle", { "class": "hold__ring", r: hr * 0.8, cx: hr * 0.3, fill: "none", stroke: COLORS.gelb, "stroke-width": "2.5" }, g);
      } else if (v.k === "leaf" || v.k === "lens") {
        var rx = v.r, ry = v.r2;
        var ld = "M" + (-rx) + " 0 C" + (-rx * 0.3) + " " + (-ry) + " " + (rx * 0.3) + " " + (-ry) + " " + rx + " 0 C" + (rx * 0.3) + " " + ry + " " + (-rx * 0.3) + " " + ry + " " + (-rx) + " 0 Z";
        g.setAttribute("class", "hold vol--route");
        g.setAttribute("data-route", "gelb");
        depthPair(ld);
        el("path", { d: "M" + (-rx) + " 0 C" + (-rx * 0.3) + " " + (-ry) + " " + (rx * 0.3) + " " + (-ry) + " " + rx + " 0", fill: "none", stroke: "#FFE38A", "stroke-width": "1.5", "stroke-opacity": "0.4" }, g);
        if (v.seam) el("line", { x1: -rx * 0.55, y1: ry * 0.4, x2: rx * 0.6, y2: -ry * 0.45, stroke: "#0D0F12", "stroke-width": "3", "stroke-opacity": "0.7" }, g);
        bolts(g, vi, Math.min(rx, ry) * 0.55);
        el("circle", { "class": "hold__ring", r: Math.max(rx, ry) + 8, fill: "none", stroke: COLORS.gelb, "stroke-width": "2.5" }, g);
      } else if (v.k === "pyr") {
        var w = v.r, h = v.r2;
        g.setAttribute("class", "vol");
        var p1 = (-w) + "," + (h * 0.62), p2 = "0," + (-h), p3 = w + "," + (h * 0.7);
        el("polygon", { points: p1 + " " + p2 + " " + p3, fill: "url(#volDark)", stroke: "#000", "stroke-opacity": "0.4", "stroke-width": "1" }, g);
        el("polygon", { points: p2 + " " + p3 + " " + (w * 0.14) + "," + (h * 0.76), fill: "#0B0D10", opacity: "0.85" }, g);
        el("line", { x1: 0, y1: -h, x2: w * 0.14, y2: h * 0.76, stroke: "#000", "stroke-opacity": "0.5", "stroke-width": "1" }, g);
        el("line", { x1: -w, y1: h * 0.62, x2: 0, y2: -h, stroke: "#4A525C", "stroke-opacity": "0.55", "stroke-width": "1.5" }, g);
      } else {
        g.setAttribute("class", "vol");
        el("ellipse", { rx: v.r, ry: v.r2 * 0.8, fill: "url(#volDark)", stroke: "#000", "stroke-opacity": "0.4" }, g);
        el("ellipse", { rx: v.r * 0.45, ry: v.r2 * 0.3, cx: -v.r * 0.2, cy: -v.r2 * 0.25, fill: "#fff", opacity: "0.06" }, g);
      }
      volsG.appendChild(g);
    });

    WALL_DATA.holds.forEach(function (hh, hi) {
      /* grey holds join the beige/grey layer, like in the scan */
      var route = hh.c === "grau" ? "beige" : hh.c;
      var g = el("g", {
        "class": "hold", "data-route": route,
        transform: "translate(" + hh.x + " " + hh.y + ") rotate(" + hh.rot + ")"
      });
      var color = COLORS[hh.c];
      el("circle", { "class": "hold__ring", r: Math.max(hh.rx, hh.ry) + 8, fill: "none", stroke: RING[hh.c] || color, "stroke-width": "2" }, g);
      if (hh.s === "lens") {
        el("path", { d: "M" + (-hh.rx) + " 0 C" + (-hh.rx * 0.3) + " " + (-hh.ry) + " " + (hh.rx * 0.3) + " " + (-hh.ry) + " " + hh.rx + " 0 C" + (hh.rx * 0.3) + " " + hh.ry + " " + (-hh.rx * 0.3) + " " + hh.ry + " " + (-hh.rx) + " 0 Z", fill: color, stroke: shade(color, 0.65), "stroke-width": "1" }, g);
      } else if (hh.s === "jug") {
        /* two-lobe jug */
        el("path", { d: blobPath(hh.rx, hh.ry, hi * 3 + 1, 0.1), fill: color, stroke: shade(color, 0.65), "stroke-width": "1" }, g);
        el("path", { d: blobPath(hh.rx * 0.62, hh.ry * 0.66, hi * 5 + 2, 0.12), transform: "translate(" + (hh.rx * 0.45) + " " + (hh.ry * 0.5) + ")", fill: color, stroke: shade(color, 0.65), "stroke-width": "1" }, g);
      } else if (hh.s === "brain") {
        el("path", { d: blobPath(hh.rx, hh.ry, hi * 3 + 1, 0.2), fill: color, stroke: shade(color, 0.6), "stroke-width": "1" }, g);
        /* brain wrinkles */
        el("path", { d: "M" + (-hh.rx * 0.5) + " " + (-hh.ry * 0.2) + " Q" + (-hh.rx * 0.1) + " " + (-hh.ry * 0.7) + " " + (hh.rx * 0.35) + " " + (-hh.ry * 0.25), fill: "none", stroke: shade(color, 0.55), "stroke-width": "1.5", "stroke-opacity": "0.7" }, g);
        el("path", { d: "M" + (-hh.rx * 0.4) + " " + (hh.ry * 0.35) + " Q" + (hh.rx * 0.05) + " " + (hh.ry * 0.05) + " " + (hh.rx * 0.5) + " " + (hh.ry * 0.3), fill: "none", stroke: shade(color, 0.55), "stroke-width": "1.5", "stroke-opacity": "0.7" }, g);
      } else {
        el("path", { d: blobPath(hh.rx, hh.ry, hi * 3 + 1, 0.11), fill: color, stroke: shade(color, 0.65), "stroke-width": "1" }, g);
      }
      el("ellipse", { rx: hh.rx * 0.5, ry: hh.ry * 0.42, cx: -hh.rx * 0.22, cy: -hh.ry * 0.28, fill: "#fff", opacity: hh.c === "schwarz" ? "0.12" : "0.2" }, g);
      if (Math.max(hh.rx, hh.ry) > 16) {
        el("circle", { r: 2.2, fill: "#000", opacity: "0.35" }, g);
      }
      holdsG.appendChild(g);
    });
  }

  /* ---------- training wall (head-on 1:1 trace, 8 birch panels) ---------- */
  function buildTraining(panelsG, volsG, holdsG) {
    WALL_TRAIN.panels.forEach(function (q, i) {
      el("rect", { x: q[0], y: q[1], width: q[2] - q[0], height: q[3] - q[1], fill: i % 2 ? "url(#birchB)" : "url(#birchA)", stroke: "#B6A57F", "stroke-width": "1" }, panelsG);
      /* t-nut grid */
      for (var gx = q[0] + 50; gx < q[2] - 20; gx += 95) {
        for (var gy = q[1] + 32; gy < q[3] - 14; gy += 95) {
          el("circle", { cx: gx, cy: gy, r: 2.4, fill: "#8F815F", opacity: "0.55" }, panelsG);
        }
      }
      /* corner screws */
      [[q[0] + 12, q[1] + 12], [q[2] - 12, q[1] + 12], [q[0] + 12, q[3] - 12], [q[2] - 12, q[3] - 12]].forEach(function (s) {
        el("circle", { cx: s[0], cy: s[1], r: 3.4, fill: "#93A7BB", stroke: "#5F7285", "stroke-width": "1" }, panelsG);
      });
      /* wood grain hint */
      var r = rng(i + 31);
      for (var w = 0; w < 3; w++) {
        var wy = q[1] + r() * (q[3] - q[1]);
        el("path", { d: "M" + q[0] + " " + wy.toFixed(0) + " q " + ((q[2] - q[0]) / 2) + " " + ((r() - 0.5) * 26).toFixed(0) + " " + (q[2] - q[0]) + " 0", fill: "none", stroke: "#B9A87F", "stroke-width": "1", "stroke-opacity": "0.35" }, panelsG);
      }
    });

    WALL_TRAIN.holds.forEach(function (hh, hi) {
      var g = el("g", {
        "class": "hold", "data-route": hh.c,
        transform: "translate(" + hh.x + " " + hh.y + ") rotate(" + hh.rot + ")"
      });
      var color = COLORS[hh.c], r = hh.r;
      el("circle", { "class": "hold__ring", r: r * 1.75, fill: "none", stroke: color, "stroke-width": "2.5" }, g);
      /* soft drop shadow, like the head-on photo */
      el("path", { d: hh.s === "blob" ? blobPath(r, r * 0.9, hi * 7 + 3, 0.12) : tearPath(r), transform: "translate(3.2 4.5)", fill: "#4A3F28", opacity: "0.28" }, g);
      if (hh.s === "blob") {
        el("path", { d: blobPath(r, r * 0.9, hi * 7 + 3, 0.12), fill: color, stroke: shade(color, 0.62), "stroke-width": "1.2" }, g);
      } else if (hh.s === "jug") {
        el("path", { d: tearPath(r), fill: color, stroke: shade(color, 0.62), "stroke-width": "1.2" }, g);
        /* finger pockets */
        el("ellipse", { cx: -r * 0.35, cy: r * 0.35, rx: r * 0.2, ry: r * 0.14, fill: shade(color, 0.5), opacity: "0.65" }, g);
        el("ellipse", { cx: r * 0.3, cy: r * 0.42, rx: r * 0.18, ry: r * 0.13, fill: shade(color, 0.5), opacity: "0.65" }, g);
      } else {
        el("path", { d: tearPath(r), fill: color, stroke: shade(color, 0.62), "stroke-width": "1.2" }, g);
      }
      /* dome highlight + washer bolt, clearly visible on the real holds */
      el("ellipse", { rx: r * 0.5, ry: r * 0.4, cx: -r * 0.2, cy: -r * 0.45, fill: "#fff", opacity: "0.25" }, g);
      el("circle", { r: 5, fill: "#C9CBCE", stroke: "#8E9296", "stroke-width": "1.2" }, g);
      el("circle", { r: 2.1, fill: "#7F8489" }, g);
      holdsG.appendChild(g);
    });
  }

  /* ---------- shared wall controller ---------- */
  var svg = document.querySelector(".wall__svg");
  if (svg && typeof WALL_DATA !== "undefined") {
    var panelsG = svg.querySelector(".wall__panels");
    var volsG = svg.querySelector(".wall__vols");
    var holdsG = svg.querySelector(".wall__holds");
    var chipsBox = document.querySelector(".chips");
    var countOut = document.querySelector("[data-readout-count]");
    var routeOut = document.querySelector("[data-readout-route]");
    var frame = document.querySelector(".wall__frame");
    var routed = [], chips = [], currentWall = "halle";

    function select(key) {
      var filtered = key !== "alle";
      var visible = 0;
      svg.classList.toggle("is-filtered", filtered);
      routed.forEach(function (n) {
        var on = !filtered || n.getAttribute("data-route") === key;
        n.classList.toggle("is-on", filtered && on);
        if (!filtered || on) visible++;
      });
      countOut.textContent = visible;
      routeOut.textContent = LABEL[key] || key;
      chips.forEach(function (c) {
        var active = c.getAttribute("data-route") === key;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function buildChips(wallKey) {
      chipsBox.innerHTML = "";
      var keys = ["alle"].concat(WALLS[wallKey].routes);
      chips = keys.map(function (key) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.setAttribute("data-route", key);
        var dot = document.createElement("span");
        dot.className = "chip__dot" + (key === "alle" ? " chip__dot--all" : key === "schwarz" ? " chip__dot--schwarz" : "");
        if (key !== "alle" && key !== "schwarz") dot.style.setProperty("--c", COLORS[key]);
        dot.setAttribute("aria-hidden", "true");
        b.appendChild(dot);
        b.appendChild(document.createTextNode(key === "alle" ? "Alle" : CHIP[key]));
        b.addEventListener("click", function () { select(key); });
        chipsBox.appendChild(b);
        return b;
      });
    }

    function showWall(wallKey, routeKey) {
      currentWall = wallKey;
      panelsG.innerHTML = ""; volsG.innerHTML = ""; holdsG.innerHTML = "";
      if (wallKey === "training") {
        svg.setAttribute("viewBox", "0 0 " + WALL_TRAIN.size[0] + " " + WALL_TRAIN.size[1]);
        frame.classList.add("wall__frame--train");
        buildTraining(panelsG, volsG, holdsG);
      } else {
        svg.setAttribute("viewBox", "0 0 1800 640");
        frame.classList.remove("wall__frame--train");
        buildHalle(panelsG, volsG, holdsG);
      }
      routed = Array.prototype.slice.call(svg.querySelectorAll(".hold"));
      buildChips(wallKey);
      Array.prototype.forEach.call(document.querySelectorAll(".wall__tab"), function (t) {
        var active = t.getAttribute("data-wall") === wallKey;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      select(routeKey && WALLS[wallKey].routes.indexOf(routeKey) >= 0 ? routeKey : "alle");
    }

    Array.prototype.forEach.call(document.querySelectorAll(".wall__tab"), function (t) {
      t.addEventListener("click", function () { showWall(t.getAttribute("data-wall")); });
    });

    svg.addEventListener("click", function (e) {
      var hold = e.target.closest(".hold");
      if (!hold) return;
      select(hold.getAttribute("data-route"));
    });

    /* deep link: #gruen, #training or #training-rot */
    var hash = (location.hash || "").replace("#", "");
    var parts = hash.split("-");
    if (parts[0] === "training") showWall("training", parts[1]);
    else showWall("halle", parts[0]);
  }

  /* parallax: panel, volume and hold layers at different depths */
  var frameEl = document.querySelector(".wall__frame");
  if (frameEl && !reduced && window.matchMedia("(pointer: fine)").matches) {
    var layers = Array.prototype.slice.call(frameEl.querySelectorAll(".wall__layer"));
    frameEl.addEventListener("pointermove", function (e) {
      var r = frameEl.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute("data-depth")) || 0;
        l.style.transform = "translate(" + (-px * d).toFixed(2) + "px," + (-py * d * 0.6).toFixed(2) + "px)";
      });
    });
    frameEl.addEventListener("pointerleave", function () {
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
