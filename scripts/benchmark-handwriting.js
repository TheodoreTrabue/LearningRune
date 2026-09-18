import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { splitSamples } from './handwriting-data.js';
// Frozen round-two algorithm keeps the historical benchmark reproducible.
import { recognize, prepareTemplates } from '../test/fixtures/recognizer-v3.js';
import { recognize as baselineRecognize, prepareTemplates as baselinePrepare } from '../test/fixtures/recognizer-v2.js';
import { handwritingTemplates as oldHandwriting, modelMetadata as previous } from '../test/fixtures/handwriting-v1.js';
import { handwritingTemplates, modelMetadata } from '../src/handwriting-templates.js';

const [source, mode = 'held-out'] = process.argv.slice(2);
if (!source || !['held-out', 'development', 'regression'].includes(mode)) throw new Error('Usage: node scripts/benchmark-handwriting.js export.json [held-out|development|regression]');
const raw = fs.readFileSync(source, 'utf8');
if (createHash('sha256').update(raw).digest('hex') !== modelMetadata.sourceSha256) throw new Error('This model was built from a different export. Use the original export to reproduce the split.');
const { development, heldOut, freshHeldOutIds, regressionIds } = splitSamples(JSON.parse(raw), previous);
const overlap = heldOut.some(s => modelMetadata.developmentIds.includes(s.id));
if (overlap) throw new Error('Held-out drawing leaked into development templates');
const references = JSON.parse(fs.readFileSync(new URL('../test/fixtures/reference-templates.json', import.meta.url)));
const baseline = baselinePrepare(references), refs = prepareTemplates(references);
const examples = mode === 'development' ? development.filter(s => !previous.developmentIds.includes(s.id)) : heldOut.filter(s => (mode === 'regression' ? regressionIds : freshHeldOutIds).includes(s.id));
const totals = { before: { correct: 0, wrong: 0, rejected: 0 }, after: { correct: 0, wrong: 0, rejected: 0 } };
const rows = [];
let elapsed = 0;
for (const sample of examples) {
  const before = baselineRecognize(sample.strokes, [...baseline, ...oldHandwriting]);
  const templates = mode === 'development'
    ? handwritingTemplates.filter((_, index) => modelMetadata.developmentIds[index] !== sample.id)
    : handwritingTemplates;
  const start = performance.now();
  const after = recognize(sample.strokes, [...refs, ...templates]);
  elapsed += performance.now() - start;
  for (const [name, result] of Object.entries({ before, after })) totals[name][result.letter === sample.letter ? 'correct' : result.letter ? 'wrong' : 'rejected']++;
  rows.push({ letter: sample.letter, before: before.letter, after: after.letter });
}
console.log(JSON.stringify({ mode, count: examples.length, totals, meanRecognitionMs: Math.round(elapsed / examples.length * 10) / 10, rows }, null, 2));
