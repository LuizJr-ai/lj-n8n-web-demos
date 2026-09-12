# Áudio em Ata — interface local

Fonte do front do Demo 1, recuperada pelo Git Sync oficial do Lovable e mantida localmente.

## Configuração

1. Copie `.env.example` para `.env.local` e preencha as duas URLs públicas dos webhooks.
2. Execute `PowerShell -ExecutionPolicy Bypass -File .\scripts\setup.ps1`.
3. Inicie com `PowerShell -ExecutionPolicy Bypass -File .\scripts\dev.ps1`.

`.env.local`, dependências, builds e o Bun portátil ficam fora do Git.

## Qualidade

- `PowerShell -ExecutionPolicy Bypass -File .\scripts\qa.ps1`
- Critério visual principal: 1920×1080, zoom 100%, dois cards completos e sem rolagem da página.
