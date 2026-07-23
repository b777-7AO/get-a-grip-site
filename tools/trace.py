#!/usr/bin/env python3
"""Photo-traced hold data -> wall SVG coordinates.

Every hold was traced by eye from the four source photos (July 2026):
  P5  = 5267a581 wide corner shot   (panels A0/A/B/C, left part of D)
  P2  = 02b33997 close-up portrait  (panel D)
  P4  = 7dff778b dusk wide shot     (panel E, black holds on D's right edge)
  P7  = 338970e6 corner close-up    (colour check: C holds are violet, not pink)

Each panel has a quad in photo space and a quad in wall (SVG) space.
Holds are mapped photo -> (u,v) via inverse bilinear -> wall via bilinear.
Sizes scale with the local jacobian so close-up traces land at wall scale.
Output: assets/wall-data.js
"""
import json, math, os

# ---- wall-space quads (SVG viewBox 0 0 1800 640), tl tr br bl ----
WALL = {
    "A0": [(0, 70), (150, 52), (95, 612), (0, 616)],
    "A":  [(150, 52), (392, 26), (447, 612), (95, 612)],
    "B":  [(392, 26), (806, 16), (748, 612), (447, 612)],
    "C":  [(806, 16), (1122, 38), (1142, 612), (748, 612)],
    "D":  [(1122, 38), (1472, 22), (1492, 612), (1142, 612)],
    "E":  [(1472, 22), (1692, 40), (1758, 612), (1492, 612)],
    "ER": [(1692, 40), (1800, 78), (1800, 612), (1758, 612)],
}

# ---- photo-space quads, tl tr br bl (photo id, coords in displayed px) ----
PHOTO = {
    "A":  ("P5", [(140, 80), (250, 190), (345, 830), (20, 850)]),
    "B":  ("P5", [(245, 175), (705, 48), (620, 835), (345, 830)]),
    "C":  ("P5", [(700, 55), (1015, 42), (1010, 845), (620, 835)]),
    "D":  ("P2", [(25, 30), (1080, 20), (1080, 1430), (15, 1435)]),
    "D4": ("P4", [(10, 50), (750, 35), (770, 1060), (0, 1075)]),
    "E":  ("P4", [(750, 35), (1230, 40), (1390, 1070), (782, 1060)]),
}

# ---- holds: (panel, x, y, colour, rx, ry, rot) in photo px ----
H = []
def h(panel, x, y, c, rx, ry=None, rot=0, shape="blob"):
    H.append(dict(p=panel, x=x, y=y, c=c, rx=rx, ry=ry or rx * 0.75, rot=rot, s=shape))

# panel A (photo P5) -----------------------------------------------------
h("A", 177, 122, "gelb", 30, 18, 25, "lens")
h("A", 219, 182, "gelb", 15, 13)
h("A", 163, 222, "beige", 25, 20, 10)
h("A", 143, 325, "beige", 24, 19, -5)
h("A", 100, 352, "gelb", 15, 13)
h("A", 176, 282, "pink", 16, 13, 10)
h("A", 158, 375, "pink", 20, 15, 15)
h("A", 128, 397, "pink", 15, 12)
h("A", 188, 410, "beige", 24, 19, 20)
h("A", 288, 417, "pink", 14, 11)
h("A", 311, 487, "pink", 13, 10)
h("A", 84, 484, "gelb", 13, 11)
h("A", 118, 507, "pink", 14, 11)
h("A", 87, 526, "pink", 12, 10)
h("A", 159, 580, "blau", 10, 8)
h("A", 56, 590, "pink", 32, 22, -20, "jug")
h("A", 101, 612, "pink", 15, 12)
h("A", 111, 637, "gelb", 16, 14)
h("A", 131, 660, "pink", 12, 10)
h("A", 148, 670, "pink", 11, 9)
h("A", 136, 772, "pink", 16, 12, 10)   # sits on the giant fan

