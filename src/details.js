// Shape-only evidence: operates on the finished point cloud, never stroke order.
function solve(matrix, vector) {
  const rows = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < vector.length; col++) {
    let pivot = col;
    for (let i = col + 1; i < rows.length; i++) if (Math.abs(rows[i][col]) > Math.abs(rows[pivot][col])) pivot = i;
    [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
    const scale = rows[col][col];
    if (Math.abs(scale) < 1e-9) return null;
    for (let j = col; j <= vector.length; j++) rows[col][j] /= scale;
    for (let i = 0; i < rows.length; i++) if (i !== col) {
      const factor = rows[i][col];
      for (let j = col; j <= vector.length; j++) rows[i][j] -= factor * rows[col][j];
    }
  }
  return rows.map(row => row.at(-1));
}

export function smallDetails(cloud) {
  if (cloud.length < 10) return { tail: null, bar: 0 };
  // Fit the loop from the other three quadrants, leaving the possible tail out.
  const body = cloud.filter(p => !(p.x > 0 && p.y > 0));
  const matrix = Array.from({ length: 5 }, () => Array(5).fill(0)), vector = Array(5).fill(0);
  for (const p of body) {
    const row = [p.x * p.x, p.x * p.y, p.y * p.y, p.x, p.y];
    for (let i = 0; i < 5; i++) { vector[i] += row[i]; for (let j = 0; j < 5; j++) matrix[i][j] += row[i] * row[j]; }
  }
  const fit = solve(matrix, vector);
  let tail = null;
  if (fit && fit[0] > 0 && fit[2] > 0 && 4 * fit[0] * fit[2] > fit[1] ** 2) {
    const value = p => fit[0] * p.x ** 2 + fit[1] * p.x * p.y + fit[2] * p.y ** 2 + fit[3] * p.x + fit[4] * p.y;
    const error = body.reduce((sum, p) => sum + Math.abs(value(p) - 1), 0) / body.length;
    // A tail occupies several radii at nearly the same angle. A lopsided loop
    // merely changes the radius, so residual size alone would mistake it for W.
    const determinant = 4 * fit[0] * fit[2] - fit[1] ** 2;
    const cx = (fit[1] * fit[4] - 2 * fit[2] * fit[3]) / determinant;
    const cy = (fit[1] * fit[3] - 2 * fit[0] * fit[4]) / determinant;
    const polar = cloud.map(p => ({ angle: Math.atan2(p.y - cy, p.x - cx), radius: Math.hypot(p.x - cx, p.y - cy) }));
    if (error < 0.25) tail = 0;
    if (error < 0.25) for (let angle = 0.2; angle <= 1.35; angle += 0.04) {
      const radii = polar.filter(p => Math.abs(p.angle - angle) < 0.065).map(p => p.radius).sort((a, b) => a - b);
      if (radii.length >= 4) tail = Math.max(tail, radii.at(-2) - radii[1]);
    }
  }
  // A horizontal bar crosses the central interior of a down-pointing triangle.
  // Requiring coverage across several columns ignores isolated dots and corners.
  let bar = 0;
  for (let y = -0.27; y <= 0.12; y += 0.025) {
    const bins = new Set();
    for (const p of cloud) if (Math.abs(p.y - y) < 0.04 && p.x >= -0.18 && p.x <= 0.18) bins.add(Math.min(5, Math.floor((p.x + 0.18) / 0.06)));
    bar = Math.max(bar, bins.size / 6);
  }
  return { tail, bar };
}
