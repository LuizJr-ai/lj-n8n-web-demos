// Teste OFFLINE da identidade do envio. Roda com `npm test` dentro de ui/.
//
// O que prova: um reenvio do MESMO envio carrega o mesmo id; um envio novo carrega outro.
// É essa regra que faz o servidor reconhecer a repetição em vez de abrir um segundo caso.

import assert from "node:assert/strict";
import test from "node:test";
import { idParaTentativa, novoRequestId } from "./request-id.ts";

test("cria um id quando não há tentativa em andamento", () => {
  const id = idParaTentativa(null);
  assert.equal(typeof id, "string");
  assert.ok(id.length > 0, "id vazio não identifica envio nenhum");
});

test("a retentativa do mesmo envio reaproveita o id", () => {
  // É o caso que gerava duplicata: a resposta se perde, a pessoa clica de novo.
  const primeiro = idParaTentativa(null);
  const segundo = idParaTentativa(primeiro);
  assert.equal(segundo, primeiro);
});

test("envios diferentes recebem ids diferentes", () => {
  // Depois do envio confirmado o formulário zera a referência; a próxima mensagem é outro caso.
  const envioA = idParaTentativa(null);
  const envioB = idParaTentativa(null);
  assert.notEqual(envioA, envioB);
});

test("dois ids gerados em sequência nunca colidem", () => {
  const ids = new Set(Array.from({ length: 500 }, () => novoRequestId()));
  assert.equal(ids.size, 500, "houve colisão: dois envios distintos virariam um só caso");
});
