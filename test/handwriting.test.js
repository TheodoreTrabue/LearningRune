import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalize, prepareTemplates, recognize, shapeDistance } from '../src/recognizer.js';
import { handwritingTemplates, modelMetadata } from '../src/handwriting-templates.js';
import { splitSamples } from '../scripts/handwriting-data.js';
const references = JSON.parse(fs.readFileSync(new URL('./fixtures/reference-templates.json', import.meta.url)));
const templates = [...prepareTemplates(references), ...handwritingTemplates];
const stroke = points => points.map(([x, y]) => ({ x, y }));

test('all 28 reference forms remain recognizable with handwriting examples loaded', () => {
  for (const ref of references) assert.equal(recognize(ref.strokes, templates).letter, ref.letter, ref.letter);
});
test('split excludes held-out drawings and deduplicates repeated exports', () => {
  const a = { label: 'A', strokes: [{ points: stroke([[10, 10], [80, 70]]) }] };
  const b = { label: 'A', strokes: [{ points: stroke([[12, 14], [76, 69]]) }] };
  const { development, heldOut } = splitSamples({ version: 1, samples: [a, { ...a, createdAt: 'different' }, b] });
  assert.equal(development.length, 1); assert.equal(heldOut.length, 1);
  assert.notEqual(development[0].id, heldOut[0].id);
  assert.equal(modelMetadata.developmentCount, handwritingTemplates.length);
  assert.equal(modelMetadata.heldOutCount, 38);
  assert.ok(modelMetadata.heldOutIds.every(id => !modelMetadata.developmentIds.includes(id)));
});
test('malformed samples cannot become training data', () => {
  assert.throws(() => splitSamples({ version: 1, samples: [{ label: 'A', strokes: [{ points: [{ x: NaN, y: 10 }] }] }] }));
});
test('later rounds preserve previous test drawings and reserve two fresh examples', () => {
  const sample = n => ({ label: 'A', strokes: [{ points: stroke([[10, 10], [80, 60 + n]]) }] });
  const original = [sample(0), sample(1)];
  const first = splitSamples({ version: 1, samples: original });
  const previous = { developmentIds: first.development.map(s => s.id), heldOutIds: first.heldOut.map(s => s.id) };
  const next = splitSamples({ version: 1, samples: [...original, sample(2), sample(3), sample(4)] }, previous);
  assert.equal(next.development.length, 2);
  assert.equal(next.heldOut.length, 3);
  assert.equal(next.freshHeldOutIds.length, 2);
  assert.deepEqual(next.regressionIds, previous.heldOutIds);
  assert.ok(next.heldOut.every(s => !next.development.some(t => s.id === t.id)));
  assert.throws(() => splitSamples({ version: 1, samples: [sample(2), sample(3), sample(4)] }, previous), /missing previous/);
  assert.equal(modelMetadata.regressionIds.length, 26);
  assert.equal(modelMetadata.freshHeldOutIds.length, 12);
});
test('small natural slant preserves an upright reference triangle', () => {
  const a = references.find(r => r.letter === 'A');
  const angle = 6 * Math.PI / 180;
  const moved = a.strokes.map(s => s.map(p => ({ x: (p.x * Math.cos(angle) - p.y * Math.sin(angle)) * 2 + 140, y: (p.x * Math.sin(angle) + p.y * Math.cos(angle)) * 2 + 70 })));
  assert.equal(recognize(moved, templates).letter, 'A');
});
test('upside-down A is read as H, not accepted as A', () => {
  const a = references.find(r => r.letter === 'A');
  const upsideDown = a.strokes.map(s => s.map(p => ({ x: 100 - p.x, y: 100 - p.y })));
  assert.equal(recognize(upsideDown, templates).letter, 'H');
});
test('optimized distance agrees with identical shapes', () => {
  const shape = normalize(references[0].strokes);
  assert.equal(shapeDistance(shape, shape), 0);
});
test('short W tails count without turning plain or uneven I loops into W', () => {
  const loop = Array.from({ length: 129 }, (_, i) => {
    const angle = Math.PI / 4 + i * Math.PI / 64;
    return { x: 50 + 30 * Math.cos(angle), y: 50 + 30 * Math.sin(angle) };
  });
  const tail = stroke([[68, 68], [74, 74]]);
  assert.equal(recognize([loop, tail], templates).letter, 'W');
  assert.equal(recognize([tail.toReversed(), loop.toReversed()], templates).letter, 'W');
  assert.equal(recognize([[...loop, { x: 77, y: 77 }]], templates).letter, 'W');
  assert.equal(recognize([loop], templates).letter, 'I');
  const uneven = loop.map((p, i) => ({ x: p.x + Math.sin(i / 8), y: p.y + 1.4 * Math.sin(i / 7) }));
  assert.equal(recognize([uneven], templates).letter, 'I');
  assert.equal(recognize([loop, stroke([[72, 71], [72.4, 71.4]])], templates).letter, 'I');
});
test('E crossbars distinguish A even when their overhang is small', () => {
  const a = [stroke([[20, 25], [80, 25], [50, 78], [20, 25]])];
  const bar = stroke([[29, 44], [71, 44]]);
  assert.equal(recognize([...a, bar], templates).letter, 'E');
  assert.equal(recognize([bar.toReversed(), a[0].toReversed()], templates).letter, 'E');
  assert.equal(recognize(a, templates).letter, 'A');
  assert.equal(recognize([...a, stroke([[49, 44], [50, 44]])], templates).letter, 'A');
});
test('full production model rejects blank, dot, diagonal, cross, box, grid, star, and dense zigzag', () => {
  const negatives = {
    blank: [], dot: [stroke([[10, 10], [11, 11]])],
    diagonal: [stroke([[10, 10], [90, 90]])],
    cross: [stroke([[10, 10], [90, 90]]), stroke([[90, 10], [10, 90]])],
    box: [stroke([[10, 10], [90, 10], [90, 90], [10, 90], [10, 10]])],
    grid: [stroke([[10, 30], [90, 30]]), stroke([[10, 70], [90, 70]]), stroke([[30, 10], [30, 90]]), stroke([[70, 10], [70, 90]])],
    star: [stroke([[50, 10], [75, 90], [10, 40], [90, 40], [25, 90], [50, 10]])],
    zigzag: [stroke([[10, 10], [90, 20], [10, 30], [90, 40], [10, 50], [90, 60], [10, 70], [90, 80], [10, 90]])]
  };
  for (const [name, drawing] of Object.entries(negatives)) assert.equal(recognize(drawing, templates).letter, null, name);
});