# panel B (photo P5) -----------------------------------------------------
h("B", 475, 108, "blau", 27, 22, -10, "brain")
h("B", 635, 122, "blau", 25, 21, 15, "brain")
h("B", 415, 215, "blau", 12, 9, -20)
h("B", 438, 228, "blau", 10, 8, -30)
h("B", 470, 205, "schwarz", 18, 13, 30)
h("B", 555, 287, "blau", 21, 16, 0)
h("B", 425, 330, "blau", 14, 11)
h("B", 607, 227, "beige", 21, 16, 10)
h("B", 598, 335, "beige", 20, 16, -10)
h("B", 592, 432, "beige", 20, 16, 5)
h("B", 375, 440, "blau", 22, 18, 0, "brain")
h("B", 440, 580, "blau", 22, 18, -15, "brain")
h("B", 567, 622, "blau", 13, 10)
h("B", 505, 650, "schwarz", 14, 10, 0)
h("B", 430, 670, "grau", 20, 16, 10)
h("B", 502, 697, "grau", 18, 14, -5)

# panel C (photo P5, colours verified violet in P7) ----------------------
h("C", 822, 197, "beige", 21, 16, 15)
h("C", 737, 252, "lila", 20, 16, -10)
h("C", 760, 315, "beige", 18, 14, 0)
h("C", 702, 340, "lila", 14, 11)
h("C", 737, 397, "lila", 15, 12)
h("C", 720, 450, "lila", 17, 12, 30)
h("C", 810, 527, "lila", 15, 12, 10)
h("C", 812, 558, "lila", 14, 11)
h("C", 887, 592, "lila", 19, 12, -35)
h("C", 707, 647, "lila", 19, 15, 0)
h("C", 790, 755, "lila", 17, 13, 15)   # on the giant fan
h("C", 962, 780, "lila", 17, 15)
h("C", 997, 450, "gruen", 34, 28, -15)
h("C", 948, 520, "gruen", 22, 16, 20)  # on the pyramid volume
h("C", 1005, 607, "gruen", 14, 10, -20)
h("C", 1002, 647, "gruen", 15, 11, 10)
h("C", 945, 680, "gruen", 14, 12)
h("C", 935, 717, "gruen", 18, 15, 0)

# panel D (photo P2) -----------------------------------------------------
h("D", 485, 127, "gruen", 55, 42, -10)
h("D", 580, 100, "blau", 27, 23, 0)
h("D", 507, 277, "beige", 26, 21, 10)
h("D", 595, 270, "blau", 36, 30, -15, "brain")
h("D", 422, 287, "gruen", 28, 24, 0)
h("D", 427, 342, "gruen", 28, 26, 10)
h("D", 755, 397, "blau", 15, 12)
h("D", 767, 460, "blau", 20, 16, 0)
h("D", 582, 465, "beige", 30, 23, -10)
h("D", 487, 485, "gruen", 32, 26, 15)
h("D", 483, 552, "gruen", 36, 30, -5)
h("D", 537, 612, "blau", 13, 10)
h("D", 545, 700, "blau", 23, 19, 0)
h("D", 556, 738, "gruen", 14, 11)
h("D", 995, 640, "blau", 26, 22, 0)
h("D", 1052, 1018, "blau", 14, 12)
h("D", 605, 700, "beige", 48, 26, 10)
h("D", 870, 645, "blau", 27, 25, 0)
h("D", 867, 762, "blau", 27, 25, 0)
h("D", 320, 690, "gruen", 68, 38, -10)
h("D", 392, 692, "gruen", 16, 13)
h("D", 350, 745, "gruen", 19, 16)
h("D", 250, 820, "gruen", 28, 22, 20)  # on the pyramid volume
h("D", 122, 880, "pink", 24, 30, 0, "jug")
h("D", 87, 945, "pink", 27, 17, -15)
h("D", 297, 1047, "gruen", 15, 12)
h("D", 185, 1097, "gruen", 17, 14)
h("D", 772, 935, "gruen", 31, 44, 10)
h("D", 765, 1062, "gruen", 17, 13)
h("D", 815, 1090, "gruen", 19, 15)
h("D", 837, 1122, "gruen", 17, 14)
h("D", 155, 1195, "gruen", 39, 29, -10)
h("D", 212, 1315, "lila", 31, 24, 10)
h("D", 592, 1325, "gruen", 49, 34, -5)
h("D", 662, 1360, "gruen", 31, 27, 10)
h("D", 857, 1352, "gruen", 27, 24, 0)
h("D4", 713, 213, "schwarz", 22, 13, 40)
h("D4", 723, 278, "schwarz", 20, 12, 30)
h("D4", 700, 347, "schwarz", 18, 11, 30)
h("D4", 658, 545, "schwarz", 20, 12, 10)
h("D4", 680, 627, "schwarz", 18, 11, 20)

