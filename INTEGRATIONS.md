# INTEGRATIONS.md — Serviços, credenciais e IDs

Purpose: lookup de QUAIS integrações existem e como se chamam. NUNCA valores de segredo — só
nome/tipo/endpoint/limitação. Valores vivem no ambiente (n8n credentials / .env local).

## Motor de automação
| Serviço | Tipo | Como acessar | Notas |
|---------|------|--------------|-------|
| n8n | self-hosted (host próprio já existe) | `n8n-mcp` por API Key; `n8n_health_check` confirma | Mesma instância do projeto irmão. Nunca o conector `/mcp-server/http` (bug) |

## Credenciais reaproveitáveis (já cadastradas no projeto irmão — NÃO recriar)
> Fonte: `C:\Dev\n8n_Automation_Demos\INTEGRATIONS.md`. Valores NÃO ficam aqui.

| Credencial | Tipo | Reuso previsto |
|------------|------|----------------|
| Google Sheets | OAuth2 | persistência simples de um demo |
| Telegram | Bot (`LuizJr n8n Demos`) | alerta/notificação |
| Slack | API token (workspace `Luiz Junior - AI`) | notificação de equipe |
| Gmail | OAuth2 | envio de e-mail |
| LLM — Groq | cred `gpt-oss-20b` (free 8K TPM/1000 RPD) | IA free-first |
| LLM — OpenAI | cred `gpt-4o-mini` | IA quando contexto grande |
| Supabase | Project URL + API Key (projeto `n8n Demos`) | persistência relacional |
| NocoDB | self-hosted | alternativa relacional custo ~zero |

## Repositório / publicação
| Item | Valor | Nota |
|------|-------|------|
| Repo GitHub | **criado pelo Luiz** (privado) — URL/remote a preencher no 1º commit | privado até os 3 demos prontos → público |
| Acesso | `gh` CLI autenticado (`LuizJr-ai`, escopo `repo`) | herdado do ambiente |

## Front / hospedagem (PENDENTE — ver PRD §4 e docs/adr/README)
| Item | Estado |
|------|--------|
| Ferramenta de front | Candidato **Lovable** — não validado; premissa de custo do Luiz a confirmar |
| Hospedagem de produção | Não definida; provável não-estática (agente ao vivo) |

## Material de estudo
| Item | Estado |
|------|--------|
| Curso Udemy | Coleta via Chrome logado (Claude in Chrome), 1 módulo por vez. Transcrição = estudo pessoal, gitignored (`docs/curso-*`) |

## Limitações conhecidas
| Limitação | Impacto |
|-----------|---------|
| GitHub é vitrine, não runtime | Nenhuma credencial de produção no repo |
| Créditos de ferramenta de front (Lovable) | Prompt precisa vir completo para não desperdiçar geração |
