# PRD.md — n8n Web Demos (escopo, fases, DoD)

Purpose: definir escopo in/out, fases de entrega, definition of done por fase e as decisões
pendentes que ainda precisam de pesquisa/brainstorm antes de virar código.

## 1. Problem statement
Luiz precisa provar competência de mercado em **orquestração de IA + entrega ao usuário final**.
Os demos atuais mostram automação nos bastidores, mas não uma UI com que o cliente interage. Este
projeto entrega **3 demos** onde o n8n é o cérebro e uma **interface web de produção** permite ao
usuário conversar/operar o agente e ver a resposta.

## 2. Escopo
**Dentro:**
- 3 demos auto-contidos (monorepo, uma pasta por demo).
- Backend n8n por webhook + front web que consome e exibe a resposta.
- Artefatos de portfólio por demo (workflow.json sanitizado, README, GIF do fluxo + da UI).
- Coleta de direcionamento de 1 curso Udemy (estudo), 1 módulo por vez.

**Fora (não-objetivos):**
- SaaS/login/billing; reaproveitar pasta do irmão; redistribuir conteúdo do curso;
  fixar provedor de IA ou front stack antes da pesquisa.

## 3. Decisões TRAVADAS
| Decisão | Valor |
|---------|-------|
| Diretório | `C:\Dev\n8n_Web_Demos` (novo, separado do irmão) |
| Topologia | Monorepo, uma pasta por demo |
| Tier | M (docs/adr, _handoff numerado, STATUS) |
| Repo GitHub | Privado, já criado pelo Luiz (remote a conectar no 1º commit) |
| Backend | n8n ao vivo (host próprio) via webhook — reusar credenciais do irmão |
| Padrão de qualidade | Espelha `n8n_Automation_Demos/README.md` |

## 4. Decisões PENDENTES (precisam de pesquisa/brainstorm — ver ADR 0001)
| Pendência | Direção provável | Trava antes de decidir |
|-----------|------------------|------------------------|
| Ferramenta de front | **Lovable** (prompt-engineering p/ caber nos 5 créditos grátis) | `research-validation-protocol` + `execution-guardrails` |
| Hospedagem de produção | NÃO Cloudflare estático (há agente ao vivo) — host que rode backend/produção | validar opções free-first ao vivo |
| Tema de cada demo | Sai do brainstorm com especialistas + notas do curso Udemy | coletar módulo 1 primeiro |
| Provedor de IA por demo | Free-first (Groq/OpenAI já cadastrados) | validação 2 camadas por demo |

## 5. Fases + Definition of Done
| Fase | Entrega | DoD |
|------|---------|-----|
| **0 · Bootstrap** | Scaffold SDD completo | ✅ todos os arquivos do Tier M com conteúdo real + 1º commit |
| **1 · Coleta módulo 1** | Notas de direcionamento do 1º módulo (Udemy) | `docs/curso-<tema>-notas.md` com ordem de build, conceitos, gotchas, checklist |
| **2 · Brainstorm + trava do Demo 1** | Arquitetura + front + IA do Demo 1 travados | SPEC do Demo 1 preenchido (entrada/saída), ADR do front, prompt do Lovable pronto |
| **3 · Build Demo 1** | Workflow + UI + wiring | 1 run limpo, workflow ativo, GIF fluxo + UI, README do demo |
| **4 · Demos 2 e 3** | Repetir 1→3 por demo | idem por demo |
| **5 · Publicação** | Repo público + README raiz | 3 demos prontos, sanitizados, repo tornado público |

## 6. Protocolo de coleta (curso Udemy) — resumo
Fonte: `SEEDnovoprojeton8nwebdemos.md` §4. Pilotar o **Chrome logado do Luiz** (Claude in Chrome),
NÃO script externo. Abrir Transcript aula a aula → gravar `docs/curso-<tema>/aula-NN.md` → ao fim do
módulo, produzir `docs/curso-<tema>-notas.md`. **1 módulo por vez, no momento de construir o demo.**
Limite de direito autoral: transcrição é estudo pessoal; texto do instrutor não vai a README/portfólio.

## 7. Roadmap curto
Bootstrap → coletar módulo 1 → brainstorm Demo 1 → construir Demo 1 → repetir → publicar.
