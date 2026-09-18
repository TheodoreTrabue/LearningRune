import { createHash } from 'node:crypto';

export function splitSamples(document, previous = null) {
  if (document.version !== 1 || !Array.isArray(document.samples)) throw new Error('Expected version 1 handwriting export');
  const seen = new Set(), groups = new Map();
  for (const sample of document.samples) {
    if (!/^[A-Z]$/.test(sample.label) || !Array.isArray(sample.strokes) || !sample.strokes.length || !sample.strokes.every(s => Array.isArray(s.points) && s.points.length && s.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)))) throw new Error('Invalid handwriting sample');
    const strokes = sample.strokes.map(s => s.points.map(({ x, y }) => ({ x, y })));
    const shapeId = createHash('sha256').update(JSON.stringify(strokes)).digest('hex');
    // Deduplicate drawing geometry, ignoring color, timestamps, and labels.
    if (seen.has(shapeId)) continue;
    seen.add(shapeId);
    if (!groups.has(sample.label)) groups.set(sample.label, []);
    groups.get(sample.label).push({ letter: sample.label, strokes, id: shapeId });
  }
  if (previous) {
    const priorIds = new Set([...previous.developmentIds, ...previous.heldOutIds]);
    if ([...priorIds].some(id => !seen.has(id))) throw new Error('Cumulative export is missing previous drawings');
    const heldIds = new Set(previous.heldOutIds), freshHeldOutIds = [];
    for (const group of groups.values()) {
      const fresh = group.filter(s => !priorIds.has(s.id));
      if (!fresh.length) continue;
      if (fresh.length < 3) throw new Error('Need three new drawings per updated letter to reserve two');
      for (const sample of fresh.slice(-2)) { heldIds.add(sample.id); freshHeldOutIds.push(sample.id); }
    }
    const all = [...groups].sort().flatMap(([, group]) => group);
    return { development: all.filter(s => !heldIds.has(s.id)), heldOut: all.filter(s => heldIds.has(s.id)), regressionIds: [...previous.heldOutIds], freshHeldOutIds };
  }
  const development = [], heldOut = [];
  for (const [letter, group] of [...groups].sort()) {
    if (group.length < 2) throw new Error(`Need at least two distinct samples for ${letter}`);
    // Deterministic: reserve the last exported drawing of each letter BEFORE tuning.
    heldOut.push(group.at(-1)); development.push(...group.slice(0, -1));
  }
  return { development, heldOut };
}
