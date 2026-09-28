# 🎙️ Demo 1 — Audio to Minutes

> Record a meeting to get a structured recap and action list, or upload an audio file to get a full transcription — all from one web interface backed by an n8n workflow.

![Demo 1 interface](assets/ui-1920x1080.png)

## 🧩 What it does

Two modes, one interface:

- **Record a meeting** (`mode: reuniao`) → returns an executive **summary**, the **decisions**, and an atomic **action list**. The formatted minutes (*ata*) can be downloaded as a Markdown file (`meeting-minutes.md`).
- **Upload an audio file** (`mode: arquivo`) → returns the **full transcription** verbatim, without inventing a meeting summary. The transcription can be downloaded in full.

Accepted audio: WEBM, MP3, WAV, M4A, OGG — up to 25 MB.

## 🗺️ Architecture

| Layer | Technology | Role |
|-------|-----------|------|
| Front | React + TanStack Start (Vite / Bun) | UI the end user operates |
| Backend | n8n (webhook) | Orchestration |
| Speech-to-text | Groq Whisper | Audio → text |
| Structuring | OpenAI | Summary / decisions / actions (meeting mode) |
| Persistence | Neon (Postgres) | Stores the recorded meeting for later retrieval |

```text
React UI → n8n webhook → Groq Whisper → route by mode
                                  ├─ reuniao → OpenAI → validation → Neon → response
                                  └─ arquivo ───────────────────────────────→ response
```

A second webhook retrieves a stored transcription by id (`GET …?id=<meetingId>`).

## ⚙️ How to run

```powershell
Set-Location .\demo-1-audio-summary\ui
Copy-Item .env.example .env.local   # fill in your two n8n webhook URLs
bun install
bun run dev
```

Open `http://127.0.0.1:8080/`. The app runs fully independent of any builder platform; webhook URLs live only in `ui/.env.local` (the repo ships placeholders in `ui/.env.example`).

## 🔌 Webhook contract

**Request — UI → n8n** (`VITE_DEMO1_TRANSCRIBE_URL`)
`POST` · `multipart/form-data`
```
file: <audio blob>          # WEBM | MP3 | WAV | M4A | OGG, ≤ 25 MB
mode: "reuniao" | "arquivo"
```

**Response — n8n → UI** (`application/json`)
```jsonc
// mode: reuniao
{ "resumo": "…", "decisoes": ["…"], "acoes": ["…"] }

// mode: arquivo
{ "transcricao": "…" }
```

**Retrieve transcription** (`VITE_DEMO1_DOWNLOAD_URL`) — `GET …?id=<meetingId>` → `{ "transcricao": "…" }`

**Errors:** the UI shows an explicit error state (timeout, network, invalid format, unconfigured integration) — never a blank screen.

## ✅ Proof

- Offline QA over real audio fixtures, plus a clean end-to-end run before publishing.
- No secrets, personal hosts or credential IDs committed; workflow export is sanitized.

## 📦 Files

- `ui/` — React / TanStack Start source.
- `workflows/audio-summary.json` — sanitized n8n export.
- `assets/` — interface screenshot and workflow diagram.

## 🏷️ Tags

`#n8n` `#speech-to-text` `#whisper` `#openai` `#meeting-minutes` `#transcription` `#react` `#automation`
