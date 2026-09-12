# Demo 2 — AI lead qualifier for custom-order sweets

A conversational storefront that answers questions from a controlled knowledge base, captures an
order request, scores the lead and routes urgent opportunities to the business owner.

> **Status:** working end-to-end prototype under refinement. Chat pacing, Telegram formatting,
> image-upload security and the final n8n Library layout are still open.

## What it does

1. A visitor asks a question or opens the quote form.
2. The conversational agent uses RAG to answer from the fictional business knowledge base.
3. A structured request is scored as hot, warm or cold.
4. Every lead is stored; hot leads trigger an immediate alert and the others enter a digest.

## Architecture

```text
HTML UI → n8n conversational agent + RAG → qualification engine → Neon → Telegram / response
```

## Run locally

Copy `ui/config.example.js` to `ui/config.local.js`, replace the placeholder webhook URLs, then:

```powershell
python -m http.server 5599 --bind 127.0.0.1 --directory .\demo-2-lead-qualify-doces
```

Open `http://127.0.0.1:5599/ui/`. `config.local.js` is ignored by Git.

## Repository contents

- `ui/` — storefront, quote form and live chat.
- `assets/` — licensed reference photos, credits and diagrams.
- `knowledge/` — fictional business data used by RAG.
- `db/schema.sql` — database structure without credentials.
- `tests/` — offline transformation tests.
- `workflow.json` — sanitized exports, pending final workflow refinement.
