# 🌐 n8n Web Demos

![n8n compatible](https://img.shields.io/badge/n8n-compatible-EA4B71)
![Status](https://img.shields.io/badge/status-in%20progress-orange)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

**n8n as the brain, a web UI for the end user.** A portfolio of **3 demos** where an n8n workflow
handles the automation and AI, and a lightweight **web interface** lets the end user interact with
the agent in real time and see the response — not just a flow running behind the scenes.

> 🚧 **Work in progress.** The three demos are being defined and built one at a time. This README
> fills in as each demo ships, mirroring the quality bar of the sibling repo
> [`n8n_Automation_Demos`](https://github.com/) (few nodes, clear purpose, fully sanitized).

## 📦 Planned demos
| Demo | What it will do | Status |
|------|-----------------|--------|
| Demo 1 — _to be defined_ | n8n webhook + web UI the user talks to | ⏳ planning |
| Demo 2 — _to be defined_ | — | ⏳ planning |
| Demo 3 — _to be defined_ | — | ⏳ planning |

## 🧭 Design principles
- **n8n is the brain, the UI is the deliverable** — each demo ships a flow *and* an interface the end user operates.
- **Few nodes, clear purpose** — over node soup.
- **No secrets committed** — credentials ship as empty references + placeholders.
- **Real input first** — every field mapped against the actual payload, never an assumed shape.
- **Inactive until proven** — each workflow ships after at least one clean end-to-end run.

## 📂 Repository layout
```
demo-1-<topic>/   workflow.json · web/ · README.md · demo.gif
demo-2-<topic>/   workflow.json · web/ · README.md · demo.gif
demo-3-<topic>/   workflow.json · web/ · README.md · demo.gif
```

## 📄 License
MIT — see [`LICENSE`](LICENSE).

## 👤 Author
Built by **Luiz Jr** as part of a hands-on portfolio in AI orchestration & n8n automation.
