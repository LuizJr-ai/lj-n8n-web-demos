# CLAUDE.md — n8n Web Demos (ponteiro fino)

Purpose: orientar o agente no cold start. Conhecimento estável vive em `AGENTS.md`; aqui só a ordem de leitura e os não-negociáveis.

> Herda `~/.claude/CLAUDE.md` (perfil do Luiz) e override de idioma **PT-BR**.

## Ordem de leitura
1. `AGENTS.md` — constituição.
2. `docs/SPEC.md` — regras testáveis, não-objetivos.
3. `docs/PRD.md` — escopo, fases, decisões pendentes.
4. `tasks/TASKS.md` — checklist e backlog.
5. `INTEGRATIONS.md` — serviços/credenciais/IDs (nunca segredo).
6. `_handoff/` (mais recente) — estado da última sessão.

## Não-negociáveis
- **n8n é o cérebro; a UI é o delta** deste portfólio (cada demo = fluxo + interface do usuário final).
- **Build n8n = SKILL `n8n-build-first-time-right`** (JSON real antes de mapear; nó que envia/escreve por último; inativo até 1 run limpo).
- **Reusar antes de criar** — creds/workflows do irmão `C:\Dev\n8n_Automation_Demos` já existem.
- **Front stack pendente** (`docs/adr/0001`): provável Lovable via prompt dentro dos 5 créditos; provável não-Cloudflare.
- **Direito autoral:** transcrição de curso é estudo pessoal; nunca vai a README/portfólio.

## Convenção
Docs em `MAIÚSCULA.md`, templates em `kebab-case.md`. Todo arquivo abre com `# Título` + `Purpose:`.
