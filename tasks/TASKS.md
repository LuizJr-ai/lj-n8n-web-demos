# TASKS.md — checklist executável

Purpose: passos atômicos por fase + backlog. O "porquê" de cada decisão mora aqui em uma linha;
o estado narrativo da sessão vai para `_handoff/`.

## Fase 0 · Bootstrap (em andamento)
- [x] `git init` local
- [x] Scaffold Tier M com conteúdo real (AGENTS, CLAUDE, SPEC, PRD, INTEGRATIONS, STATUS, adr/, templates)
- [x] `.gitignore` com proteção de segredo + material de curso + _handoff
- [x] Seed de continuidade `_handoff/00_snapshot.md`
- [ ] Conectar remote do repo privado (aguarda URL do Luiz) → 1º commit
- [ ] Confirmar `n8n_health_check` verde antes de qualquer build

## Fase 1 · Coleta do módulo 11 (Udemy) — CONCLUÍDA
- [x] Login Udemy confirmado + módulo 11 (aulas 72–86, Lovable+n8n)
- [x] 15 transcrições gravadas em `docs/curso-lovable-n8n/aula-72..86.md` (gitignored)
- [x] Notas de direcionamento em `docs/curso-lovable-n8n-notas.md`

## Fase 2 · Brainstorm + trava do Demo 1
- [ ] Definir tema/entrada/saída do Demo 1 em `SPEC.md` §2
- [ ] Validar front + hospedagem (research 2 camadas) → virar ADR 0002
- [ ] Estruturar prompt do Lovable (via `codex-prompt-standard`) com tudo pronto p/ só executar
- [ ] Aritmética de créditos antes de disparar geração (`execution-guardrails`)

## Fase 3 · Build Demo 1
- [ ] Workflow n8n (SKILL `n8n-build-first-time-right`: JSON real → transform offline → nó de escrita por último)
- [ ] UI ligada ao webhook; tratamento de erro na UI (R5)
- [ ] 1 run limpo end-to-end → ativar workflow
- [ ] `demo-1-<tema>/`: workflow.json sanitizado · README · demo.gif (fluxo) · screenshot/GIF da UI

## Fase 4 · Demos 2 e 3
- [ ] Repetir Fases 1→3 por demo

## Fase 5 · Publicação
- [ ] README raiz com tabela dos 3 demos (padrão irmão)
- [ ] Secret-scan final → tornar repo público

## Backlog / a decidir
- Tema dos 3 demos (depende do curso + brainstorm)
- Provedor de IA por demo (free-first)
- URL/remote do repo GitHub

## Estado atual (fim da sessão de bootstrap)
Scaffold criado; falta conectar remote + 1º commit. Próximo passo: Luiz passa a URL do repo e o
link do módulo 1 da Udemy.
