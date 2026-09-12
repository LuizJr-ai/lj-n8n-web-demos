# Referências — Demo 2 (qualificação de lead / assistente de encomenda de doces)

Purpose: registrar as fontes/produtos reais consultados na concepção do Demo 2, para captar
padrões de UX, ideias de melhoria (ex.: FAQ de autoatendimento) e caminhos de implementação ao
longo do processo. Não é endosso de compra — é banco de referência. Coletado sessão 07.

## Produtos de referência (apps reais no mesmo espaço)

| Produto | URL | Para que serve como referência |
|---|---|---|
| **Tars — Cake Ordering Chatbot** | https://hellotars.com/chatbot-templates/restaurant-hotel/VycDKS/cake-ordering-chatbot | UX do fluxo conversacional de encomenda; **cores suaves aprovadas pelo Luiz p/ o app**; 4 capacidades-chave (abaixo) |
| **Tecca — chatbot p/ confeitaria** | https://www.soytecca.com/en/whatsapp-chatbot/bakeries | Vertical idêntica (confeitaria via WhatsApp); coleta passo a passo (tipo, tamanho, recheio, decoração, texto, data, retirada/entrega) |
| **OrderOnWhats.app** | https://orderonwhats.app/ | Sistema de pedidos por WhatsApp + IA + vitrine + gestão (US$45/mês) |
| **SleekFlow** | https://sleekflow.io/pt-br | Caminho da **API oficial do WhatsApp Business (BSP)**; IA agents; referência do que a via WhatsApp real exige |
| **ManyChat / Landbot** | manychat.com · landbot.io | Construtores visuais de chatbot (WhatsApp/IG), sem código; benchmark de UX e preço (ManyChat grátis→R$149/mês) |

## Padrões de UX capturados do template Tars (as 4 capacidades)
1. **Custom specification capture** — fluxo conversacional que se adapta às escolhas anteriores
   (ex.: bolo de 3 andares → pergunta sabor por andar). *Aplicável ao nosso: personalização/tema.*
2. **Visual reference collection** — cliente envia foto de referência (Pinterest/Instagram) dentro
   da conversa, anexada ao pedido. *Ideia forte p/ doce personalizado (ex.: brigadeiro temático).*
