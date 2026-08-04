# plan2map — Prototyp

**Foto eines Übersichtsplans (Campingplatz, Freizeitpark, Festival …) auf die echte OpenStreetMap-Karte legen.**

Man lädt ein Foto des Plans, setzt ein paar Punktpaare („dieser Punkt im Plan = dieser Punkt auf der Karte") und der Plan wird per **Thin-Plate-Spline** (Rubber-Sheeting) verzerrt als halbtransparentes Overlay auf die Karte gelegt — auch wenn der Plan nicht maßstabsgetreu ist. Dazu: eigene GPS-Position, Ortssuche, stufenloser Zoom.

Das ist Schritt 1 der Feasibility-Prüfung: beweist den Kernnutzen mit manuellen Ankerpunkten, bevor in die automatische Georeferenzierung (Vision-LLM, Label-Matching gegen OSM) investiert wird.

## Starten

Reine statische Web-App, kein Build-Schritt:

```bash
cd plan2map
python3 -m http.server 8000
# oder: npx serve
```

Dann <http://localhost:8000> öffnen.

> Die GPS-Ortung (Button oben rechts auf der Karte) braucht einen Secure Context — `localhost` oder HTTPS. Direkt per `file://` geöffnet funktioniert alles außer der Ortung.

## Bedienung

1. **Foto laden** — Übersichtsplan fotografieren/screenshotten und links reinziehen. Zum Testen eignet sich z. B. der [Plan von Camping Bella Italia](https://camping-bella-italia.info/wp-content/uploads/2015/09/plattegrond-camping-bella-italia.jpg); die Karte startet bereits dort (Peschiera del Garda).
2. **Punktpaare setzen** — einen markanten Punkt im Plan anklicken (Kreuzung, Poolecke, Gebäudeecke, Einfahrt), dann denselben Punkt auf der Karte. Reihenfolge ist egal (Karte zuerst geht auch), `Esc` bricht einen offenen Punkt ab.
3. **Ab 3 Paaren** erscheint das Overlay automatisch; jedes weitere Paar verbessert die Entzerrung. 5–8 gut über den Plan verteilte Paare sind der Sweet Spot. Kartenmarker lassen sich nachträglich ziehen (Feinjustierung), Paare in der Liste löschen.
4. **Deckkraft-Regler** zum Vergleichen, GPS-Button für die eigene Position auf dem gewarpten Plan.

Die Sitzung (Bild + Punkte) bleibt in `localStorage` erhalten — Reload ist unkritisch.

## Wie es funktioniert

- **Basiskarte:** [MapLibre GL JS](https://maplibre.org/) mit OSM-Rasterkacheln (Prototyp; für Produktion Vektortiles von Protomaps/OpenMapTiles).
- **Georeferenzierung:** Aus den Punktpaaren werden zwei Thin-Plate-Splines gefittet (Plan-Pixel → Web-Mercator und invers). Mit 3 Punkten degeneriert TPS zur affinen Abbildung, mit mehr Punkten biegt sie den „not to scale"-Plan lokal zurecht.
- **Rendering:** Das Overlay wird per inverser Abbildung pixelweise (bilinear) in eine achsparallele Mercator-Bounding-Box gerastert und als MapLibre-Image-Source eingehängt.
- **Suche:** Nominatim (OSM-Geocoder).

Alles Vanilla JS, keine Abhängigkeiten außer MapLibre via CDN. Kernstücke: `js/tps.js` (Spline + Löser), `js/app.js` (Warp-Rendering in `doRenderOverlay`).

## Bekannte Grenzen (bewusst, ist ein Prototyp)

- Das Overlay ist ein **gewarptes Rasterbild**, keine Vektoren — Textlabels im Plan werden beim Zoomen pixelig. Der Weg zu „Google-Maps-Qualität" ist Semantik-Extraktion (POIs, Parzellennummern) auf OSM-Geometrie, nicht schärferes Warping.
- Stark verzerrte Pläne können bei schlecht verteilten Punkten „umklappen" (TPS-Foldover) — mehr, besser verteilte Paare helfen.
- Kein Routing; das käme über das OSM-Wegenetz (Valhalla/GraphHopper), nicht über den Plan.

## Roadmap-Idee

- **V2:** Vision-LLM liest Labels/Legende aus dem Plan, matcht sie gegen OSM-Namen/-Tags → Kontrollpunkt-Vorschläge automatisch, POIs als echte Vektormarker, Suche über Plan-Inhalte.
- **V3:** Vollautomatische Georeferenzierung + Vektorisierung für Orte ohne OSM-Abdeckung; Live-Daten (Öffnungszeiten, Störungen) pro POI.
