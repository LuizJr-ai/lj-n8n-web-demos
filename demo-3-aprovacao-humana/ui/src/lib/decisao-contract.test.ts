/** Purpose: prove the decision rules offline, before any run is resumed for real. */
import assert from "node:assert/strict";
import test from "node:test";
import {
  DecisaoInvalida,
  mensagemDeConfirmacao,
  montarCorpoRetomada,
  validarDecisao,
} from "./decisao-contract.ts";

test("aprovar não carrega texto nem motivo", () => {
  const decisao = validarDecisao({ id: "4", decisao: "aprovar" });

  assert.equal(decisao.texto_final, null);
  assert.equal(decisao.motivo, null);
  assert.equal(decisao.decidido_por, "atendimento");
  assert.deepEqual(montarCorpoRetomada(decisao), {
    decision: "approved",
    decidedBy: "atendimento",
  });
});

test("ajustar leva o texto da pessoa, nunca o rascunho", () => {
  const decisao = validarDecisao({
    id: 4,
    decisao: "ajustar",
    texto_final: "  Olá Marina, já separamos a troca.  ",
    decidido_por: "luiz",
  });

  assert.deepEqual(montarCorpoRetomada(decisao), {
    decision: "adjusted",
    decidedBy: "luiz",
    editedText: "Olá Marina, já separamos a troca.",
  });
});

test("recusar leva o motivo", () => {
  const decisao = validarDecisao({ id: "5", decisao: "recusar", motivo: "Caso já resolvido." });

  assert.deepEqual(montarCorpoRetomada(decisao), {
    decision: "rejected",
    decidedBy: "atendimento",
    rejectReason: "Caso já resolvido.",
  });
});

test("ajustar sem texto é recusado com frase de atendimento", () => {
  assert.throws(
    () => validarDecisao({ id: "4", decisao: "ajustar", texto_final: "   " }),
    (erro: unknown) =>
      erro instanceof DecisaoInvalida &&
      erro.status === 400 &&
      erro.message === "Escreva a sua versão da resposta antes de enviar.",
  );
});

test("recusar sem motivo é recusado — o banco também exige", () => {
  assert.throws(
    () => validarDecisao({ id: "4", decisao: "recusar" }),
    /motivo de não enviar/,
  );
});

test("id inventado e opção desconhecida não passam", () => {
  assert.throws(() => validarDecisao({ id: "../4", decisao: "aprovar" }), /Não reconhecemos/);
  assert.throws(() => validarDecisao({ id: "4", decisao: "apagar" }), /três opções/);
});

test("nenhuma mensagem de confirmação vaza jargão técnico", () => {
  const proibidas = /workflow|execu[çc]|webhook|endpoint|gate|status|api/i;
  const cliente = { nome: "Marina Alves", email: "marina@exemplo.com" };
  for (const opcao of ["aprovar", "ajustar", "recusar"] as const) {
    assert.equal(proibidas.test(mensagemDeConfirmacao(opcao)), false, opcao);
    assert.equal(proibidas.test(mensagemDeConfirmacao(opcao, cliente)), false, `${opcao} com cliente`);
  }
});

test("a confirmação diz para quem, para qual e-mail e a que horas", () => {
  const cliente = { nome: "Marina Alves", email: "marina@exemplo.com" };
  const agora = new Date("2026-09-29T13:32:00Z"); // 10:32 em São Paulo

  assert.equal(
    mensagemDeConfirmacao("aprovar", cliente, agora),
    "Resposta aprovada às 10:32. O e-mail para Marina Alves (marina@exemplo.com) foi liberado para envio.",
  );
  assert.equal(
    mensagemDeConfirmacao("ajustar", cliente, agora),
    "Sua versão foi aprovada às 10:32. O e-mail para Marina Alves (marina@exemplo.com) foi liberado para envio.",
  );
  assert.equal(
    mensagemDeConfirmacao("recusar", cliente, agora),
    "Nada foi enviado para Marina Alves. O motivo ficou registrado às 10:32.",
  );
});

test("a confirmação nunca afirma que o e-mail já foi entregue", () => {
  const cliente = { nome: "Marina Alves", email: "marina@exemplo.com" };
  for (const opcao of ["aprovar", "ajustar"] as const) {
    assert.doesNotMatch(mensagemDeConfirmacao(opcao, cliente), /enviad[ao] para|foi enviad/i, opcao);
  }
});