# panel E (photo P4) -----------------------------------------------------
h("E", 1025, 80, "beige", 29, 17, -20, "lens")
h("E", 980, 220, "beige", 27, 17, -15, "lens")
h("E", 785, 280, "schwarz", 25, 13, 60)
h("E", 822, 370, "schwarz", 21, 12, 70)
h("E", 830, 460, "schwarz", 19, 11, 75)
h("E", 1080, 362, "beige", 25, 16, 0)
h("E", 1230, 435, "gelb", 12, 10)
h("E", 1255, 445, "gelb", 12, 10)
h("E", 1195, 487, "beige", 25, 16, 5)
h("E", 1210, 645, "gelb", 13, 11)
h("E", 1240, 655, "gelb", 13, 11)
h("E", 1272, 657, "blau", 16, 13)
h("E", 1317, 647, "blau", 20, 18)
h("E", 1125, 712, "blau", 18, 15)
h("E", 1080, 750, "blau", 18, 15)
h("E", 845, 750, "blau", 20, 13, 20)
h("E", 843, 650, "blau", 16, 13)
h("E", 1286, 890, "blau", 16, 13)
h("E", 870, 892, "blau", 14, 11)
h("E", 895, 910, "blau", 14, 11)
h("E", 922, 825, "schwarz", 23, 13, 20)
h("E", 972, 1002, "blau", 15, 12)
h("E", 1010, 1012, "blau", 15, 12)

# ---- volumes: yellow fans / lenses, dark pyramids ----------------------
# fan rot: 0 = corner NW arc SE, 90 = corner NE arc SW, 180 = SE/NW, 270 = SW/NE
V = []
def v(panel, x, y, kind, r, rot=0, r2=None, seam=False):
    V.append(dict(p=panel, x=x, y=y, k=kind, r=r, rot=rot, r2=r2 or r, seam=seam))

v("A", 186, 485, "fan", 66, 105)
v("A", 241, 588, "fan", 66, 115)
v("A", 116, 762, "fan", 92, 90)
v("B", 318, 282, "half", 82, -8, seam=True)      # big dome on B's left edge
v("B", 460, 195, "pyr", 60, 0, 100)
v("B", 600, 170, "pyr", 50, 75, 22)
v("B", 420, 245, "pyr", 52, 15, 76)
v("B", 385, 395, "pyr", 56, -10, 80)
v("B", 475, 380, "pyr", 72, 80, 50)
v("B", 458, 512, "pyr", 64, 5, 74)
v("B", 530, 560, "pyr", 58, -15, 68)
v("B", 557, 582, "dome", 26, 0)
v("C", 960, 95, "lens", 60, 15, 48, seam=True)
v("C", 805, 410, "leaf", 55, 22, 72)
v("C", 830, 730, "fan", 98, 5, seam=True)
v("C", 955, 535, "pyr", 50, 10, 54)
v("D", 295, 145, "leaf", 98, 35, 56, seam=True)
v("D", 950, 240, "fan", 150, 262)
v("D", 990, 495, "fan", 132, 4)
v("D", 985, 1010, "fan", 190, 96, seam=True)
v("D", 245, 840, "pyr", 74, 5, 68)
v("D", 40, 1130, "fan", 72, 280)
v("D", 20, 550, "fan", 56, 0)
v("E", 838, 180, "fan", 50, 270)
v("E", 830, 265, "fan", 54, 0)
v("E", 1055, 160, "fan", 92, 84)
v("E", 990, 610, "fan", 152, 10, seam=True)
v("E", 905, 680, "fan", 112, 98)
v("E", 1215, 985, "fan", 165, 86, seam=True)

