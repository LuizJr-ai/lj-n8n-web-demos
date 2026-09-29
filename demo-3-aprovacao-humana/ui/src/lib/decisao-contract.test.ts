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
  for (const opcao of ["aprovar", "ajustar", "recusar"] as const) {
    assert.equal(proibidas.test(mensagemDeConfirmacao(opcao)), false, opcao);
  }
});
