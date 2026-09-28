# 🌐 n8n Web Demos

![n8n compatible](https://img.shields.io/badge/n8n-compatible-EA4B71)
![Status](https://img.shields.io/badge/status-private%20portfolio-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

**n8n as the brain, a web UI for the end user.** Three portfolio demos combining AI automation
with interfaces that people can actually use.

## Demos

| Demo | Outcome | Status |
|---|---|---|
| [1 — Audio meeting summary](demo-1-audio-summary/) | Records meetings or transcribes audio; returns summary, decisions, actions and a recommendation | ✅ Complete |
| [2 — Custom-order sweets lead qualifier](demo-2-lead-qualify-doces/) | Conversational storefront, RAG assistance and AI lead routing | ✅ Complete |
| 3 — To be defined | Scope not decided yet | ⚪ Reserved |

## Architecture

```text
Web interface → n8n webhook → transcription / AI / database → structured response → interface
```

Each demo keeps only its UI, sanitized workflow export, minimum setup files and visual evidence.
Runtime URLs and credentials stay outside Git in local environment files.

## Repository layout

```text
demo-N-topic/
├── workflows/                   # sanitized n8n export(s)
├── ui/                         # end-user interface
├── README.md                    # problem, architecture and setup
└── assets/                      # visual evidence used by the demo
```

## Principles

- Real input before field mapping.
- No secrets, personal hosts or credential IDs committed.
- Offline QA plus a clean end-to-end execution before a demo is marked complete.
- n8n owns orchestration; the UI remains a replaceable client.

## License

MIT — see [LICENSE](LICENSE).

Built by **Luiz Jr** as a hands-on portfolio in AI orchestration and n8n automation.
