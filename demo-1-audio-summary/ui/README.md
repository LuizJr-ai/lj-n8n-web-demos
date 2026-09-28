# Audio to Minutes — local interface

The Demo 1 frontend is maintained locally as a React/TanStack application.

## Configuration

1. Copy `.env.example` to `.env.local` and enter the two public webhook URLs.
2. Run `PowerShell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`.
3. Start the app with `PowerShell -ExecutionPolicy Bypass -File .\scripts\dev.ps1`.

`.env.local`, dependencies, builds, and portable Bun files stay outside Git.

## Quality

- `PowerShell -ExecutionPolicy Bypass -File .\scripts\qa.ps1`
- Primary visual criterion: 1920×1080 at 100% zoom, with both panels fully visible and no page scroll.
