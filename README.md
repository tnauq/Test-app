# EOT Prep — Practice Tests

Multiple choice practice for the Amazon Data Center Engineering Operations Technician interview. Four question banks: Electrical, Mechanical, Fire & Life Safety, and Leadership Principles.

After each test you get a score, a per-topic breakdown showing which areas are weak, and every question you missed with your answer, the correct answer, and why. Best scores and missed questions are saved in your browser so you can drill just the ones you got wrong.

## Put it on GitHub Pages

1. Create a new repository on GitHub (public).
2. Upload every file in this folder, keeping the `variants/` folder intact.
3. Repo → **Settings** → **Pages** → under "Build and deployment", set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
4. Wait a minute, then open `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

## Run it locally

Opening `index.html` straight from your file manager won't work — browsers block loading the question files that way. From a terminal in this folder:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

```
index.html          the page
styles.css          styling
app.js              test logic and scoring
variants/
  manifest.json     the list of tests shown on the home screen
  electrical.json   50 questions
  mechanical.json   41 questions
  fire.json         37 questions
  leadership.json   38 questions
```

## Adding a new variant

Create a new file in `variants/`, for example `electrical-2.json`:

```json
{
  "id": "electrical-2",
  "title": "Technical Test 1B — Electrical",
  "blurb": "Second pass, harder questions.",
  "questions": [
    {
      "topic": "Power distribution",
      "q": "What does the PDU step 480V down to?",
      "choices": ["277V", "240V", "208/120V", "120V only"],
      "answer": 2,
      "why": "The utility transformer drops MV to 480V; the PDU drops it to 208/120V for the racks."
    }
  ]
}
```

Rules:
- `id` must be unique — progress is saved against it.
- `answer` is the index of the correct choice, counting from **0**. So `2` means the third option.
- `topic` is what drives the "where you stand by topic" breakdown. Reuse the same topic string across questions so they group.
- `why` shows up on the review page. Write it as the thing you want to remember.
- Four choices per question keeps the keyboard shortcuts (A–D) working.

Then add it to `variants/manifest.json`:

```json
{
  "variants": [
    { "file": "electrical.json", "label": "Electrical" },
    { "file": "electrical-2.json", "label": "Electrical 2" }
  ]
}
```

## Options on each test

- **Length** — 10, 20, or all questions
- **Feedback** — at the end (test conditions) or after each answer (study mode)
- **Order** — shuffled or as written

Keyboard: press `A`–`D` to answer, `Enter` to advance.

## Note on the source material

Questions were written from your prep documents and answer keys. The Leadership Principles bank is weighted toward what the interview actually scores: identifying which principle a question targets, STAR structure, and the failure modes — generalized answers, "we" instead of "I", missing metrics, and disagreeing without committing.
