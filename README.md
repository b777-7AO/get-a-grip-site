# Get a Grip: Firmenwebsite

Statische Einseiten-Website für Get a Grip (3D-Scans von Boulderwänden). Getrennt vom Viewer-Repo `get-a-grip`, das das eigentliche 3D-Modell ausliefert.

## Dateien

- `index.html`: gesamte Seite
- `assets/styles.css`: Farbsystem (Routenfarben auf Basalt und Chalk), Typografie, Layout
- `assets/site.js`: Hero-Wand als SVG, Routenfilter, Parallaxe, Scroll-Reveal

## Lokal ansehen

```bash
python3 -m http.server 8791
```

Dann `http://localhost:8791`.

## Vor dem Livegang

- Impressum und Datenschutz ergänzen (Fußzeile verweist bereits darauf)
- Kontaktadresse prüfen: aktuell `juliandegen4@gmail.com`
- Eigene Domain und GitHub Pages einrichten (`.nojekyll` liegt bereits im Root)
- Optional: Screenshot der echten Halle als Social-Preview-Bild hinterlegen

## Hinweise

Der Hero ist keine 3D-Szene, sondern eine SVG-Wand mit derselben Geste wie das Produkt: Farbe wählen, alles andere tritt zurück. Das echte Modell (16 MB GLB) wird bewusst erst nach Klick geladen und liegt unter https://julianito03.github.io/get-a-grip/.
