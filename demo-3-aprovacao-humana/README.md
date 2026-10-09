<!-- readme-type: demo -->
# 🛡️ Demo 3 — Human Approval in the Loop

> A customer writes in, an AI drafts the reply, and the workflow freezes until a person approves it — nothing reaches the customer without a human click.

> ⚠️ Demo data only, not hardened for production: use fictional names and addresses you control.

![Demo 3 — n8n workflow](assets/diagrams/01-fluxo.svg)

![A customer writes in, the AI drafts a reply and a reviewer approves it before it is sent](assets/demo-3-human-approval.gif)

The full walkthrough, with sound, is in [`assets/demo-3-human-approval.mp4`](assets/demo-3-human-approval.mp4) — download it to watch; GitHub does not play video of that size in the browser.

## 🧩 What it does

1. A customer sends a message from the web form.
2. n8n classifies it (topic, urgency) and an AI model drafts a reply.
3. The draft is stored as a pending item and the run **stops at a Wait node**. It stays frozen — no polling, no cron — until a decision arrives.
4. A reviewer opens the desk, reads the customer's message next to the draft and chooses **send as is**, **send my version** or **don't send** (with a reason).
5. The same run resumes. Approved and edited replies are e-mailed to the customer and confirmed on Telegram; rejected ones are archived with the reason and nothing is sent.
6. Every decision records who decided, when, and whether the AI text was corrected.

A second trigger on the same canvas runs every 15 minutes, finds items pending past their deadline and alerts the reviewer once on Telegram. The customer can look up their message by e-mail on the follow-up page; only approved replies are shown.

## 🗺️ Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| Front | React 19 + TanStack Start (Vite) | Customer form, reviewer desk, follow-up page |
| Server routes | TanStack Start (same app) | Read the queue, hold the resume address, sign the resume call |
| Orchestration | n8n (webhook + Wait) | Classify, draft, freeze, resume, deliver |
| Classification | Groq — `openai/gpt-oss-20b` | Topic, urgency, needs-a-human |
| Drafting | OpenAI — `gpt-4o-mini` | Writes the reply |
| Persistence | Postgres (Neon) — `aprovacoes_pendentes` | Pending queue and decision log |
| Delivery | Gmail + Telegram | E-mails the approved text; confirms to the reviewer |

```text
Form → webhook → classify → draft → save item → ⏸ Wait ← reviewer click → app server → signed resume
                                                   ↓
                              record decision → approved / edited → e-mail + Telegram
                                              → rejected → archive with reason
```

The resume address never reaches the browser: whoever holds it could approve as the reviewer. It is stored in the database and read only by the app server; the browser sends just the item id and the decision.

## ⚙️ How to run

**Prerequisites** — an n8n instance; credentials for Groq, OpenAI, Gmail (OAuth), a Telegram bot and a Postgres database (Neon works); [Node.js 20+](https://nodejs.org).

**Setup**

1. Create the table: run [`db/aprovacoes-pendentes.sql`](db/aprovacoes-pendentes.sql) on your database.
2. Import [`workflows/human-approval.json`](workflows/human-approval.json) into n8n and attach your own credentials. The export is sanitized — no credentials, credential ids or personal hosts. Add a Header Auth credential (header `X-Demo3-Resume`) to the `Wait for approval` node, put your chat id in the two Telegram nodes, then activate the workflow.
3. Configure the app:

```powershell
Copy-Item .\ui\.env.example .\ui\.env.local
```

Fill in `DATABASE_URL`, `VITE_DEMO3_WEBHOOK_URL` and `RESUME_SECRET` (the same value as the Header Auth credential). `.env.local` is git-ignored.

**Run**

```powershell
npm install
npm run dev
```

Vite prints the local address. Pages: `/` customer form · `/atendimento` reviewer desk · `/acompanhar` follow-up. Unit tests: `npm test`.

## 🔌 Webhook contract

**Request — customer form → n8n** (`VITE_DEMO3_WEBHOOK_URL`) · `POST` · `application/json`

```jsonc
{
  "origem": "site-contato",
  "remetente": { "nome": "Ana Ribeiro", "email": "ana@example.com" },
  "mensagem": "Comprei o produto errado, posso trocar?",
  "recebido_em": "2026-09-28T14:03:11.000Z"
}
```

**Response — n8n → form**, immediate, before any model runs:

```jsonc
{ "itemId": null, "status": "received" }
```

**Errors:** the form shows a plain-language message when the webhook cannot be reached — never a blank screen. The desk and the follow-up page use only the app's own server routes (`/api/pendentes`, `/api/decisao`, `/api/meu-pedido`), which never return the resume address.

## 🚧 Scope and limitations

- The reviewer area has no login and the reviewer is one fixed label — a deliberate demo choice, not an oversight.
- The desk confirms the decision, not mail delivery: if Gmail fails, the run stops with an error in n8n and no Telegram message is posted.

## 📦 Files

- `ui/` — the React app: customer form, reviewer desk, follow-up page, server routes and unit tests
- `workflows/human-approval.json` — n8n export, no credentials
- `db/aprovacoes-pendentes.sql` — pending-queue table
- `assets/diagrams/01-fluxo.svg` — the workflow diagram
- `assets/demo-3-human-approval.mp4` · `assets/demo-3-human-approval.gif` — the recorded walkthrough