# ---- mapping ------------------------------------------------------------
def bilerp(q, u, vv):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = q
    top = (x0 + (x1 - x0) * u, y0 + (y1 - y0) * u)
    bot = (x3 + (x2 - x3) * u, y3 + (y2 - y3) * u)
    return (top[0] + (bot[0] - top[0]) * vv, top[1] + (bot[1] - top[1]) * vv)

def inv_bilerp(q, x, y):
    u, vv = 0.5, 0.5
    for _ in range(40):
        px, py = bilerp(q, u, vv)
        du = 1e-4
        pxu, pyu = bilerp(q, u + du, vv)
        pxv, pyv = bilerp(q, u, vv + du)
        j = [[(pxu - px) / du, (pxv - px) / du], [(pyu - py) / du, (pyv - py) / du]]
        det = j[0][0] * j[1][1] - j[0][1] * j[1][0]
        if abs(det) < 1e-9:
            break
        ex, ey = x - px, y - py
        u += (j[1][1] * ex - j[0][1] * ey) / det
        vv += (-j[1][0] * ex + j[0][0] * ey) / det
    return max(-0.2, min(1.2, u)), max(-0.2, min(1.2, vv))

def scale_at(pq, wq, u, vv):
    du = 0.01
    px1 = bilerp(pq, u, vv); px2 = bilerp(pq, min(1, u + du), vv)
    wx1 = bilerp(wq, u, vv); wx2 = bilerp(wq, min(1, u + du), vv)
    ph = math.dist(px1, px2); wh = math.dist(wx1, wx2)
    py2 = bilerp(pq, u, min(1, vv + du)); wy2 = bilerp(wq, u, min(1, vv + du))
    pv = math.dist(px1, py2); wv = math.dist(wx1, wy2)
    return (wh / ph if ph else 1, wv / pv if pv else 1)

def wall_panel(p):
    return "D" if p == "D4" else p

out_h, out_v = [], []
for item in H:
    pq = PHOTO[item["p"]][1]; wq = WALL[wall_panel(item["p"])]
    u, vv = inv_bilerp(pq, item["x"], item["y"])
    x, y = bilerp(wq, u, vv)
    sh, sv = scale_at(pq, wq, u, vv)
    out_h.append(dict(x=round(x, 1), y=round(y, 1), c=item["c"],
                      rx=round(item["rx"] * sh, 1), ry=round(item["ry"] * sv, 1),
                      rot=item["rot"], s=item["s"], p=wall_panel(item["p"])))
for item in V:
    pq = PHOTO[item["p"]][1]; wq = WALL[wall_panel(item["p"])]
    u, vv = inv_bilerp(pq, item["x"], item["y"])
    x, y = bilerp(wq, u, vv)
    sh, sv = scale_at(pq, wq, u, vv)
    out_v.append(dict(x=round(x, 1), y=round(y, 1), k=item["k"],
                      r=round(item["r"] * sh, 1), r2=round(item["r2"] * sv, 1),
                      rot=item["rot"], seam=item["seam"], p=wall_panel(item["p"])))

