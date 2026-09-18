import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, shapeDistance, prepareTemplates, recognize } from '../src/recognizer.js';
const stroke = coords => coords.map(([x, y]) => ({ x, y }));
const a = [stroke([[20, 25], [80, 25], [50, 78], [20, 25]])];
const h = [stroke([[20, 78], [50, 23], [80, 78], [20, 78]])];
const e = [stroke([[15, 50], [85, 50]])];
const o = [stroke([[50, 15], [50, 85]])];
const templates = prepareTemplates([{ letter: 'A', strokes: a }, { letter: 'H', strokes: h }, { letter: 'E', strokes: e }, { letter: 'O', strokes: o }]);
test('classifies reference shapes across the alphabet without a target label', () => {
  for (const [letter, shape] of Object.entries({ A: a, H: h, E: e, O: o })) assert.equal(recognize(shape, templates).letter, letter);
});
test('translation and uniform scale preserve identity', () => {
  const moved = a.map(s => s.map(p => ({ x: p.x * 3 + 120, y: p.y * 3 + 200 })));
  assert.equal(recognize(moved, templates).letter, 'A');
});
test('stroke direction and order do not change the completed shape', () => {
  const split = [a[0].slice(0, 2), a[0].slice(1, 3), a[0].slice(2)];
  const reversed = split.toReversed().map(s => s.toReversed());
  assert.equal(recognize(reversed, templates).letter, 'A');
  assert.ok(shapeDistance(normalize(split), normalize(reversed)) < 0.01);
});
test('orientation distinguishes horizontal and vertical lines', () => {
  assert.notEqual(recognize(e, templates).letter, recognize(o, templates).letter);
});
test('blank canvases and tiny dots are not recognized', () => {
  assert.equal(recognize([], templates).letter, null);
  assert.equal(recognize([stroke([[20, 20], [21, 21]])], templates).letter, null);
});
test('ambiguous classes are rejected', () => {
  const ambiguous = prepareTemplates([{ letter: 'A', strokes: a }, { letter: 'B', strokes: a }]);
  assert.equal(recognize(a, ambiguous).letter, null);
});
test('unrelated zigzags are rejected', () => {
  assert.equal(recognize([stroke([[10, 10], [90, 30], [10, 50], [90, 70], [10, 90]])], templates).letter, null);
});
