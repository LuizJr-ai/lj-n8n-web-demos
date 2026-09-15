# 🧁 Demo 2 — AI Lead Qualifier for Custom-Order Sweets

> A Portuguese-language conversational storefront for the fictional **Doce Aurora** confectionery: it answers questions from a controlled knowledge base, captures a quote request, scores the lead, and routes the hot ones to the owner instantly.

> **Status:** the live prototype has completed end-to-end runs. This repository ships only fictional business data and local configuration placeholders — never submit real personal data.

## 🧩 What it does

1. A visitor **chats** with the assistant or opens the **quote form**.
2. The conversational agent uses **RAG** to answer from the Doce Aurora knowledge base (`demo2_kb`).
3. A structured quote request is **scored** and classified as `hot` / `warm` / `cold`.
4. **Every lead is stored first**; hot leads trigger an immediate **Telegram** alert to the owner, while warm/cold leads enter a 30-minute digest.

The form auto-fills the address from the Brazilian postal code (ViaCEP) and accepts an optional reference image.

## 🗺️ Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| Front | Single-file HTML/CSS/JS (`ui/index.html`) | Storefront, live chat and quote form |
| Backend | n8n (3 workflows) | Conversation, RAG retrieval, qualification + routing |
| AI | Chat model + RAG over `demo2_kb` | Grounded answers and lead scoring |
| Persistence | Neon (Postgres) — `leads_doces` | Records every lead before notifying |
| Notification | Telegram | Instant alert on hot leads |

```text
HTML UI ─┬─ /webhook/demo2-chat        → conversational agent + RAG → grounded reply
         └─ /webhook/demo2-lead-doces  → qualification engine → Neon → Telegram / response
```

The n8n side is split into three workflows: **conversational agent + RAG**, **qualification + notification**, and a **manual RAG-ingestion** flow that (re)indexes `demo2_kb`.

## ⚙️ How to run

```powershell
Copy-Item .\demo-2-lead-qualify-doces\ui\config.example.js .\demo-2-lead-qualify-doces\ui\config.local.js
# edit config.local.js with your two test webhook URLs
python -m http.server 5599 --bind 127.0.0.1 --directory .\demo-2-lead-qualify-doces
```

Open `http://127.0.0.1:5599/ui/`. `config.local.js` is ignored by Git; the repo ships `config.example.js` with placeholders.

## 🔌 Webhook contract

**Quote / lead** (`WEBHOOK_URL` → `/webhook/demo2-lead-doces`)
`POST` · `application/json`
```jsonc
// request: form fields (name, contact, event, address via ViaCEP) + optional base64 image
// response:
{ "status": "ok", "id": 123, "tier": "hot|warm|cold", "score": 0, "message": "…" }
```

**Chat** (`CHAT_URL` → `/webhook/demo2-chat`)
`POST` · `application/json`
```jsonc
// request:
{ "sessionId": "<stable per visitor>", "message": "…" }
// response: assistant reply, rendered in streamed blocks
```

**Errors:** if a webhook is not configured, the UI shows an explicit "configure the webhook to test this demo" state — never a blank screen.

## 🌐 Language & safety

Portfolio docs and workflow labels are in English; the storefront and knowledge base are in **PT-BR** because the fictional customer is a Brazilian confectionery. All business data is fictional. The optional image field is a demonstration input; production upload validation and storage isolation are out of scope.

## ✅ Proof

- Offline QA over the qualification logic, plus clean end-to-end runs before publishing.
- No secrets, personal hosts or credential IDs committed; workflow exports are sanitized.

## 📦 Files

- `ui/` — single-file storefront, quote form and live chat.
- `workflows/` — sanitized n8n exports: `chat-rag.json`, `lead-qualification.json`, `rag-ingestion.json`.
- `db/schema.sql` — `leads_doces` structure, no credentials.
- `assets/` — reference photos used by the storefront (`fotos-ref/`, with `CREDITOS.md`) and the workflow diagram.

## 🏷️ Tags

`#n8n` `#rag` `#ai-agent` `#lead-scoring` `#conversational-ui` `#neon` `#telegram` `#automation`
