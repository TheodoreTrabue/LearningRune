# LearningRune

A calm browser workbench for practicing English letters written in Greenrune.
This prototype recognizes **one Greenrune letter at a time**, using reference
shapes and a fixed library of development handwriting examples. Detail checks
for W's tail and E's crossbar improved the latest fresh batch from 10/17 to
17/17 correct, with no wrong-letter predictions. This is a small,
single-writer test, not a general accuracy estimate. See the
[recognition report](docs/recognition-report.md) for the remaining limitations.

## Run locally

With Node.js 20 or newer installed, open a terminal in this folder:

```sh
npm start
```

Open **http://localhost:5173** in your browser. Keep the terminal running;
press Ctrl+C to stop it. No dependency installation or build is required.
Use the local server rather than double-clicking `index.html`, because the app
uses JavaScript modules.

## First handwriting test

1. Review the reference alphabet at the bottom of the page against the source
   chart. Tell us which drawings need correction before relying on grading.
2. Leave the activity on **Practice**, choose **A**, and draw its Greenrune form.
3. Press **Check**. The app shows its independent prediction. Try undo, redo,
   clear, and different ink colors; color should not affect recognition.
4. Try **E** and **O**, including both accepted forms. Then test curved letters
   such as **C**, **G**, and **U**. Size and position may vary; preserve orientation.
5. A rejected drawing displays the expected reference forms. If yours was valid,
   choose **My drawing was correct — save for review**.
6. Switch to **Collect handwriting samples**. Select a letter, draw it naturally,
   check its prediction, and choose **Save labeled sample**. The selected letter
   is the label you are assigning, so save only valid examples of that letter.
7. Clear and repeat for 3–5 examples per letter. Include natural variation and
   both E/O forms, rather than tracing every sample identically.
8. Choose **Evaluate saved samples** to see which examples fail, then **Export
   samples as JSON** to make a backup or manually share it for improvements.

Samples and overrides are stored in this browser on this site. Local development
and the published site have separate storage. Nothing is uploaded, and saved
samples do not automatically train or change the recognizer. If storage is
blocked or full, keep the page open and export your session before closing it.
Browser data can be cleared through your browser's site-data settings.

## What recognition does

The app samples each finished shape, normalizes its size and position, and
compares geometric coverage against every reference letter and 143 fixed
development handwriting examples. Small reference rotations (up to 12 degrees)
allow natural slant. It preserves aspect ratio and upright orientation and
ignores color, stroke order, and stroke direction.
An uncertain or distant match returns “Not recognized—try again.” The expected
letter is used only after recognition to grade the answer.

When the leading candidates are I/W or A/E, an additional shape check examines
the loop's lower-right tail or the triangle's interior crossbar. This gives small
but meaningful details more influence without lowering the global acceptance
threshold. The checks use finished geometry, not stroke order or stroke count.

This is an experimental example-based geometric recognizer. Its bundled
handwriting library was built offline from the development portion of the
user-provided sample exports, excluding all 26 original reserved drawings and
12 fresh reserved drawings from the second round. Only
normalized geometry is bundled, without drawing timestamps or ink colors.
New samples and overrides never update that library automatically.

Saved sample evaluation measures your collection only. Some existing samples
helped build the model, so reevaluating the whole collection is not an independent
accuracy test. Fresh drawings and additional writers are needed to validate
improvements. A/E and I/W remain especially difficult distinctions.

Both E and O forms are accepted alone **only for isolated-symbol testing** in
this workbench. In actual writing, short E/O forms must attach to other letters;
they are not standalone symbols. Future word practice must enforce attachment
and the short-form/full-form sequence for doubled E/O. Word and sentence
practice, nesting, stacking, and reverse practice with uppercase/lowercase
English drawings are not implemented in this milestone.

## Project structure

- `index.html` and `style.css`: notebook layout and controls.
- `src/alphabet.js`: original vector reference forms and template sampling.
- `src/recognizer.js`: standalone geometry matching and rejection thresholds.
- `src/details.js`: local tail and crossbar evidence for ambiguous I/W and A/E.
- `src/handwriting-templates.js`: generated development examples and split metadata.
- `src/app.js`: drawing input, feedback, sample collection, and browser storage.
- `server.js`: development-only static server; GitHub Pages serves the files itself.
- `test/recognizer.test.js` and `test/handwriting.test.js`: geometry, split, and
  rejection checks (`npm test`).
- `test/browser.html`: browser integration checks; open it through the local server.
- `scripts/`: reproducible model generation and benchmark tools.
- `test/fixtures/`: frozen pre-improvement recognizer and reference geometry for
  comparisons. Browser checks also use the live SVG references.

## Reproduce the handwriting benchmark

For the current detail-aware recognizer, use the fourth export:

```sh
node scripts/benchmark-details.js "path/to/learningrune-handwriting-4.json" fresh
node scripts/benchmark-details.js "path/to/learningrune-handwriting-4.json" regression
node scripts/benchmark-details.js "path/to/learningrune-handwriting-4.json" development
```

These compare the frozen pre-detail recognizer with the current one, using the
same 143 handwriting templates. Fresh evaluates the 17 previously unused
drawings; regression evaluates the earlier 38 reserved drawings; development
excludes each query from its own template library. No fourth-export drawings
were added to the model. Machine-readable results are in
`docs/detail-results.json`.

The following commands reproduce the **historical second round**, using its
frozen recognizers:

Keep the original `learningrune-handwriting-3.json` export locally; raw exports
are not bundled in the repository. Use its full path in these commands:

```sh
node scripts/benchmark-handwriting.js "path/to/learningrune-handwriting-3.json" held-out
node scripts/benchmark-handwriting.js "path/to/learningrune-handwriting-3.json" regression
node scripts/benchmark-handwriting.js "path/to/learningrune-handwriting-3.json" development
```

The held-out command compares the previous and current models on the 12 new
reserved drawings; regression compares them on the original 26 reserved
drawings. Development checks the 35 new development drawings, excluding each
query from the updated example library. Every command verifies the export's
hash and uses the same deterministic split. The 181-sample export already
contains the previous 134 samples; do not combine exports without deduplication.

To regenerate the **same** model from that export:

```sh
node scripts/build-handwriting-model.js "path/to/learningrune-handwriting-3.json"
```

This round's builder uses the frozen first-round model metadata to preserve
the original test split and reserves two fresh drawings per updated letter.
It rewrites the bundled model. After any model changes, run `npm test` and the
browser checks. Once a held-out set has been used to guide further development,
reserve fresh drawings for the next independent check.

No reference photographs or third-party artwork are included.

## Publish on GitHub Pages

When the prototype is ready to publish:

1. Commit these project files and push them to your GitHub repository.
2. In that repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the branch containing these files (usually `main`) and **/(root)**,
   then click **Save**.
5. Wait for the Pages deployment to finish. The Pages settings will show your
   published URL; open it and check drawing, grading, and sample saving.

The project uses relative asset paths so it can run under a repository URL.
The `.nojekyll` file marks it as a plain static site. No API keys or backend
services are needed. Publishing has not been performed automatically.

See GitHub's [publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
and [site-creation guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).
