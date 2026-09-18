# Handwriting recognition: small-detail checks

## Latest result

W's lower-right tail and E's interior crossbar now provide additional evidence
when the two leading candidates are I/W or A/E. The existing 143-example model
is unchanged; no drawings from the fourth export were added to training.

| Test | Correct before | Correct after | Wrong before / after |
| --- | ---: | ---: | ---: |
| 17 fresh drawings from export four | 10 | 17 | 0 / 0 |
| 38 earlier reserved drawings | 33 | 37 | 0 / 0 |

All seven fresh W drawings and all three fresh E drawings are correct. All
seven other fresh drawings remain correct. Earlier reserved drawings show no
regressions; one T is still rejected. These remain small, single-writer samples,
not a claim of universal or perfect recognition.

## How the detail checks work

- **W versus I:** fit an ellipse to the other three quadrants of the loop, then
  look for radial spread in a narrow angular band in the lower-right quadrant.
  A tail extends across multiple radii; an uneven loop can shift radius without
  having a tail. This distinction helps avoid treating imperfect I loops as W.
  Extreme or unreliable ellipse fits provide no tail evidence.
- **E versus A:** look for horizontal coverage across the triangle's central
  interior. A bar must cover several adjacent columns, so a small dot does not
  count. Long overhangs outside the triangle are not required.
- The checks run only for plausible, already-leading I/W or A/E pairs. Strong
  evidence adds a 0.05 penalty to the inconsistent candidate; uncertain evidence
  leaves the original scores alone. The normal 0.085 distance and 0.012 margin
  gates still apply, and the requested answer never influences recognition.
- Tail thresholds are normalized relative to overall symbol size (above 0.07
  for clear evidence, below 0.025 for absence), with a neutral interval between.
  Crossbar coverage requires at least five of six columns; at most three provides
  absence evidence. These are heuristic thresholds, not definitive script rules.

Implementation and thresholds were developed using the existing 143 development
drawings plus synthetic small-detail cases. Leave-one-out development results
improved from 115 correct / 1 wrong / 27 rejected to 133 / 0 / 10. After freezing
the implementation, the 17 fresh drawings and 38 earlier reserved drawings were
evaluated. No changes were made in response to those results.

All 17 automated tests passed, including short tails, a continuously drawn tail,
reversed/reordered strokes, plain and uneven I loops, negligible loop noise,
short crossbar overhangs, a triangle with a dot, all reference forms, and the
existing non-letter checks. Browser reference and drawing-control checks passed.
Fresh evaluation contains no new I or A controls; earlier reserved examples and
synthetic tests provide those checks, so more independent writers and natural
I/A drawings are still useful future validation.

