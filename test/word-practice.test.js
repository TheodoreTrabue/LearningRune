import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { words } from '../src/words.js';
import { gradeLetter, wordComplete } from '../src/word-grader.js';
import { prepareTemplates } from '../src/recognizer.js';
import { handwritingTemplates } from '../src/handwriting-templates.js';
const refs = JSON.parse(fs.readFileSync(new URL('./fixtures/reference-templates.json', import.meta.url)));
const templates = [...prepareTemplates(refs), ...handwritingTemplates];
const strokes = (letter, variant = 0) => refs.filter(r => r.letter === letter)[variant].strokes.map(points => ({ points, color: '#000' }));
test('curated words have supported length and avoid unsupported doubled E/O', () => {
  assert.ok(words.length >= 30); assert.equal(new Set(words).size, words.length);
  for (const word of words) { assert.match(word, /^[A-Z]{2,5}$/); assert.doesNotMatch(word, /EE|OO/); }
});
test('word prompt does not bias a wrong letter into the expected one', () => {
  assert.deepEqual(gradeLetter(strokes('H'), 'A', templates), { status: 'incorrect', recognized: 'H' });
  assert.equal(gradeLetter(strokes('A'), 'A', templates).status, 'correct');
});
test('blank and short forms cannot complete words; full E/O can', () => {
  assert.equal(gradeLetter([], 'A', templates).status, 'blank');
  for (const letter of ['E', 'O']) {
    assert.equal(gradeLetter(strokes(letter), letter, templates).status, 'short-form');
    assert.equal(gradeLetter(strokes(letter, 1), letter, templates).status, 'correct');
  }
  for (const status of ['blank', 'incorrect', 'uncertain', 'short-form']) assert.equal(wordComplete([{ status: 'correct' }, { status }]), false);
  assert.equal(wordComplete([{ status: 'correct' }, { status: 'override' }]), true);
  assert.equal(wordComplete([]), false);
});
