import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { splitSamples } from './handwriting-data.js';
import { recognize, prepareTemplates } from '../src/recognizer.js';
import { recognize as before } from '../test/fixtures/recognizer-v3.js';
import { handwritingTemplates, modelMetadata } from '../src/handwriting-templates.js';

const [file, mode = 'fresh'] = process.argv.slice(2);
if (!file || !['fresh', 'regression', 'development'].includes(mode)) throw new Error('Usage: node scripts/benchmark-details.js export.json [fresh|regression|development]');
const raw = fs.readFileSync(file, 'utf8');
const split = splitSamples(JSON.parse(raw));
const all = [...split.development, ...split.heldOut];
const trainingIds = new Set(modelMetadata.developmentIds), heldIds = new Set(modelMetadata.heldOutIds);
const samples = all.filter(s => mode === 'development' ? trainingIds.has(s.id) : mode === 'regression' ? heldIds.has(s.id) : !trainingIds.has(s.id) && !heldIds.has(s.id));
if (!samples.length) throw new Error('No matching samples');
const refs = prepareTemplates(JSON.parse(fs.readFileSync(new URL('../test/fixtures/reference-templates.json', import.meta.url))));
const totals = { before: { correct: 0, wrong: 0, rejected: 0 }, after: { correct: 0, wrong: 0, rejected: 0 } }, rows = [];
for (const sample of samples) {
  const templates = [...refs, ...handwritingTemplates.filter((_, index) => mode !== 'development' || modelMetadata.developmentIds[index] !== sample.id)];
  const old = before(sample.strokes, templates), updated = recognize(sample.strokes, templates);
  for (const [name, result] of Object.entries({ before: old, after: updated })) totals[name][result.letter === sample.letter ? 'correct' : result.letter ? 'wrong' : 'rejected']++;
  rows.push({ id: sample.id, letter: sample.letter, before: old.letter, after: updated.letter });
}
console.log(JSON.stringify({ mode, sourceSha256: createHash('sha256').update(raw).digest('hex'), count: samples.length, totals, rows }, null, 2));
