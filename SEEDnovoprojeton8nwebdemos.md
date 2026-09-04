# SEED — Novo projeto: n8n + Interface Web (3 novos demos)

Purpose: relatório-semente para o próximo agente ler no cold start da SESSÃO NOVA (projeto separado).
Não é o scaffold — o scaffold sai da skill `project-bootstrap-sdd`. Este arquivo dá contexto, decisões
já travadas e o protocolo de coleta de material de estudo. Herda `~/.claude/CLAUDE.md` (perfil do Luiz)
e o override de idioma PT-BR do projeto de origem.

---

## 1. Objetivo do novo projeto
Portfólio de **mais 3 demos** onde o **n8n é o cérebro (automação + IA)** e há uma **interface web**
para o cliente final interagir — não só o fluxo rodando nos bastidores, mas uma UI que a pessoa usa.
Meta de carreira do Luiz: provar competência de mercado = **orquestração + entrega ao usuário final**.

## 2. Arquitetura recomendada (discutida, a validar no PRD)
- **n8n exposto por Webhook (API)** = backend de automação/IA.
- **Front separado e leve** (React/Next, ou HTML estático quando bastar) que chama o webhook.
- Portfólio: cada demo com **GIF do fluxo n8n E screenshot/GIF da UI**.
- Estrutura de repo a decidir no bootstrap: monorepo (`/workflow` + `/web`) ou dois repos ligados.

## 3. Decisões já travadas nesta conversa
- **Novo diretório/projeto** (ex.: `C:\Dev\n8n_Web_Demos`) — NÃO reaproveitar a pasta dos 3 demos
  atuais; assuntos não podem se misturar.
- **Claude não tem "duplicar projeto".** Não copiar conteúdo antigo. O **scaffold sai do
  `project-bootstrap-sdd`** (AGENTS → SPEC → PRD → TASKS → implementação), gerando moldes vazios.
- **Referência ao projeto anterior = apenas o README**, como espelho de PADRÃO DE QUALIDADE
  (few nodes/clear purpose, sanitização, GIF + workflow.json por demo, sticky notes Library-ready).
  Caminho: `C:\Dev\n8n_Automation_Demos\README.md`. Não replicar os docs internos — só se inspirar no padrão.

## 4. Protocolo de coleta de material de estudo (curso Udemy)
Objetivo: extrair o **direcionamento** de um curso da Udemy (na conta do Luiz) para guiar o que construir.

**Forma escolhida — pilotar o Chrome logado do Luiz (Claude in Chrome), NÃO script externo.**
Motivo: Udemy fica atrás de login pago; script solto (yt-dlp etc.) é frágil e cinza. Usar a sessão
já logada = ler o texto que a página serve, sem driblar proteção, sem senha passando pelo agente.

Passo a passo:
1. Luiz confirma que está **logado na Udemy** no Chrome e passa o **link do curso/1ª aula**.
2. Agente navega aula a aula, abre o painel **Transcript**, lê o texto e grava em
   `docs/curso-<tema>/aula-01.md`, `aula-02.md`… (via read_page/get_page_text).
3. Ao fim de cada módulo, o agente PRODUZ notas de direcionamento em `docs/curso-<tema>-notas.md`:
   ordem de construção · conceitos-chave (nas palavras do Luiz) · gotchas/erros comuns · checklist por demo.

**Recomendação de ritmo:** coletar **1 módulo por vez**, no momento de construir aquele demo —
mais rápido, menos ruído, nota focada no que será usado agora.

**Limite de direitos autorais (não-negociável):** transcrição serve para ESTUDO/planejamento pessoal.
O texto do instrutor NÃO vai para README, portfólio, nem é redistribuído. Notas são derivadas, não cópia.

## 5. Primeiro passo do próximo agente
1. Rodar `project-bootstrap-sdd` na pasta nova (dimensionar tier, decidir GitHub, criar espinha dorsal).
2. No PRD, travar a arquitetura n8n+web e a topologia de repo.
3. Só então iniciar a **coleta do 1º módulo** da Udemy pelo protocolo da seção 4.
4. Transformar as transcrições em notas de direcionamento antes de escrever qualquer workflow.

## 6. Ponteiros
- Padrão de qualidade (README de referência): `C:\Dev\n8n_Automation_Demos\README.md`
- Skills: `project-bootstrap-sdd`, `project-structure-standard`, `n8n-build-first-time-right`,
  `research-validation-protocol`, `explain-didactic`.
- Não-negociáveis n8n herdados: JSON real antes de mapear · nó que envia/escreve é o último ·
  workflow inativo até 1 execução limpa · build manual nó-a-nó (Luiz executa; agente guia).
