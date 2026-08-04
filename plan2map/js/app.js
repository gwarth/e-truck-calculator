/* plan2map – Prototyp: Foto eines Übersichtsplans per Kontrollpunkten
 * auf OpenStreetMap georeferenzieren (TPS-Warp als Raster-Overlay). */
(function () {
  'use strict';

  const COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4',
    '#0aa6a6', '#f032e6', '#7a5901', '#008080', '#9a6324', '#576b1e', '#800000'];
  const MAX_SRC_DIM = 2400;    // Plan-Foto intern maximal so groß halten
  const RENDER_DIM = 1300;     // größte Kante des gewarpten Overlays in px
  const STORAGE_KEY = 'plan2map-session-v1';

  // ---------- Web-Mercator (normalisiert auf [0,1]) ----------
  const merc = {
    fromLngLat([lng, lat]) {
      const clamped = Math.max(-85.05, Math.min(85.05, lat));
      const rad = clamped * Math.PI / 180;
      return [
        (lng + 180) / 360,
        (1 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / Math.PI) / 2,
      ];
    },
    toLngLat([x, y]) {
      const lng = x * 360 - 180;
      const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI;
      return [lng, lat];
    },
  };

  // ---------- Zustand ----------
  /** @type {{img:[number,number], lngLat:[number,number]}[]} */
  let pairs = [];
  /** @type {{img?:[number,number], lngLat?:[number,number]}|null} */
  let pending = null;
  let srcImage = null;      // HTMLImageElement (ggf. verkleinert)
  let srcData = null;       // ImageData des Plans
  let overlayBounds = null; // maplibregl.LngLatBounds des Overlays
  let mapMarkers = [];
  let pendingMarker = null;
  let renderTimer = null;
  let saveTimer = null;

  const $ = id => document.getElementById(id);
  const statusEl = $('status');

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = kind || '';
  }

  // ---------- Karte ----------
  const map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          maxzoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    },
    center: [10.699, 45.4425], // Camping Bella Italia, Peschiera del Garda
    zoom: 15.5,
    attributionControl: { compact: false },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
  map.addControl(new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
  }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

  map.on('click', e => {
    if (!srcImage) return;
    onMapPoint([e.lngLat.lng, e.lngLat.lat]);
  });

  // ---------- Plan-Viewer ----------
  const viewer = new PlanViewer($('planCanvas'), {
    onPointClick: (x, y) => onPlanPoint([x, y]),
  });

  // ---------- Punktpaar-Logik (symmetrisch: Plan oder Karte zuerst) ----------
  function onPlanPoint(imgPt) {
    if (pending && pending.lngLat) {
      addPair(imgPt, pending.lngLat);
    } else {
      pending = { img: imgPt };
      setStatus(`Punkt ${pairs.length + 1}: jetzt denselben Punkt auf der KARTE anklicken (Esc bricht ab).`);
    }
    refreshPendingUI();
  }

  function onMapPoint(lngLat) {
    if (pending && pending.img) {
      addPair(pending.img, lngLat);
    } else {
      pending = { lngLat };
      setStatus(`Punkt ${pairs.length + 1}: jetzt denselben Punkt im PLAN anklicken (Esc bricht ab).`);
    }
    refreshPendingUI();
  }

  function addPair(imgPt, lngLat) {
    pairs.push({ img: imgPt, lngLat });
    pending = null;
    refreshPairsUI();
    scheduleRender();
    scheduleSave();
    if (pairs.length < 3) {
      setStatus(`Punktpaar ${pairs.length} gesetzt – noch ${3 - pairs.length} bis zum Overlay.`);
    } else {
      setStatus(`Punktpaar ${pairs.length} gesetzt. Mehr Paare (5–8, gut verteilt) = besserer Warp.`);
    }
  }

  function deletePair(idx) {
    pairs.splice(idx, 1);
    refreshPairsUI();
    scheduleRender();
    scheduleSave();
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && pending) {
      pending = null;
      refreshPendingUI();
      setStatus('Offener Punkt verworfen.');
    }
  });

  function refreshPendingUI() {
    viewer.setPending(pending && pending.img ? pending.img : null);
    map.getCanvas().style.cursor = pending && pending.img ? 'crosshair' : '';
    if (pendingMarker) { pendingMarker.remove(); pendingMarker = null; }
    if (pending && pending.lngLat) {
      const el = document.createElement('div');
      el.className = 'map-pt pending';
      el.textContent = '?';
      pendingMarker = new maplibregl.Marker({ element: el }).setLngLat(pending.lngLat).addTo(map);
    }
  }

  // ---------- UI: Paar-Liste + Marker ----------
  function refreshPairsUI() {
    viewer.setMarkers(pairs.map((p, i) => ({
      x: p.img[0], y: p.img[1], color: COLORS[i % COLORS.length], label: String(i + 1),
    })));

    for (const m of mapMarkers) m.remove();
    mapMarkers = pairs.map((p, i) => {
      const el = document.createElement('div');
      el.className = 'map-pt';
      el.style.background = COLORS[i % COLORS.length];
      el.textContent = String(i + 1);
      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat(p.lngLat)
        .addTo(map);
      marker.on('dragend', () => {
        const ll = marker.getLngLat();
        p.lngLat = [ll.lng, ll.lat];
        refreshPairsUI();
        scheduleRender();
        scheduleSave();
      });
      return marker;
    });

    const list = $('pairsList');
    list.innerHTML = '';
    pairs.forEach((p, i) => {
      const li = document.createElement('li');
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.style.background = COLORS[i % COLORS.length];
      badge.textContent = String(i + 1);
      const coords = document.createElement('span');
      coords.className = 'coords';
      coords.textContent =
        `Plan (${Math.round(p.img[0])}, ${Math.round(p.img[1])}) ↔ ` +
        `${p.lngLat[1].toFixed(5)}, ${p.lngLat[0].toFixed(5)}`;
      const del = document.createElement('button');
      del.className = 'del';
      del.title = 'Paar löschen';
      del.textContent = '×';
      del.addEventListener('click', () => deletePair(i));
      li.append(badge, coords, del);
      list.appendChild(li);
    });

    $('step2').classList.toggle('done', pairs.length >= 3);
    $('step3').classList.toggle('done', pairs.length >= 3);
    refreshPendingUI();
  }

  // ---------- Overlay: TPS-Warp rendern ----------
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderOverlay, 250);
  }

  function removeOverlay() {
    if (map.getLayer('plan-overlay')) map.removeLayer('plan-overlay');
    if (map.getSource('plan-overlay')) map.removeSource('plan-overlay');
    overlayBounds = null;
    $('fitOverlayBtn').disabled = true;
  }

  function renderOverlay() {
    if (!srcData || pairs.length < 3) { removeOverlay(); return; }
    setStatus('Overlay wird berechnet …');
    // ins nächste Frame verschieben, damit die Statuszeile noch gezeichnet wird
    setTimeout(() => {
      try {
        doRenderOverlay();
        setStatus(`Overlay aktiv (${pairs.length} Punktpaare). Marker auf der Karte lassen sich zum Feinjustieren ziehen.`);
      } catch (err) {
        removeOverlay();
        setStatus('Overlay fehlgeschlagen: ' + err.message, 'err');
      }
    }, 30);
  }

  function doRenderOverlay() {
    const imgPts = pairs.map(p => p.img);
    const mercPts = pairs.map(p => merc.fromLngLat(p.lngLat));

    const fwd = new TPS(imgPts, mercPts);   // Plan-Pixel → Mercator
    const inv = new TPS(mercPts, imgPts);   // Mercator → Plan-Pixel

    // Bounding-Box: Bildrand vorwärts transformieren
    const W = srcData.width, H = srcData.height;
    const out = [0, 0];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const STEPS = 16;
    for (let t = 0; t <= STEPS; t++) {
      const fx = t / STEPS;
      for (const [sx, sy] of [[fx * W, 0], [fx * W, H], [0, fx * H], [W, fx * H]]) {
        fwd.transformXY(sx, sy, out);
        if (out[0] < x0) x0 = out[0];
        if (out[0] > x1) x1 = out[0];
        if (out[1] < y0) y0 = out[1];
        if (out[1] > y1) y1 = out[1];
      }
    }
    const mx = (x1 - x0) * 0.02, my = (y1 - y0) * 0.02;
    x0 -= mx; x1 += mx; y0 -= my; y1 += my;

    // Grobe Plausibilitätsprüfung: Overlay größer als ~500 km ⇒ Punkte kaputt
    if (x1 - x0 > 0.02 || y1 - y0 > 0.02 || !isFinite(x0 + x1 + y0 + y1)) {
      throw new Error('Transformation läuft weg – Punktpaare prüfen (vertauscht oder zu eng beieinander?)');
    }

    const aspect = (x1 - x0) / (y1 - y0);
    const cw = aspect >= 1 ? RENDER_DIM : Math.max(2, Math.round(RENDER_DIM * aspect));
    const ch = aspect >= 1 ? Math.max(2, Math.round(RENDER_DIM / aspect)) : RENDER_DIM;

    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const dest = ctx.createImageData(cw, ch);
    const dd = dest.data;
    const sd = srcData.data;

    for (let v = 0; v < ch; v++) {
      const mercY = y0 + ((v + 0.5) / ch) * (y1 - y0);
      for (let u = 0; u < cw; u++) {
        const mercX = x0 + ((u + 0.5) / cw) * (x1 - x0);
        inv.transformXY(mercX, mercY, out);
        const sx = out[0], sy = out[1];
        if (sx < 0 || sy < 0 || sx > W - 1 || sy > H - 1) continue;

        // bilinear abtasten
        const ix = Math.floor(sx), iy = Math.floor(sy);
        const fx = sx - ix, fy = sy - iy;
        const ix1 = Math.min(ix + 1, W - 1), iy1 = Math.min(iy + 1, H - 1);
        const p00 = (iy * W + ix) * 4, p10 = (iy * W + ix1) * 4;
        const p01 = (iy1 * W + ix) * 4, p11 = (iy1 * W + ix1) * 4;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy);
        const w01 = (1 - fx) * fy, w11 = fx * fy;
        const di = (v * cw + u) * 4;
        dd[di]     = sd[p00] * w00 + sd[p10] * w10 + sd[p01] * w01 + sd[p11] * w11;
        dd[di + 1] = sd[p00 + 1] * w00 + sd[p10 + 1] * w10 + sd[p01 + 1] * w01 + sd[p11 + 1] * w11;
        dd[di + 2] = sd[p00 + 2] * w00 + sd[p10 + 2] * w10 + sd[p01 + 2] * w01 + sd[p11 + 2] * w11;
        dd[di + 3] = 255;
      }
    }
    ctx.putImageData(dest, 0, 0);

    const url = canvas.toDataURL('image/png');
    const coordinates = [
      merc.toLngLat([x0, y0]), // oben links  (kleines y = Norden)
      merc.toLngLat([x1, y0]), // oben rechts
      merc.toLngLat([x1, y1]), // unten rechts
      merc.toLngLat([x0, y1]), // unten links
    ];

    const src = map.getSource('plan-overlay');
    if (src) {
      src.updateImage({ url, coordinates });
    } else {
      map.addSource('plan-overlay', { type: 'image', url, coordinates });
      map.addLayer({
        id: 'plan-overlay',
        type: 'raster',
        source: 'plan-overlay',
        paint: {
          'raster-opacity': Number($('opacity').value) / 100,
          'raster-fade-duration': 0,
        },
        layout: { visibility: $('overlayVisible').checked ? 'visible' : 'none' },
      });
    }

    const [w, s] = merc.toLngLat([x0, y1]);
    const [e, n] = merc.toLngLat([x1, y0]);
    overlayBounds = new maplibregl.LngLatBounds([w, s], [e, n]);
    const fitBtn = $('fitOverlayBtn');
    if (fitBtn.disabled) {
      fitBtn.disabled = false;
      map.fitBounds(overlayBounds, { padding: 40, duration: 800 });
    }
  }

  // ---------- Bild laden ----------
  function loadImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('Bitte eine Bilddatei wählen.', 'warn');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => loadImageFromDataURL(reader.result, true);
    reader.readAsDataURL(file);
  }

  function loadImageFromDataURL(dataURL, isNew) {
    const img = new Image();
    img.onload = () => {
      // ggf. verkleinern – hält TPS-Sampling und localStorage im Rahmen
      const scale = Math.min(1, MAX_SRC_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const cctx = c.getContext('2d');
      cctx.drawImage(img, 0, 0, w, h);
      srcData = cctx.getImageData(0, 0, w, h);

      const scaled = new Image();
      scaled.onload = () => {
        srcImage = scaled;
        viewer.setImage(scaled);
        $('dropzone').classList.add('hidden');
        $('step1').classList.add('done');
        if (isNew) {
          pairs = [];
          pending = null;
          refreshPairsUI();
          removeOverlay();
          setStatus('Plan geladen. Ersten markanten Punkt im Plan ODER auf der Karte anklicken.');
        }
        scheduleRender();
        scheduleSave();
      };
      scaled.src = c.toDataURL('image/jpeg', 0.9);
    };
    img.onerror = () => setStatus('Bild konnte nicht gelesen werden.', 'err');
    img.src = dataURL;
  }

  const dropzone = $('dropzone');
  dropzone.addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', e => loadImageFile(e.target.files[0]));
  for (const el of [dropzone, $('planCanvas')]) {
    el.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    el.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    el.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      loadImageFile(e.dataTransfer.files[0]);
    });
  }

  // ---------- Overlay-Bedienelemente ----------
  $('opacity').addEventListener('input', e => {
    $('opacityVal').innerHTML = e.target.value + '&nbsp;%';
    if (map.getLayer('plan-overlay')) {
      map.setPaintProperty('plan-overlay', 'raster-opacity', Number(e.target.value) / 100);
    }
  });
  $('overlayVisible').addEventListener('change', e => {
    if (map.getLayer('plan-overlay')) {
      map.setLayoutProperty('plan-overlay', 'visibility', e.target.checked ? 'visible' : 'none');
    }
  });
  $('fitOverlayBtn').addEventListener('click', () => {
    if (overlayBounds) map.fitBounds(overlayBounds, { padding: 40, duration: 800 });
  });
  $('clearBtn').addEventListener('click', () => {
    if (pairs.length && !confirm('Bild und alle Punktpaare verwerfen?')) return;
    pairs = [];
    pending = null;
    srcImage = null;
    srcData = null;
    viewer.setImage(null);
    refreshPairsUI();
    removeOverlay();
    dropzone.classList.remove('hidden');
    $('step1').classList.remove('done');
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* egal */ }
    setStatus('Zurückgesetzt. Neues Foto laden.');
  });

  // ---------- Ortssuche (Nominatim) ----------
  $('searchInput').addEventListener('keydown', async e => {
    if (e.key !== 'Enter') return;
    const q = e.target.value.trim();
    if (!q) return;
    setStatus(`Suche „${q}“ …`);
    try {
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' + encodeURIComponent(q),
        { headers: { Accept: 'application/json' } },
      );
      const hits = await res.json();
      if (!hits.length) { setStatus('Nichts gefunden.', 'warn'); return; }
      const hit = hits[0];
      if (hit.boundingbox) {
        const [s, n, w, ee] = hit.boundingbox.map(Number);
        map.fitBounds([[w, s], [ee, n]], { padding: 60, duration: 1000, maxZoom: 17 });
      } else {
        map.flyTo({ center: [Number(hit.lon), Number(hit.lat)], zoom: 16 });
      }
      setStatus(hit.display_name);
    } catch (err) {
      setStatus('Suche fehlgeschlagen: ' + err.message, 'err');
    }
  });

  // ---------- Sitzung in localStorage halten ----------
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveSession, 600);
  }

  function saveSession() {
    if (!srcImage) return;
    try {
      const c = document.createElement('canvas');
      const scale = Math.min(1, 1600 / Math.max(srcImage.width, srcImage.height));
      c.width = Math.round(srcImage.width * scale);
      c.height = Math.round(srcImage.height * scale);
      c.getContext('2d').drawImage(srcImage, 0, 0, c.width, c.height);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        imgW: srcImage.width,
        imgH: srcImage.height,
        dataURL: c.toDataURL('image/jpeg', 0.82),
        pairs,
      }));
    } catch (e) {
      // Quota voll o. Ä. – Persistenz ist nur Komfort
    }
  }

  function restoreSession() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { /* egal */ }
    if (!saved || !saved.dataURL) return false;
    const img = new Image();
    img.onload = () => {
      // Punkte beziehen sich auf die Originalgröße – auf gespeicherte Größe umrechnen
      const f = img.width / saved.imgW;
      pairs = (saved.pairs || []).map(p => ({
        img: [p.img[0] * f, p.img[1] * f],
        lngLat: p.lngLat,
      }));
      loadImageFromDataURL(saved.dataURL, false);
      // kleines Zeitfenster, bis srcData über loadImageFromDataURL gesetzt ist
      const wait = setInterval(() => {
        if (!srcData) return;
        clearInterval(wait);
        refreshPairsUI();
        if (pairs.length) {
          setStatus(`Letzte Sitzung wiederhergestellt (${pairs.length} Punktpaare).`);
          if (pairs.length >= 1) {
            map.jumpTo({ center: pairs[0].lngLat, zoom: 15.5 });
          }
        }
      }, 60);
    };
    img.src = saved.dataURL;
    return true;
  }

  // Debug-/Test-Handle (bewusst minimal, kein API-Versprechen)
  window.__plan2map = {
    map,
    getPairs: () => pairs,
    hasOverlay: () => Boolean(map.getLayer('plan-overlay')),
  };

  map.on('load', () => {
    if (!restoreSession()) {
      setStatus('Foto eines Übersichtsplans laden – als Demo bietet sich der Plan von Camping Bella Italia an (Kartenausschnitt steht schon dort).');
    }
  });
})();
