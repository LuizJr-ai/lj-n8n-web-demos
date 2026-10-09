/** Purpose: prove the customer never sees an unapproved draft or an internal note. */
import assert from "node:assert/strict";
import test from "node:test";
import {
  PEDIDO_PUBLIC_KEYS,
  emailValido,
  frasePara,
  mapearPedido,
  type LinhaPedido,
} from "./acompanhamento-contract.ts";

// Linha 4 de `aprovacoes_pendentes`, copiada do Neon em 2026-09-29.
const pendente: LinhaPedido = {
  id: "4",
  assunto: "exchange",
  criado_em: "2026-09-29T00:43:37.661Z",
  status: "pendente",
  texto_final: null,
};

test("mensagem em análise não devolve resposta nenhuma", () => {
  const pedido = mapearPedido(pendente);

  assert.deepEqual(Object.keys(pedido), [...PEDIDO_PUBLIC_KEYS]);
  assert.equal(pedido.situacao, "em_analise");
  assert.equal(pedido.resposta, null);
  assert.equal(pedido.assunto, "Troca de produto");
});

test("rascunho da IA nunca vaza, mesmo se texto_final vier preenchido antes da hora", () => {
  const pedido = mapearPedido({ ...pendente, texto_final: "rascunho ainda não aprovado" });

  assert.equal(pedido.situacao, "em_analise");
  assert.equal(pedido.resposta, null);
});

test("só depois de aprovado o texto chega à cliente", () => {
  const aprovado = mapearPedido({
    ...pendente,
    status: "aprovado",
    texto_final: "Olá Marina, já separamos a troca.",
  });
  assert.equal(aprovado.situacao, "respondida");
  assert.equal(aprovado.resposta, "Olá Marina, já separamos a troca.");

  const ajustado = mapearPedido({
    ...pendente,
    status: "ajustado",
    texto_final: "Olá Marina, versão da atendente.",
  });
  assert.equal(ajustado.situacao, "respondida");
  assert.equal(ajustado.resposta, "Olá Marina, versão da atendente.");
});

test("recusado encerra sem expor o motivo interno", () => {
  const pedido = mapearPedido({ ...pendente, status: "recusado", texto_final: null });

  assert.equal(pedido.situacao, "encerrada");
  assert.equal(pedido.resposta, null);
  assert.equal("motivo_recusa" in pedido, false);
  assert.equal(/motivo/i.test(frasePara(pedido.situacao)), false);
});

test("assunto desconhecido vira rótulo neutro, nunca o código cru", () => {
  assert.equal(mapearPedido({ ...pendente, assunto: "refund_xyz" }).assunto, "Sua mensagem");
  assert.equal(mapearPedido({ ...pendente, assunto: null }).assunto, "Sua mensagem");
});

test("nenhuma frase ao cliente usa jargão técnico", () => {
  const proibidas = /workflow|execu[çc]|webhook|endpoint|gate|rascunho|IA|API/;
  for (const situacao of ["em_analise", "respondida", "encerrada"] as const) {
    assert.equal(proibidas.test(frasePara(situacao)), false, situacao);
  }
});

test("nenhuma frase promete prazo, canal ou contato que não existe", () => {
  // Achado da revisão do Codex (07/10/2026): a tela prometia "volte em alguns minutos" sem
  // haver prazo nenhum, e "vamos falar com você por outro caminho" sem haver outro caminho.
  // Promessa que o atendimento não cumpre é pior do que não dizer nada.
  const promessas = [
    /alguns minutos|em instantes|em breve|dentro de \d/i, // prazo inventado
    /outro caminho|entraremos em contato|vamos te ligar|telefone/i, // canal inexistente
    /voc[êe] receber[áa]|ser[áa] enviad/i, // envio garantido antes da decisão humana
  ];
  for (const situacao of ["em_analise", "respondida", "encerrada"] as const) {
    const frase = frasePara(situacao);
    for (const promessa of promessas) {
      assert.equal(promessa.test(frase), false, `${situacao}: "${frase}"`);
    }
  }
});

test("e-mail é conferido antes de ir ao banco", () => {
  assert.equal(emailValido("marina.alves@exemplo.com.br"), true);
  assert.equal(emailValido("marina@"), false);
  assert.equal(emailValido("  "), false);
  assert.equal(emailValido(42), false);
});
