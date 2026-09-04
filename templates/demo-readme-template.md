# <emoji> Demo N — <Título do demo>

Purpose (interno, remover na publicação): molde de README por demo. Espelha o padrão do projeto
irmão. Preencher com o payload/config REAIS depois de 1 execução limpa.

> One-liner: o que o usuário final faz na UI e o que o agente devolve.

## 🎬 Demo
- GIF do fluxo n8n: `demo.gif`
- Screenshot/GIF da UI: `web/ui.gif`

## 🧩 O que faz
Descrição curta: entrada na UI → webhook n8n → processamento/IA → resposta na UI.

## 🗺️ Arquitetura
| Camada | Tecnologia | Papel |
|--------|-----------|-------|
| Front | <a definir> | UI que o usuário opera |
| Backend | n8n (webhook) | automação + IA |
| IA | <provedor free-first> | <papel> |
| Persistência | <se houver> | <papel> |

## ⚙️ Como rodar
1. **Importar** o `workflow.json` no n8n (`Import from File`).
2. **Conectar credenciais** — lista exata: <...>.
3. **Substituir placeholders** — ex.: `<SEU_WEBHOOK_URL>`, `<SUA_PLANILHA_ID>`.
4. **Subir a UI** — <passo do front>; apontar para o webhook.
5. **Rodar uma vez** — testar, confirmar execução limpa, então **ativar**.

## 🔌 Contrato do webhook
- **Request (UI → n8n):** `{ ... }` (payload real)
- **Response (n8n → UI):** `{ ... }` (payload real)
- **Erro:** UI mostra estado de erro (não tela branca).

## ✅ Prova
- Execução limpa registrada: `exec <id>` em <data>.
- Workflow ativo: sim/não.
