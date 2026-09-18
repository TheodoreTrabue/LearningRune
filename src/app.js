import { DrawingPad } from './drawing-pad.js';
import { initWordPractice } from './word-practice.js';
import { alphabet, symbolSvg, makeTemplates } from './alphabet.js';
import { prepareTemplates, recognize } from './recognizer.js';
import { handwritingTemplates } from './handwriting-templates.js';

const $ = id => document.getElementById(id);

const templates = [...prepareTemplates(makeTemplates()), ...handwritingTemplates];
const letters = Object.keys(alphabet);
const storageKey = 'learningrune.samples.v1';
let ink = '#292b29';
let samples = [], revision = 0, checkedRevision = -1, prediction = null, savedRevision = -1;
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (!Array.isArray(stored)) throw new Error('Invalid notebook');
  samples = stored.filter(s => letters.includes(s.label) && Array.isArray(s.strokes) && s.strokes.every(stroke => Array.isArray(stroke.points) && stroke.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))));
} catch { $('storage-status').textContent = 'Saved samples could not be loaded. New samples can still be exported.'; }

for (const letter of letters) {
  const option = document.createElement('option'); option.textContent = letter; $('letter').append(option);
  const card = document.createElement('div'); card.className = 'letter-card';
  const title = document.createElement('strong'); title.textContent = letter; card.append(title);
  const forms = document.createElement('div'); forms.className = 'symbols';
  alphabet[letter].forEach(paths => forms.append(symbolSvg(paths))); card.append(forms); $('alphabet-grid').append(card);
}
for (const [name, color] of Object.entries({ Black: '#292b29', Red: '#ad3a36', Green: '#326847', Blue: '#345da3', Purple: '#7a458e' })) {
  const label = document.createElement('label'); label.title = name;
  const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'ink'; radio.setAttribute('aria-label', name); radio.checked = name === 'Black';
  radio.addEventListener('change', () => { ink = color; });
  const swatch = document.createElement('span'); swatch.className = 'swatch'; swatch.style.background = color;
  label.append(radio, swatch); $('colors').append(label);
}

const pad = new DrawingPad($('drawing'), { ink: () => ink, onUpdate: changed => { if (changed) invalidate(); redraw(); } });
function redraw() {
  $('undo').disabled = !pad.strokes.length || !!pad.active; $('redo').disabled = !pad.redoStack.length || !!pad.active;
  $('check').disabled = !pad.strokes.length || !!pad.active; $('save').disabled = !pad.strokes.length || !!pad.active || savedRevision === revision;
}
function invalidate() {
  revision++; checkedRevision = -1; prediction = null; $('correction').hidden = true;
  $('result').className = ''; $('result').textContent = 'Ready when you are.';
}
function clear() { pad.clear(); }
$('clear').onclick = clear;
$('undo').onclick = () => pad.undo();
$('redo').onclick = () => pad.redo();
function updatePrompt() {
  clear(); const collecting = $('mode').value === 'collect';
  $('prompt').textContent = `Draw the Greenrune equivalent of ${$('letter').value}`;
  $('activity-help').textContent = collecting ? 'Draw a valid example of this letter. Check its prediction, then save your labeled sample.' : 'Use either accepted form for E or O. Press Check when you are finished.';
  $('save').hidden = !collecting;
}
$('letter').onchange = updatePrompt; $('mode').onchange = updatePrompt;
$('random').onclick = () => { const choices = letters.filter(l => l !== $('letter').value); $('letter').value = choices[Math.floor(Math.random() * choices.length)]; updatePrompt(); };
$('next').onclick = () => { $('letter').value = letters[(letters.indexOf($('letter').value) + 1) % letters.length]; updatePrompt(); };
$('check').onclick = () => {
  prediction = recognize(pad.strokes.map(s => s.points), templates); checkedRevision = revision;
  const correct = prediction.letter === $('letter').value;
  $('result').className = correct ? 'success' : 'failure';
  $('result').textContent = correct ? `Correct! Recognized as ${prediction.letter}.` : prediction.letter ? `Incorrect. Recognized as ${prediction.letter}.` : 'Not recognized—try again.';
  $('answer').replaceChildren(...alphabet[$('letter').value].map(symbolSvg));
  $('correction').hidden = correct; $('override').disabled = savedRevision === revision;
};
function updateCount() {
  const represented = new Set(samples.map(s => s.label)).size;
  $('sample-count').textContent = `${samples.length} saved samples · ${represented} of 26 letters represented`;
}
function saveSample(kind) {
  if (!pad.strokes.length || pad.active || savedRevision === revision) return;
  const result = checkedRevision === revision ? prediction : recognize(pad.strokes.map(s => s.points), templates);
  samples.push({ label: $('letter').value, kind, recognized: result.letter, createdAt: new Date().toISOString(), strokes: structuredClone(pad.strokes) });
  savedRevision = revision;
  persistSamples(); redraw(); $('override').disabled = true;
}
function persistSamples() {
  try { localStorage.setItem(storageKey, JSON.stringify(samples)); $('storage-status').textContent = 'Sample saved in this browser.'; }
  catch { $('storage-status').textContent = 'Browser storage is unavailable or full. Export now to keep samples from this session.'; }
  $('evaluation').replaceChildren(); updateCount();
}
$('save').onclick = () => saveSample('labeled');
$('override').onclick = () => { if (checkedRevision !== revision) return; saveSample('override'); $('result').className = 'success'; $('result').textContent = 'Marked correct by you. Drawing saved for review; the recognizer has not been retrained.'; };
$('export').onclick = () => {
  const blob = new Blob([JSON.stringify({ version: 1, recognizer: 'geometry-details-v4', samples }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'learningrune-handwriting.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('evaluate').onclick = async () => {
  const button = $('evaluate'); button.disabled = true;
  $('evaluation').textContent = 'Evaluating saved samples…';
  await new Promise(resolve => setTimeout(resolve, 20));
  let correct = 0; const failures = [];
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i], result = recognize(sample.strokes.map(s => s.points), templates);
    if (result.letter === sample.label) correct++; else failures.push(`Sample ${i + 1}: expected ${sample.label}, ${result.letter ? `read ${result.letter}` : 'not recognized'}.`);
    if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }
  $('evaluation').replaceChildren();
  const summary = document.createElement('p'); summary.textContent = samples.length ? `${correct}/${samples.length} matched their labels (${Math.round(correct / samples.length * 100)}%). Some earlier samples helped build this recognizer, so this is a review of your collection, not an independent accuracy estimate.` : 'Save some handwriting samples first.';
  $('evaluation').append(summary);
  for (const failure of failures) { const row = document.createElement('p'); row.textContent = failure; $('evaluation').append(row); }
  button.disabled = false;
};
updateCount(); updatePrompt();

initWordPractice({ templates, ink: () => ink, saveSample: sample => { samples.push(sample); persistSamples(); } });
$('practice-mode').onchange = () => {
  const wordMode = $('practice-mode').value === 'word';
  $('letter-practice').hidden = wordMode;
  $('word-practice').hidden = !wordMode;
  $('practice-title').textContent = wordMode ? 'Word practice' : 'Letter workbench';
};
