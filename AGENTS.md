# AGENTS.md — n8n Web Demos (constituição)

Purpose: conhecimento estável do projeto, relido a cada cold start. Define o que o projeto é, o
que o agente NUNCA pode fazer, e os invariantes que sobrevivem a qualquer sessão.

## 1. O que é o projeto
Portfólio de **3 demos** onde o **n8n é o cérebro** (automação + IA) e cada demo tem uma
**interface web** que o usuário final usa para interagir — não só o fluxo rodando nos bastidores.
Objetivo de carreira do Luiz: provar **orquestração + entrega ao usuário final**.

Diferença do projeto irmão (`n8n_Automation_Demos`): lá o fluxo roda nos bastidores; **aqui há UI
de produção com a qual a pessoa conversa** (agente interligado responde em tempo real).

## 2. Invariantes (nunca quebrar)
- **n8n exposto por Webhook = backend.** O front chama o webhook; a lógica/IA vive no n8n.
- **Cada demo é auto-contido:** `demo-N/{workflow.json, web/, README.md, demo.gif}` (monorepo).
- **Sanitização total:** nenhum ID pessoal, host, chave ou segredo versionado. Credenciais entram
  como referências vazias + placeholders (padrão herdado do README irmão).
- **Inativo até provado:** todo workflow só é entregue após ≥1 execução end-to-end limpa.
- **Real input first:** todo campo mapeado contra o payload real, nunca contra forma assumida.

## 3. O que o agente NUNCA faz
- ❌ Escrever workflow/código/front antes de SPEC + PRD existirem (bootstrap já concluído — mantê-los atualizados).
- ❌ Construir nó n8n de memória — usar SKILL `n8n-build-first-time-right` e capturar JSON real.
- ❌ Recriar credencial/workflow que já existe no projeto irmão (ver `INTEGRATIONS.md`).
- ❌ Commitar segredo (valores só no ambiente; `INTEGRATIONS.md` guarda nome/tipo/ID, nunca valor).
- ❌ Colocar transcrição/texto de curso pago em README, portfólio ou qualquer arquivo versionado.
- ❌ Ativar workflow que envia/escreve antes de execução limpa comprovada.
- ❌ Gastar créditos de ferramenta externa (ex.: Lovable) sem prompt completo que evite retrabalho.

## 4. Boundary de capacidade
- **n8n ao vivo** via `n8n-mcp` (`n8n_health_check` confirma). Host próprio já existe.
- **Front:** ferramenta ainda não travada. Candidato: **Lovable** — o agente NÃO constrói o front à
  mão por padrão; **estrutura o prompt** com tudo que o Lovable precisa para só executar (sem
  raciocinar), dentro dos **5 créditos grátis**. Ver `docs/adr/0001`.
- **Hospedagem de produção:** a UI interage com agente ao vivo → precisa de host que rode em
  produção (Cloudflare Pages estático provavelmente não basta). Decisão no PRD após brainstorm.

## 5. Especialistas (skills obrigatórias por assunto)
- Build/edição n8n → `n8n-build-first-time-right` + `n8n-mcp-tools-expert` + `n8n-node-configuration`.
- Ensino nó-a-nó (Luiz executa, agente guia) → `n8n-tutor`.
- Pesquisa/validação de stack → `research-validation-protocol` (2 camadas: doc oficial + comunidade).
- Prompt para executor externo (Lovable/Codex) → `codex-prompt-standard` (arquivo durável, não chat).
- Ação com custo externo (créditos Lovable, deploy) → `execution-guardrails`.

## 6. Fluxo de trabalho por demo
1. Coletar 1 módulo do curso Udemy (Claude in Chrome, sessão logada) → notas de direcionamento.
2. Brainstorm com especialistas → travar arquitetura e front daquele demo.
3. Construir workflow n8n (2 estágios, JSON real, nó de escrita por último).
4. Estruturar prompt do front → gerar UI → ligar ao webhook.
5. QA verde offline → 1 run limpo → ativar → GIF do fluxo + screenshot/GIF da UI.

## 7. Referências
- Padrão de qualidade: `C:\Dev\n8n_Automation_Demos\README.md` (espelho, não copiar docs internos).
- Protocolo de coleta de curso: `docs/PRD.md` §Coleta + `SEEDnovoprojeton8nwebdemos.md` §4.
