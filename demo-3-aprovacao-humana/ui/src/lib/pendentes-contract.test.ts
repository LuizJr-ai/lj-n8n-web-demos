/** Purpose: prove the public mapping against a real database row. */
import assert from "node:assert/strict";
import test from "node:test";
import { PENDENTE_PUBLIC_KEYS, mapearPendente, type LinhaPendente } from "./pendentes-contract.ts";

// Linha 4 de `aprovacoes_pendentes`, copiada do Neon em 2026-09-29 — nunca inventada.
const linhaReal: LinhaPendente = {
  id: "4",
  remetente_nome: "Marina Alves",
  assunto: "exchange",
  urgencia: 2,
  resumo: "Você deseja trocar um produto com defeito que comprou na semana passada.",
  mensagem_cliente:
    "Comprei na semana passada e o produto chegou com defeito. Quero trocar, como faco?",
  rascunho_ia:
    "Olá Marina,\n\nSinto muito em saber que o produto chegou com defeito. Para realizar a troca, por favor, entre em contato com nosso atendimento ao cliente pelo telefone ou e-mail, informando o número do seu pedido e descrevendo o problema. Assim, poderemos te ajudar da melhor forma possível.\n\nAguardo seu retorno para resolvermos isso rapidamente!",
  criado_em: "2026-09-29T00:43:37.661Z",
};

test("mapeia somente o contrato público e nunca expõe resume_url", () => {
  const resultado = mapearPendente(linhaReal, new Date("2026-09-29T01:13:37.661Z"));

  assert.deepEqual(Object.keys(resultado), [...PENDENTE_PUBLIC_KEYS]);
  assert.equal(resultado.esperando_ha_min, 30);
  assert.equal(resultado.resumo, linhaReal.resumo);
  assert.equal("resume_url" in resultado, false);
});

test("entrega a mensagem original do cliente, distinta do resumo", () => {
  const resultado = mapearPendente(linhaReal, new Date("2026-09-29T01:13:37.661Z"));

  assert.equal(resultado.mensagem_cliente, linhaReal.mensagem_cliente);
  assert.notEqual(resultado.mensagem_cliente, resultado.resumo);
});

test("recusa linha incompleta em vez de inventar conteúdo", () => {
  assert.throws(
    () => mapearPendente({ ...linhaReal, resumo: null }),
    /sem resumo/,
  );
  assert.throws(
    () => mapearPendente({ ...linhaReal, mensagem_cliente: null }),
    /sem mensagem do cliente/,
  );
});
