# Demo 2 — AI lead qualifier for custom-order sweets

A Portuguese-language conversational storefront for the fictional Doce Aurora confectionery. It
answers questions from a controlled knowledge base, captures an order request, scores the lead,
and routes urgent opportunities to the business owner.

> **Status:** the live prototype has completed end-to-end runs. This repository contains only
> fictional business data and local configuration placeholders; never submit real personal data.

## What it does

1. A visitor asks a question or opens the quote form.
2. The conversational agent uses RAG to answer from the fictional Doce Aurora knowledge base.
3. A structured request is scored as hot, warm or cold.
4. Every lead is stored before notification; hot leads trigger an immediate Telegram alert and
   warm/cold leads enter a 30-minute digest.

## Architecture

```text
HTML UI → n8n conversational agent + RAG → qualification engine → Neon → Telegram / response
```

The n8n implementation is split into three workflows: the conversational agent and RAG retrieval,
the qualification and notification engine, and a manual RAG-ingestion workflow for `demo2_kb`.

## Language and safety

The portfolio documentation and workflow labels are in English; the storefront and its knowledge
base are in PT-BR because the fictional customer is a Brazilian confectionery. `config.local.js`
is deliberately ignored. Copy the example file and use only test webhook URLs. The optional image
field is a demonstration input; production upload validation and storage isolation are out of scope.

## Run locally

Copy `ui/config.example.js` to `ui/config.local.js`, replace the placeholder webhook URLs, then:

```powershell
python -m http.server 5599 --bind 127.0.0.1 --directory .\demo-2-lead-qualify-doces
```

Open `http://127.0.0.1:5599/ui/`. `config.local.js` is ignored by Git.

## Repository contents

- `ui/` — storefront, quote form and live chat.
- `assets/` — licensed reference photos, credits and workflow diagram.
- `db/schema.sql` — database structure without credentials.
- `workflows/` — sanitized n8n exports.
