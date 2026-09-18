// Compare finished geometric shapes, independently of labels, color, pen
// direction, stroke order, and pointer sampling speed. No network requests.
export function normalize(strokes) {
  const points = strokes.flat();
  if (points.length < 2) return [];
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const width = Math.max(...xs) - minX, height = Math.max(...ys) - minY;
  const size = Math.max(width, height);
  if (size < 8) return [];
  const occupied = new Map();
  const add = (x, y) => {
    const p = { x: (x - minX - width / 2) / size, y: (y - minY - height / 2) / size };
    occupied.set(`${Math.round(p.x * 64)},${Math.round(p.y * 64)}`, p);
  };
  for (const stroke of strokes) {
    if (stroke.length === 1) add(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      const a = stroke[i - 1], b = stroke[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / size * 100));
      for (let s = 0; s <= steps; s++) add(a.x + (b.x - a.x) * s / steps, a.y + (b.y - a.y) * s / steps);
    }
  }
  const cloud = [...occupied.values()];
  return cloud.filter((_, i) => i % Math.max(1, Math.ceil(cloud.length / 320)) === 0);
}

function directedDistance(a, b) {
  const distances = a.map(p => {
    let best = Infinity;
    for (const q of b) {
      const dx = p.x - q.x, dy = p.y - q.y;
      best = Math.min(best, dx * dx + dy * dy);
    }
    return Math.sqrt(best);
  }).sort((x, y) => x - y);
  return distances.reduce((sum, n) => sum + n, 0) / distances.length * 0.65 + distances[Math.floor((distances.length - 1) * 0.9)] * 0.35;
}

export function shapeDistance(a, b) {
  if (!a.length || !b.length) return Infinity;
  return (directedDistance(a, b) + directedDistance(b, a)) / 2;
}

export function prepareTemplates(templates) {
  // Small upright rotations cover natural pen slant without making sideways or
  // upside-down shapes interchangeable. Handwriting examples already include
  // real variation and are loaded as clouds without this augmentation.
  return templates.flatMap(t => [-12, -6, 0, 6, 12].map(degrees => {
    const angle = degrees * Math.PI / 180;
    const strokes = t.strokes.map(stroke => stroke.map(p => ({
      x: p.x * Math.cos(angle) - p.y * Math.sin(angle),
      y: p.x * Math.sin(angle) + p.y * Math.cos(angle)
    })));
    return { letter: t.letter, cloud: normalize(strokes) };
  }));
}

export function recognize(strokes, templates) {
  const cloud = normalize(strokes);
  if (!cloud.length) return { letter: null, candidates: [], reason: 'empty' };
  const scores = new Map();
  for (const template of templates) {
    const distance = shapeDistance(cloud, template.cloud);
    scores.set(template.letter, Math.min(scores.get(template.letter) ?? Infinity, distance));
  }
  const candidates = [...scores].map(([letter, distance]) => ({ letter, distance })).sort((a, b) => a.distance - b.distance);
  const [best, second] = candidates;
  // Provisional thresholds: validate against real handwriting before expanding.
  const confident = best && best.distance < 0.085 && (!second || second.distance - best.distance > 0.012);
  return { letter: confident ? best.letter : null, candidates: candidates.slice(0, 3), reason: confident ? 'match' : 'uncertain' };
}
