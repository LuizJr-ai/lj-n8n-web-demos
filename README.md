# n8n Web Demos

> n8n as the brain, a web interface for the end user: three portfolio demos that put AI automation behind screens people can actually use.

## Demos

| Demo | What it does |
|------|--------------|
| [1 — Audio to Minutes](demo-1-audio-summary/) | Records a meeting or takes an audio file; returns a summary, decisions and actions, or a full transcription |
| [2 — AI Lead Qualifier for Custom-Order Sweets](demo-2-lead-qualify-doces/) | A conversational storefront that answers from a knowledge base, scores each quote request and alerts the owner on hot leads |
| [3 — Human Approval in the Loop](demo-3-aprovacao-humana/) | An AI drafts the customer reply and the workflow freezes until a person approves, edits or rejects it |

## How the demos are built

```text
Web interface → n8n webhook → AI / transcription / database → structured response → interface
```

n8n owns the orchestration; the web interface is a replaceable client. Each demo folder is self-contained and follows the same layout:

```text
demo-N-topic/
├── README.md     # what it does, how it works, how to run it
├── workflows/    # n8n export(s), no credentials
├── ui/           # the end-user interface
└── assets/       # screenshots and diagrams used in the README
```

Runtime URLs, secrets and credentials are never committed: each demo ships placeholder files (`.env.example` or `config.example.js`) and you bring your own accounts.

## License

MIT — see [LICENSE](LICENSE).

## Author

Built by **Luiz Jr** as a hands-on portfolio in AI orchestration and n8n automation. Questions and feedback are welcome through the repository's issues.
