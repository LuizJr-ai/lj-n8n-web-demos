# Base de conhecimento — Alanna Doces Artesanais (RAG do Demo 2)

Purpose: fonte única do que o agente/FAQ pode responder (cardápio, políticas, prazos). É este
texto que será fatiado e indexado no pgvector para o RAG. **Rascunho:** itens marcados `⟨CONFIRMAR⟩`
dependem de dados reais da Alanna (preços, prazos). Nada de preço inventado entra no ar.

## Sobre
Alanna Lopes — doces artesanais sob encomenda para festas (casamento, aniversário infantil,
corporativo). Atende todo o Brasil (retirada combinada ou envio). Cada tema é personalizável.

## Produtos / cardápio
- Bem-casados, docinhos finos, bolos e mesa de doces por tema. ⟨CONFIRMAR lista completa + fotos⟩
- Personalização por tema e cor; aceita foto de referência (Pinterest/Instagram).

## Pedido mínimo e preços
- Fechamento por cento ou por unidade, dependendo do doce.
- Preço depende de tipo, quantidade, data e tema — informado no orçamento. ⟨CONFIRMAR tabela/faixas⟩

## Personalização
- Fazemos o tema que o cliente quiser (tema + cor). Envie foto de referência junto ao pedido.

## Entrega / retirada
- Retirada combinada ou envio; a melhor opção é confirmada pela região no orçamento.
- ⟨CONFIRMAR regiões de entrega e política de frete⟩

## Prazos
- Encomenda sob medida; recomenda-se antecedência. ⟨CONFIRMAR prazo mínimo por tipo de evento⟩

## Pagamento
- ⟨CONFIRMAR formas (Pix, cartão), sinal para reservar data, saldo na entrega⟩

## FAQ (respostas curtas — as do front hoje)
- **Qual o pedido mínimo?** Fechamos por cento ou por unidade, dependendo do doce. Diga a
  quantidade no orçamento que já te passamos o valor.
- **Fazem o tema que eu quiser?** Fazemos! Personalizamos por tema e cor; pode enviar foto de
  referência.
- **Como recebo o pedido?** Retirada combinada ou envio — confirme sua região no orçamento.

## Regras para o agente (não são conteúdo público)
- Se faltar um dado obrigatório do pedido (nome, contato, tipo, quantidade, data, tema, retirada),
  peça-o antes de registrar. Nunca invente preço/prazo: se não estiver aqui, diga que confirma no
  orçamento.
