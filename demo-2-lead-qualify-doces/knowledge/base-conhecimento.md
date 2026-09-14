# Base de conhecimento — Doce Aurora (RAG do Demo 2)

Purpose: fonte única do que o agente/FAQ pode responder (cardápio, políticas, prazos). É este
texto que será fatiado e indexado no pgvector para o RAG. **Rascunho:** itens marcados `⟨CONFIRMAR⟩`
descreve a empresa fictícia Doce Aurora. Os dados são apenas de demonstração e não devem ser
apresentados como condições de uma empresa real.

## Sobre
Doce Aurora — ateliê fictício de doces artesanais sob encomenda para festas (casamento,
aniversário infantil, corporativo e datas comemorativas). Cada tema é personalizável.

## Produtos / cardápio
- Bem-casados, docinhos finos, bolos, mesas de doces e kits lembrança por tema.
- Personalização por tema e cor; aceita foto de referência (Pinterest/Instagram).

## Pedido mínimo e preços
- Docinhos gourmet: R$3,50 por unidade ou R$320 por cento; mínimo de 50 por sabor.
- Bem-casados: R$5,50 por unidade; mínimo de 30. Bolo decorado: a partir de R$180/kg.
- O pedido mínimo é R$300, fora a taxa de entrega. Valores finais dependem de tipo, quantidade,
  data e tema.

## Personalização
- Fazemos o tema que o cliente quiser (tema + cor). Envie foto de referência junto ao pedido.

## Entrega / retirada
- Retirada no ateliê, com agendamento, não tem custo.
- Entrega em São Paulo capital e Grande SP é cotada por região. Envio nacional é apenas para itens
  não perecíveis; bolos e brigadeiros cremosos ficam restritos à entrega local.

## Prazos
- O ideal é encomendar com 15 dias de antecedência. Pedidos expressos de 5 a 7 dias dependem da
  agenda e têm taxa de urgência de 20%; abaixo de 5 dias, apenas se houver disponibilidade.

## Pagamento
- Pix, cartão de crédito em até 3x sem juros acima de R$500 e dinheiro na retirada. O sinal de 50%
  reserva a data; o saldo é pago até 2 dias antes.

## FAQ (respostas curtas — as do front hoje)
- **Qual o pedido mínimo?** R$300, fora a entrega. Docinhos têm mínimo de 50 unidades por sabor.
- **Fazem o tema que eu quiser?** Fazemos! Personalizamos por tema e cor; pode enviar foto de
  referência.
- **Como recebo o pedido?** Retirada agendada ou entrega em São Paulo e Grande SP. Itens secos
  também podem seguir por transportadora para outras regiões.

## Regras para o agente (não são conteúdo público)
- Se faltar um dado obrigatório do pedido (nome, contato, tipo, quantidade, data, tema, retirada),
  peça-o antes de registrar. Nunca invente preço/prazo: se não estiver aqui, diga que confirma no
  orçamento.
