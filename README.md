<!-- readme-type: index -->
# 🌐 n8n Web Demos

> n8n as the brain, a web interface as the delta: three portfolio demos that put AI automation behind screens people can actually use.

![n8n compatible](https://img.shields.io/badge/n8n-compatible-EA4B71)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

## 🎬 Demos

| Demo | What it does |
|------|--------------|
| [🎙️ 1 — Audio to Minutes](demo-1-audio-summary/) | Records a meeting or takes an audio file; returns a summary, decisions and actions, or a full transcription |
| [🧁 2 — AI Lead Qualifier for Custom-Order Sweets](demo-2-lead-qualify-doces/) | A conversational storefront that answers from a knowledge base, scores each quote request and alerts the owner on hot leads |
| [🛡️ 3 — Human Approval in the Loop](demo-3-aprovacao-humana/) | An AI drafts the customer reply and the workflow freezes until a person approves, edits or rejects it |

## 🗺️ Architecture

```text
Web interface → n8n webhook → AI / transcription / database → structured response → interface
```

n8n owns the orchestration; the web interface is a replaceable client.

## 📦 Repository layout

```text
demo-N-topic/
├── README.md     # what it does, how it works, how to run it
├── workflows/    # n8n export(s), no credentials
├── ui/           # the end-user interface
└── assets/       # screenshots and diagrams used in the README
```

Runtime URLs, secrets and credentials are never committed: each demo ships placeholder files (`.env.example` or `config.example.js`) and you bring your own accounts.

## 🧭 Principles

- Real input before field mapping.
- No secrets, personal hosts or credential ids committed.
- n8n owns orchestration; the interface stays a replaceable client.

## 📄 License

MIT — see [LICENSE](LICENSE).

## 👤 Author

Built by **Luiz Jr** as a hands-on portfolio in AI orchestration and n8n automation. Questions and feedback are welcome through the repository's issues.