The app exports version `geometry-details-v4`. Reproduction commands are in the
[README](../README.md#reproduce-the-handwriting-benchmark), and full results are
in [detail-results.json](detail-results.json). The prior algorithm is preserved
in `test/fixtures/recognizer-v3.js`.

---

# Second improvement (historical)

## Current result

The latest model adds 35 new development examples, bringing its fixed handwriting
library from 108 to 143 examples. The geometry algorithm, reference artwork,
slant allowance, and acceptance thresholds are unchanged in this round.

| Fresh reserved drawings (12) | Previous model | Updated model |
| --- | ---: | ---: |
| Correct | 7 | 10 |
| Wrong letter | 1 | 0 |
| Not recognized | 4 | 2 |

One A, B, and I improved from rejection to correct recognition. One E previously
read as A is now rejected instead. One W remains rejected. All previously correct
fresh reserved drawings remain correct.

| Earlier reserved drawings (26), regression check | Previous model | Updated model |
| --- | ---: | ---: |
| Correct | 22 | 23 |
| Wrong letter | 0 | 0 |
| Not recognized | 4 | 3 |

B improved; A, T, and W remain rejected on this earlier set. No correct result
regressed. This earlier set is a regression check, not a fresh independent test.

## Second-round method

The third export contains 181 drawings: the original 134 plus 47 new drawings
of A, E, I, W, B, and T. Before development, two new drawings per updated letter
(the last two in export order) were reserved: 12 fresh test drawings. All 26
previously reserved drawings stayed excluded from development. The library is
therefore 108 previous examples plus 35 new ones, with 38 drawings excluded.

Development evaluation checked only those 35 new development drawings, excluding
each query from the updated library. Correct results rose from 24 to 30, wrong
letters fell from two to zero, and rejections fell from nine to five. The previous
model had never included these new drawings. The final model was frozen before
the fresh test and earlier regression comparisons; it was not tuned afterward.

The source file hash, exact split IDs, and normalized training coordinates are
stored in the generated model. The previous production model and recognizer are
frozen in `test/fixtures/handwriting-v1.js` and `recognizer-v2.js`. Raw handwriting
exports remain outside tracked project files. New app exports identify the
recognizer as `geometry-handwriting-v3`; saved historical predictions are not
rewritten. Saving or overriding a drawing still does not train the app live.

All 15 automated tests passed, including preservation of earlier test exclusions,
all reference forms, mild slant, orientation, and eight synthetic non-letter
cases. Browser checks passed for the production model and drawing controls.
Recognition averaged roughly 39 ms on the development machine; device timings
will vary.

These remain small, single-writer samples of selected difficult letters. Results
do not establish general accuracy, and all variants are not necessarily covered
in the test subset. A/E and I/W are still difficult distinctions. Try normal
practice with fresh drawings; save occasional failures without repeating the
whole alphabet. Future tuning needs a newly reserved set for a fresh test.

See the [README benchmark commands](../README.md#reproduce-the-handwriting-benchmark)
to reproduce this round using `learningrune-handwriting-3.json`. Machine-readable
results are saved in [round-2-results.json](round-2-results.json).

---

# First improvement (historical)

## Result

The updated production recognizer correctly identified 22 of 26 reserved
drawings, compared with 19 for the previous recognizer. Neither version produced
a wrong-letter prediction on this test set.

| Held-out outcome | Before | After |
| --- | ---: | ---: |
| Correct | 19 (73.1%) | 22 (84.6%) |
| Wrong letter | 0 | 0 |
| Not recognized | 7 | 4 |

C, D, L, and N changed from rejection to correct recognition. **A regressed from
correct recognition to rejection.** B, T, and W remained rejected. Every other
reserved letter stayed correct. The A regression is a known limitation of this
version, not a reason to loosen the confidence threshold globally.

## Method

- Source: `learningrune-handwriting-2.json`, 134 drawings from one writer,
  covering all 26 letters. It includes all 31 drawings from the first export.
- Split fixed before this development pass: reserve the last exported unique
  drawing of each letter (26 total); use the other 108 for development.
- Exact drawing geometry is deduplicated independently of color and timestamps.
- The bundled library includes only the 108 development drawings, with normalized
  coordinates and without ink colors or timestamps. Split hashes and the source
  export hash are included for reproducibility.
- Development evaluation excludes each query drawing from its own example
  library. Held-out evaluation uses the frozen production library.
- The final held-out comparison was run after the model and slant handling were
  fixed. No changes were made in response to the held-out results.
- Baseline: the previous geometric recognizer with all the corrected reference
  shapes, including X. The reference shapes are identical in both comparisons;
  the improvement is not due to further alphabet artwork corrections.

## What changed

1. Recognition compares against real development handwriting as well as the
   clean reference drawings. This covers proportions and stylistic variation
   absent from the original single-reference approach.
2. Reference templates include upright rotations of -12, -6, 0, 6, and 12 degrees
   to accommodate mild slant. Sideways and upside-down forms are not normalized
   into upright forms.
3. Nearest-point distances use squared distances internally, taking the square
   root only for the nearest point. This reduces computation without changing
   the distance definition.
4. Distance and ambiguity thresholds remain unchanged (0.085 and 0.012).
5. The app loads the fixed example library locally. The selected practice answer
   is still used only after independent recognition. Saving new examples or
   overriding a grade does not automatically retrain it.

Development leave-one-out results on the 108 development drawings:

| Outcome | Before | After |
| --- | ---: | ---: |
| Correct | 45 | 85 |
| Wrong letter | 6 | 1 |
| Not recognized | 57 | 22 |

These development results informed implementation and are not independent test
accuracy. Mean recognition time on the held-out run was approximately 33 ms per
drawing in Node on the development machine; browser/device timings will vary.

## Validation and limits

All 14 automated tests passed. Tests cover all 28 reference forms with the full
handwriting library, split separation, malformed data, basic drawing invariants,
limited slant, orientation, and eight synthetic negative cases: blank, dot,
diagonal, cross, box, grid, star, and dense zigzag. The full model rejected all
eight. Browser checks passed for all reference forms, drawing, undo, redo, and
clear. These checks are useful regressions, not proof that arbitrary scribbles
will always be rejected.

This dataset contains one writer, only one reserved drawing per letter, and
examples collected partly through failure overrides. Both E/O forms are not
necessarily represented in the held-out set. The results do not establish
accuracy for other writers or all variants. Similar shapes remain difficult:
particularly the bar distinguishing E from A and the tail distinguishing W
from I. One E was misclassified as A in development cross-validation.

Next, collect fresh examples emphasizing A/E, I/W, B, and T, plus a few varied
letters as controls. Keep a new untouched subset for the next evaluation if
these results guide further tuning. There is no need to repeat the whole
alphabet immediately.

Reproduction commands and model-generation instructions are in the
[README](../README.md#reproduce-the-handwriting-benchmark).
