import { DrawingPad } from './drawing-pad.js';
import { words } from './words.js';
import { alphabet, symbolSvg } from './alphabet.js';
import { gradeLetter, wordComplete } from './word-grader.js';

export function initWordPractice({ templates, ink, saveSample }) {
  const $ = id => document.getElementById(id);
  let slots = [], activeIndex = 0;
  for (const word of words) { const option = document.createElement('option'); option.value = word; option.textContent = word; $('word-choice').append(option); }
  const currentWord = () => $('word-choice').value;
  function controls() {
    const pad = slots[activeIndex]?.pad, busy = slots.some(s => s.pad.active);
    $('word-undo').disabled = busy || !pad?.strokes.length;
    $('word-redo').disabled = busy || !pad?.redoStack.length;
    $('word-clear-letter').disabled = busy || !pad?.strokes.length;
    $('word-check').disabled = busy;
    $('word-clear').disabled = busy;
    for (const slot of slots) slot.override.disabled = busy;
  }
  function activate(index) {
    activeIndex = index;
    slots.forEach((slot, i) => slot.card.classList.toggle('active-pad', i === index));
    $('word-active').textContent = `Editing letter ${index + 1} of ${slots.length}`;
    controls();
  }
  function renderSlot(slot) {
    const status = slot.result?.status;
    slot.card.classList.toggle('accepted', status === 'correct' || status === 'override');
    slot.card.classList.toggle('needs-correction', !!status && !['correct', 'override'].includes(status));
    const messages = {
      correct: 'Correct', override: 'Accepted by you', blank: 'Draw a letter here.',
      incorrect: `Incorrect — read ${slot.result?.recognized}.`, uncertain: 'Not recognized—try again.',
      'short-form': 'Use the full symbol. Short E/O lines must attach to another letter.'
    };
    slot.feedback.textContent = messages[status] || 'Ready to draw';
    slot.answer.replaceChildren();
    const correction = ['incorrect', 'uncertain', 'short-form'].includes(status);
    if (correction) {
      const expected = currentWord()[slot.index];
      const label = document.createElement('p'); label.textContent = `Reference for ${expected}:`;
      slot.answer.append(label, ...((expected === 'E' || expected === 'O') ? alphabet[expected].slice(1) : alphabet[expected]).map(symbolSvg));
    }
    slot.override.hidden = !['incorrect', 'uncertain'].includes(status);
  }
  function summary() {
    const complete = wordComplete(slots.map(s => s.result));
    $('word-result').className = complete ? 'success' : '';
    const count = slots.filter(s => ['correct', 'override'].includes(s.result?.status)).length;
    $('word-result').textContent = complete
      ? `Correct! ${currentWord()} is complete.${slots.some(s => s.result.status === 'override') ? ' Includes your override.' : ''}`
      : `${count} of ${slots.length} letters accepted. ${slots.some(s => s.result) ? 'Review the marked boxes, then check again.' : 'Press Check word when ready.'}`;
  }
  function loadWord() {
    slots.forEach(s => s.pad.destroy()); slots = []; activeIndex = 0;
    $('word-boxes').replaceChildren();
    $('word-prompt').textContent = `Write ${currentWord()} in Greenrune`;
    [...currentWord()].forEach((_, index) => {
      const card = document.createElement('div'); card.className = 'word-slot';
      const label = document.createElement('span'); label.className = 'eyebrow'; label.textContent = `Letter ${index + 1}`;
      const canvas = document.createElement('canvas'); canvas.width = 280; canvas.height = 280; canvas.setAttribute('aria-label', `Draw Greenrune letter ${index + 1} of ${currentWord()}`);
      const feedback = document.createElement('p'); feedback.className = 'slot-feedback'; feedback.setAttribute('role', 'status');
      const answer = document.createElement('div'); answer.className = 'word-answer';
      const override = document.createElement('button'); override.textContent = 'My drawing was correct'; override.hidden = true;
      const slot = { card, canvas, feedback, answer, override, index, result: null, pad: null };
      slot.pad = new DrawingPad(canvas, { ink, onActivate: () => activate(index), onUpdate: changed => {
        if (changed) { slot.result = null; renderSlot(slot); summary(); }
        controls();
      } });
      override.onclick = () => {
        if (!['incorrect', 'uncertain'].includes(slot.result?.status) || slot.pad.active) return;
        saveSample({ label: currentWord()[index], kind: 'override', recognized: slot.result.recognized,
          createdAt: new Date().toISOString(), strokes: structuredClone(slot.pad.strokes), activity: 'word', word: currentWord(), position: index });
        slot.result = { ...slot.result, status: 'override' }; renderSlot(slot); summary();
      };
      card.append(label, canvas, feedback, answer, override); $('word-boxes').append(card); slots.push(slot); renderSlot(slot);
    });
    activate(0); summary();
  }
  $('word-choice').onchange = loadWord;
  $('word-next').onclick = () => { $('word-choice').value = words[(words.indexOf(currentWord()) + 1) % words.length]; loadWord(); };
  $('word-random').onclick = () => { const choices = words.filter(w => w !== currentWord()); $('word-choice').value = choices[Math.floor(Math.random() * choices.length)]; loadWord(); };
  $('word-undo').onclick = () => slots[activeIndex].pad.undo();
  $('word-redo').onclick = () => slots[activeIndex].pad.redo();
  $('word-clear-letter').onclick = () => slots[activeIndex].pad.clear();
  $('word-clear').onclick = () => slots.forEach(s => s.pad.clear());
  $('word-check').onclick = () => {
    if (slots.some(s => s.pad.active)) return;
    for (const slot of slots) {
      if (slot.result?.status !== 'override') slot.result = gradeLetter(slot.pad.strokes, currentWord()[slot.index], templates);
      renderSlot(slot);
    }
    summary(); controls();
  };
  loadWord();
}
