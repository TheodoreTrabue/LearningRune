import { recognize } from './recognizer.js';

export function gradeLetter(strokes, expected, templates) {
  if (!strokes.length) return { status: 'blank', recognized: null };
  const points = strokes.map(s => s.points);
  const prediction = recognize(points, templates);
  if (prediction.letter === 'E' || prediction.letter === 'O') {
    const all = points.flat(), xs = all.map(p => p.x), ys = all.map(p => p.y);
    const width = Math.max(...xs) - Math.min(...xs), height = Math.max(...ys) - Math.min(...ys);
    if (Math.min(width, height) / Math.max(width, height) < 0.35) return { status: 'short-form', recognized: prediction.letter };
  }
  return { status: prediction.letter === expected ? 'correct' : prediction.letter ? 'incorrect' : 'uncertain', recognized: prediction.letter };
}

export function wordComplete(results) {
  return results.length > 0 && results.every(result => ['correct', 'override'].includes(result?.status));
}