3. **Scheduling with lead-time logic** — impõe prazo mínimo por complexidade (impede "bolo elaborado
   pra amanhã"); mostra só as datas viáveis. *Casa com "sob encomenda" da Alanna.*
4. **Multi-channel availability** — mesmo backend atende site, WhatsApp e SMS. *Confirma nossa tese:
   o cérebro (n8n) é um só; o canal é troca de nó.*

## Ideia de melhoria registrada — FAQ de autoatendimento (proposta do Luiz, sessão 07)
Deixar, ANTES da barreira de cadastro, um **FAQ de consulta rápida** (perguntas/respostas mais comuns,
em especial faixa de preço). Racional: o curioso desiste quando é obrigado a se cadastrar só para
tirar uma dúvida; se ele obtém a resposta primeiro, cria curiosidade/confiança e volta como lead
(mesmo que frio no início). Princípio de UX por trás: **reduzir fricção de entrada + compromisso
progressivo** (o cliente dá passos pequenos antes do cadastro). → refletir no SPEC/diagrama do Demo 2.

### FAQ — perguntas do segmento (base de MERCADO, não inventadas) — sessão 07
Consolidado de FAQs reais de confeitarias sob encomenda (BR) + bakeries de custom cake (intl).
Modelo: acordeão (clica e abre a resposta). Respostas específicas de política ficam como
placeholder até Alanna confirmar (sinal %, prazos, pedido mínimo, pagamento).

| Pergunta (recorrente no segmento) | Resposta-base (confirmar com Alanna) |
|---|---|
| Qual o prazo mínimo de encomenda? | ex.: X dias; datas especiais/casamento exigem mais antecedência |
| Precisa de sinal para reservar a data? | padrão do setor: **50%** para confirmar e reservar a data; restante na retirada |
| Qual o pedido mínimo? | fecha por **cento/unidade** (definir mínimo) |
| Formas de pagamento? | Pix / cartão / etc. |
| Fazem o tema/personalização que eu quiser? | sim; **cliente envia foto de referência** (Pinterest/Insta) |
| Como recebo o pedido? | **retirada** ou **envio** (a definir por região) |
| Posso cancelar/remarcar? | política de cancelamento (ex.: retém 50% após prazo X) |
| Tem restrição alimentar / alérgenos? | contém glúten/leite/ovos; **não é ambiente livre de alérgenos** |

Fontes: FAQs de confeitarias BR (Chapoca, My Lovin Cake, Sensação Bolos, Andréa Melo, Alô Doces) +
bakeries intl (That's The Cake, Custom Cakes by Adele). Confiança **Alta** (padrão convergente em
múltiplas fontes independentes). Prazos/sinais variam por casa → confirmar com Alanna antes do build.

### Paleta de cores — preferência + pesquisa de mercado do nicho (sessão 07)
**Preferência do Luiz:** o roxo atual do protótipo **não** é a preferência; aceitável só se suavizado
por degradê. Decisão correta: escolher por **pesquisa de design do nicho**, não de cabeça.

**Pesquisa (2 camadas) — o que o nicho de doces/chocolate pede:**
- Cores **quentes** (vermelho/laranja/amarelo, e tons de chocolate) **estimulam apetite**; **azul é o
  pior** para comida (lê como não-natural/estragado). → o roxo+forminha azul do protótipo é fraco p/ apetite.
- Marca **artesanal/premium** (é o caso da "Doces Artesanais") → **tons terrosos + pastéis** = artesanato,
  cuidado. **Marrom e dourado** = riqueza do chocolate e celebração (Ferrero=dourado). Roxo/lilás funciona
  como **diferenciador de marca** (Milka), mas como **acento**, não base de apetite.
- Regra: 2–3 cores principais + 1–2 de acento. ~90% do julgamento inicial é cor, nos primeiros 90s.

**Parecer (paleta a TESTAR — trocar o roxo por isto):**
- Fundo: creme quente `#FBF7F1` (deixa a foto do doce saltar)
- Primária/CTA: chocolate `#6B3F27` (ou caramelo `#B0764F`)
- Acento 1: rosa/blush `#E8B4C4` (feminino, casa com a marca da Alanna)
- Acento 2: dourado `#C9A24B` (eventos/premium)
- Texto: marrom escuro `#3B2A20`; muted `#8A7A6D`

Confiança **Alta** (fontes convergem: psicologia de cor de alimento + artesanal→terroso/pastel +
chocolate→marrom/dourado). Ressalva: casar com as **cores reais da marca da Alanna** (confirmar).
Fontes: bakeryandsnacks.com (cor vende comida) · bakersauthority.com (psicologia de cor) ·
produkto.io (paletas pastry/bakery) · colorlib.com (26 sites de chocolate) · confetti.design (branding).

### Tela 3 — mini-CRM por estágio do cliente (registrado para v2) — sessão 07
Ideia do Luiz: além do painel de leads pontuados (Tela 2), uma **terceira tela em formato de cards
por estágio** (tipo Kanban) mostrando o **momento de cada cliente conforme o atendimento flui** —
ex.: `Novo → Orçamento enviado → Aguardando sinal → Confirmado → Entregue`. É um mini-CRM
(gestão de relacionamento). **Escopo v2** (não entra no MVP do Demo 2). Reaproveita os dados já
gravados no Neon (lead + score + tier + estágio). → abrir no TASKS como backlog v2.

## Evidência de negócio (por que resposta rápida + qualificação vende)
- **Regra dos 5 minutos** (MIT/InsideSales, 15 mil leads): responder em ≤5 min = **21× mais chance**
  de qualificar vs. após 30 min. — https://resources.rework.com/libraries/lead-management/lead-response-time
- **Harvard Business Review** (2,24 mi de leads): contato em ≤1h = **~7× mais chance** de qualificar.
  — https://www.leadangel.com/blog/operations/lead-response-time/
- **Panorama WhatsApp Brasil:** 90,8% das empresas só fazem atendimento manual; 41,2% automatizam
  (espaço aberto). — https://sleekflow.io/pt-br/blog/melhor-automacao-ia-whatsapp

⚠️ Confiança: estudos de tempo-de-resposta = **Alta** (independentes). Números de ROI de fornecedor
(ex.: "+30% vendas") = **Baixa** (marketing, não validado). Sem relato orgânico de dono (Reddit
bloqueia crawler).
