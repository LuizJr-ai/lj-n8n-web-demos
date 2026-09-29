# Audio to Minutes — web interface

> The React / TanStack Start front end of Demo 1. The full setup, including the n8n workflow it talks to, is in the [demo README](../README.md).

## Run locally

```bash
cp .env.example .env.local   # enter your two n8n webhook URLs
bun install
bun run dev
```

Vite prints the local address. `.env.local` is git-ignored.

## Scripts

| Command | What it does |
|---------|--------------|
| `bun run dev` | Starts the development server |
| `bun run build` | Builds the production bundle |
| `bun run build:dev` | Builds in development mode |
| `bun run preview` | Serves the built bundle locally |