panels = {k: v_ for k, v_ in WALL.items()}
data = dict(panels=panels, volumes=out_v, holds=out_h)
dst = os.path.join(os.path.dirname(__file__), "..", "assets", "wall-data.js")
with open(dst, "w") as f:
    f.write("/* generated by tools/trace.py: photo-traced wall data */\n")
    f.write("const WALL_DATA = " + json.dumps(data) + ";\n")
print("holds:", len(out_h), "volumes:", len(out_v), "->", os.path.normpath(dst))

# ---- second section: birch training wall (head-on photo, direct coords) ----
# photo: flat 4x2 plywood grid, evenly lit -> traced 1:1, no projection needed
T_PANELS = []
for row, (y0, y1) in enumerate([(8, 562), (572, 1140)]):
    for col, (x0, x1) in enumerate([(8, 292), (300, 578), (586, 872), (880, 1163)]):
        T_PANELS.append([x0, y0, x1, y1])

# (x, y, colour, r, rot) -- r is the dome radius, rot points the teardrop tail
T = []
def t(x, y, c, r, rot=0, shape="tear"):
    T.append(dict(x=x, y=y, c=c, r=r, rot=rot, s=shape))

# top row, panel 1
t(243, 42, "gelb", 21, 8); t(62, 140, "orange", 25, -12, "jug"); t(148, 235, "grau", 23, 100)
t(243, 330, "gruen", 22, 4); t(57, 420, "blau", 25, -8, "jug"); t(235, 428, "pink", 21, -80)
# top row, panel 2
t(539, 32, "pink", 23, 6); t(350, 135, "gruen", 25, -6); t(537, 232, "blau", 23, 10)
t(345, 330, "rot", 25, -95); t(539, 425, "grau", 23, 170); t(345, 520, "gelb", 21, -75, "jug")
# top row, panel 3
t(733, 35, "gelb", 23, 5, "jug"); t(729, 135, "blau", 21, 12); t(633, 228, "pink", 23, -85)
t(826, 230, "rot", 28, -70); t(641, 328, "orange", 17, -80); t(734, 425, "gruen", 23, 15, "jug")
# top row, panel 4
t(1117, 40, "pink", 21, 10); t(930, 135, "grau", 25, 60); t(1120, 240, "rot", 23, 75)
t(925, 425, "gelb", 23, 0, "jug"); t(1128, 420, "gruen", 21, 85); t(1020, 520, "blau", 21, -10)
# bottom row, panel 1
t(62, 610, "gruen", 23, -8); t(252, 610, "orange", 25, 6); t(62, 800, "orange", 23, -4, "jug")
t(245, 810, "grau", 25, 30); t(245, 1000, "rot", 23, 12); t(62, 1090, "grau", 25, 95, "blob")
# bottom row, panel 2
t(536, 615, "rot", 23, -75); t(344, 710, "pink", 23, 8); t(538, 805, "gruen", 21, -6)
t(344, 900, "gelb", 23, 4, "jug"); t(538, 1000, "gelb", 21, -85); t(345, 1090, "rot", 21, -90, "blob")
# bottom row, panel 3
t(634, 615, "blau", 27, -6, "jug"); t(830, 620, "grau", 23, 55); t(628, 805, "orange", 25, 0)
t(830, 805, "rot", 23, 90); t(633, 1000, "rot", 23, -80); t(824, 1090, "gruen", 21, 6)
# bottom row, panel 4
t(1122, 610, "orange", 23, 8); t(928, 715, "gruen", 27, -8, "jug"); t(1122, 800, "pink", 21, 80)
t(928, 900, "gelb", 23, 0, "jug"); t(1122, 1000, "gelb", 21, 6); t(923, 1090, "blau", 25, 100, "jug")

train = dict(size=[1185, 1150], panels=T_PANELS, holds=T)
with open(dst, "a") as f:
    f.write("const WALL_TRAIN = " + json.dumps(train) + ";\n")
print("train holds:", len(T))
