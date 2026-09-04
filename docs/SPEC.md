# SPEC.md — n8n Web Demos (o quê + regras)

Purpose: o cérebro testável do projeto — regras, entradas/saídas, casos de borda e não-objetivos.
Descreve O QUE cada demo deve fazer, independente de COMO (isso é PRD/implementação).

## 1. Contrato geral (vale para os 3 demos)
Cada demo entrega:
- **UI web** que o usuário final abre e opera (formulário, chat, ou painel).
- **Webhook n8n** que a UI chama (request → processamento/IA → response).
- **Resposta visível na UI** — o usuário vê o resultado do agente, não só um "enviado".
- **Artefatos de portfólio:** `workflow.json` sanitizado, `README.md`, `demo.gif` (fluxo) e screenshot/GIF da UI.

### Regras testáveis do contrato
| # | Regra | Como se prova |
|---|-------|---------------|
| R1 | A UI chama o webhook e renderiza a resposta do n8n | run manual: input na UI → resposta aparece na UI |
| R2 | Nenhum segredo/ID pessoal no `workflow.json` versionado | grep por placeholders; secret-scan antes do push |
| R3 | Workflow só ativado após 1 execução end-to-end limpa | log de execução limpa registrado no README do demo |
| R4 | Todo campo mapeado contra payload real (não assumido) | JSON real capturado antes do mapeamento (SKILL n8n) |
| R5 | Erro do backend tratado na UI (não tela branca) | teste com input inválido → UI mostra estado de erro |

## 2. Entradas / saídas (a definir por demo no PRD)
Os 3 demos ainda não estão definidos — dependem da coleta do curso Udemy e do brainstorm.
Placeholder de estrutura por demo:

- **Demo 1 — <tema a definir>**
  - Entrada (UI): _a definir_
  - Backend n8n: _a definir_
  - Saída (UI): _a definir_
- **Demo 2 — <tema a definir>**
- **Demo 3 — <tema a definir>**

> Ao travar cada demo, preencher entrada/saída aqui ANTES de construir (Definition of Ready).

## 3. Casos de borda (contrato geral)
- Webhook fora do ar / timeout → UI mostra erro amigável, não trava.
- Input vazio ou malformado → validação no front + validação no n8n (defesa dupla).
- Resposta longa da IA → UI precisa acomodar (streaming ou loading state).
- Créditos de ferramenta externa (Lovable) esgotando → prompt deve estar completo para evitar iterações.

## 4. Não-objetivos (o que este projeto NÃO é)
- ❌ Não é SaaS multiusuário com login/billing — são demos de portfólio.
- ❌ Não reaproveita a pasta nem os docs internos do projeto irmão (só o padrão de qualidade).
- ❌ Não redistribui conteúdo do curso Udemy (estudo pessoal apenas).
- ❌ Não constrói o front à mão quando o Lovable (via prompt) resolve com menos custo.
- ❌ Não fixa provedor de IA agora — free-first + validação 2 camadas antes de escolher por demo.
