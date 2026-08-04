/**
 * Thin-Plate-Spline-Transformation in 2D (Rubber-Sheeting).
 *
 * Interpoliert eine glatte Abbildung f: R² → R², die alle Kontrollpunkt-
 * paare exakt trifft. Mit genau 3 Punkten degeneriert sie zur affinen
 * Abbildung, mit mehr Punkten biegt sie die Fläche minimal-energetisch.
 *
 * Quellpunkte werden intern normalisiert (Zentroid + mittlerer Abstand),
 * damit der r²·ln(r²)-Kern unabhängig von der Einheit (Pixel vs.
 * Mercator-Bruchteile) numerisch stabil bleibt.
 */
class TPS {
  /**
   * @param {number[][]} src Quellpunkte [[x,y],...]
   * @param {number[][]} dst Zielpunkte, gleiche Länge
   * @param {number} lambda Regularisierung (0 = exakte Interpolation)
   */
  constructor(src, dst, lambda = 0) {
    const n = src.length;
    if (n < 3 || dst.length !== n) {
      throw new Error('TPS braucht mindestens 3 Punktpaare');
    }
    this.n = n;

    let cx = 0, cy = 0;
    for (const [x, y] of src) { cx += x; cy += y; }
    cx /= n; cy /= n;
    let meanDist = 0;
    for (const [x, y] of src) meanDist += Math.hypot(x - cx, y - cy);
    meanDist /= n;
    const scale = meanDist > 0 ? Math.SQRT2 / meanDist : 1;
    this.cx = cx; this.cy = cy; this.scale = scale;

    const px = new Float64Array(n);
    const py = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      px[i] = (src[i][0] - cx) * scale;
      py[i] = (src[i][1] - cy) * scale;
    }
    this.px = px; this.py = py;

    // Gleichungssystem [[K P],[Pᵀ 0]] · w = [dst; 0] für x und y zugleich
    const m = n + 3;
    const A = [];
    for (let i = 0; i < m; i++) A.push(new Float64Array(m));
    const bx = new Float64Array(m);
    const by = new Float64Array(m);

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const dx = px[i] - px[j], dy = py[i] - py[j];
        const r2 = dx * dx + dy * dy;
        const u = r2 > 0 ? r2 * Math.log(r2) : 0;
        A[i][j] = u; A[j][i] = u;
      }
      A[i][i] += lambda;
      A[i][n] = 1;      A[n][i] = 1;
      A[i][n + 1] = px[i]; A[n + 1][i] = px[i];
      A[i][n + 2] = py[i]; A[n + 2][i] = py[i];
      bx[i] = dst[i][0];
      by[i] = dst[i][1];
    }

    const sol = TPS._solve(A, [bx, by]);
    this.wx = sol[0];
    this.wy = sol[1];
  }

  /** Punkt transformieren; schreibt in `out` [x', y'] (allokationsfrei für Render-Loops). */
  transformXY(x, y, out) {
    const { n, px, py, wx, wy } = this;
    const qx = (x - this.cx) * this.scale;
    const qy = (y - this.cy) * this.scale;
    let fx = wx[n] + wx[n + 1] * qx + wx[n + 2] * qy;
    let fy = wy[n] + wy[n + 1] * qx + wy[n + 2] * qy;
    for (let i = 0; i < n; i++) {
      const dx = qx - px[i], dy = qy - py[i];
      const r2 = dx * dx + dy * dy;
      if (r2 > 0) {
        const u = r2 * Math.log(r2);
        fx += wx[i] * u;
        fy += wy[i] * u;
      }
    }
    out[0] = fx; out[1] = fy;
    return out;
  }

  transform(p) {
    return this.transformXY(p[0], p[1], [0, 0]);
  }

  /** Gauß-Elimination mit Spaltenpivotisierung, mehrere rechte Seiten. */
  static _solve(A, rhs) {
    const m = A.length;
    const B = rhs.map(v => Float64Array.from(v));
    for (let col = 0; col < m; col++) {
      let piv = col;
      for (let r = col + 1; r < m; r++) {
        if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
      }
      if (Math.abs(A[piv][col]) < 1e-12) {
        throw new Error('Punktkonfiguration ist entartet (liegen alle Punkte auf einer Linie?)');
      }
      if (piv !== col) {
        [A[piv], A[col]] = [A[col], A[piv]];
        for (const b of B) { const t = b[piv]; b[piv] = b[col]; b[col] = t; }
      }
      const d = A[col][col];
      for (let r = col + 1; r < m; r++) {
        const f = A[r][col] / d;
        if (f === 0) continue;
        for (let c = col; c < m; c++) A[r][c] -= f * A[col][c];
        for (const b of B) b[r] -= f * b[col];
      }
    }
    for (const b of B) {
      for (let r = m - 1; r >= 0; r--) {
        let s = b[r];
        for (let c = r + 1; c < m; c++) s -= A[r][c] * b[c];
        b[r] = s / A[r][r];
      }
    }
    return B;
  }
}
