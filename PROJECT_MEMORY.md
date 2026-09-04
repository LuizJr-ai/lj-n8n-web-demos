# PROJECT_MEMORY.md — memória durável do projeto

Purpose: fatos estáveis que não devem se perder entre sessões e que não pertencem a nenhum arquivo
específico. Não é log de sessão (isso é `_handoff/`) nem checklist (isso é `TASKS.md`).

## Identidade
- **Projeto:** n8n Web Demos — 3 demos com n8n como cérebro + interface web de produção.
- **Diretório:** `C:\Dev\n8n_Web_Demos` (separado, não mistura com `n8n_Automation_Demos`).
- **Objetivo de carreira:** provar orquestração de IA + entrega ao usuário final.
- **Idioma do projeto:** PT-BR nos docs internos; README de portfólio em inglês (padrão do irmão).

## Fatos que não mudam
- O projeto irmão (`C:\Dev\n8n_Automation_Demos`) é **espelho de padrão de qualidade**, não fonte
  de cópia. Só o README serve de referência; docs internos não são replicados.
- Credenciais e n8n são **reaproveitados** do irmão — nunca recriar (ver `INTEGRATIONS.md`).
- Transcrição de curso pago = **estudo pessoal**; nunca entra em README/portfólio/repo.
- Todo demo é auto-contido: `demo-N/{workflow.json, web/, README.md, demo.gif}`.

## Convenções herdadas (não-negociáveis)
- Build n8n pela SKILL `n8n-build-first-time-right` (JSON real; nó de escrita por último; inativo até 1 run limpo).
- Sanitização total: nenhum segredo/ID versionado.
- Nenhuma premissa sobre ferramenta externa (Lovable, hospedagem) tratada como fato sem validação 2 camadas.

## Marcos
- 2026-09-04 — Bootstrap SDD concluído (scaffold Tier M criado a partir do SEED).
