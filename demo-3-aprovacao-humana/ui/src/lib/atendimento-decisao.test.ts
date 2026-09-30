/** Purpose: prove the request body and the "open the next one" rule before any click reaches the server. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { montarPedido, proximoItemApos } from "./atendimento-decisao.ts";

const fila = [{ id: "10" }, { id: "11" }, { id: "12" }];

test("aprovar não leva texto nem motivo", () => {
  assert.deepEqual(montarPedido({ id: "7" }, "aprovar"), { id: "7", decisao: "aprovar" });
});

test("ajustar leva o texto da pessoa; recusar leva o motivo", () => {
  assert.deepEqual(montarPedido({ id: "7" }, "ajustar", { texto: "minha versão" }), {
    id: "7",
    decisao: "ajustar",
    texto_final: "minha versão",
  });
  assert.deepEqual(montarPedido({ id: "7" }, "recusar", { motivo: "prefiro ligar" }), {
    id: "7",
    decisao: "recusar",
    motivo: "prefiro ligar",
  });
});

test("depois de decidir, abre o seguinte da fila", () => {
  assert.equal(proximoItemApos(fila, "10"), "11");
  assert.equal(proximoItemApos(fila, "11"), "12");
});

test("se era o último, volta para o anterior; se a fila esvaziou, não abre nada", () => {
  assert.equal(proximoItemApos(fila, "12"), "11");
  assert.equal(proximoItemApos([{ id: "10" }], "10"), null);
});
