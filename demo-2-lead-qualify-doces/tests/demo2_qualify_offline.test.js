// tests/demo2_qualify_offline.test.js
// QA OFFLINE do motor do Demo 2 (lead de doces) — Estágio 2 da SKILL n8n-build-first-time-right.
// Replica EXATAMENTE a lógica de dois nós que carregam risco, contra o JSON real do contrato R8:
//   (1) sanitização do nó "Normalize Lead Fields" (Set) — tira HTML, apara espaços;
//   (2) blindagem do nó "Validate & Guard Output" (Code) — fallback tier:'review' se a IA falhar.
// Roda sem n8n: `node tests/demo2_qualify_offline.test.js`. Sai !=0 se qualquer asserção falhar.

const assert = require('assert');

// ---- Amostra REAL do contrato R8 (o que o front POSTa ao webhook, em $json.body) ----
const bodyHot = {
  nome: 'Marina <b>Costa</b>',
  contato: '(11) 98888-7777',
  tipo: 'Doces finos para casamento',
  quantidade: '300 bem-casados',
  data: '2026-10-18',
  tema: 'Rústico com flores brancas',
  retirada: 'Entrega em Pinheiros, SP',
  mensagem: 'Preciso fechar essa semana, orçamento aprovado.'
};

// ---- (1) Sanitização: mesma regra do Set (replace de tags + trim) ----
// Comentário: o front é defesa 1; aqui é a defesa 2 (R8 dupla). Nunca confiar só no cliente.
function sanitize(v) {
  return (v ?? '').toString().replace(/<[^>]*>/g, '').trim();
}
const normalized = {
  nome: sanitize(bodyHot.nome),
  contato: sanitize(bodyHot.contato),
  tipo: sanitize(bodyHot.tipo),
  quantidade: sanitize(bodyHot.quantidade),
  data: sanitize(bodyHot.data),
  tema: sanitize(bodyHot.tema),
  retirada: sanitize(bodyHot.retirada),
  mensagem: sanitize(bodyHot.mensagem)
};
assert.strictEqual(normalized.nome, 'Marina Costa', 'sanitize deve remover <b> do nome');
assert.ok(!/[<>]/.test(JSON.stringify(normalized)), 'nenhum campo pode conter < ou > após sanitize');

// ---- (2) Blindagem: mesma regra do Code "Validate & Guard Output" ----
// Comentário: a IA pode vir malformada (parser quebra, campo faltando). O motor NUNCA pode
// mandar score/tier quebrado à UI nem ao banco (R11). Sem saída válida => tier 'review'.
function guard(leadJson, agentOutput) {
  const out = agentOutput;
  const valid =
    out &&
    typeof out.reasoning === 'string' && out.reasoning.trim().length > 0 &&
    typeof out.score === 'number' && Number.isFinite(out.score) &&
    out.score >= 0 && out.score <= 100 &&
    ['hot', 'warm', 'cold'].includes(out.tier) &&
    typeof out.resumo === 'string' && out.resumo.trim().length > 0;
  const q = valid
    ? { reasoning: out.reasoning, score: out.score, tier: out.tier, resumo: out.resumo }
    : { reasoning: '[REVISAR] IA indisponivel ou saida invalida', score: null, tier: 'review', resumo: '[REVISAR] conferir manualmente' };
  return { ...leadJson, ...q };
}

// 2a. Saída válida da IA (lead quente) -> passa limpa
const okAgent = { reasoning: "Cliente diz 'orçamento aprovado' e 'fechar essa semana': intenção alta e prazo curto.", score: 88, tier: 'hot', resumo: '300 bem-casados, casamento 18/10, tema rústico, entrega Pinheiros. Fechar esta semana.' };
const g1 = guard(normalized, okAgent);
assert.strictEqual(g1.tier, 'hot');
assert.strictEqual(g1.score, 88);
assert.strictEqual(g1.nome, 'Marina Costa', 'guard preserva os campos do lead');
assert.ok(g1.resumo.length > 0, 'resumo do dono presente');

// 2b. IA malformada (score fora da faixa) -> fallback review
const badScore = { reasoning: 'x', score: 250, tier: 'hot', resumo: 'y' };
assert.strictEqual(guard(normalized, badScore).tier, 'review', 'score>100 deve cair em review');

// 2c. IA ausente (Agent falhou/continue) -> fallback review, score null
const g3 = guard(normalized, undefined);
assert.strictEqual(g3.tier, 'review');
assert.strictEqual(g3.score, null, 'sem IA o score vai NULL (coluna nullable no Neon)');

// 2d. tier inválido -> review
assert.strictEqual(guard(normalized, { reasoning: 'a', score: 50, tier: 'quente', resumo: 'b' }).tier, 'review');

// 2e. resumo vazio -> review (a IA precisa entregar o resumo do dono)
assert.strictEqual(guard(normalized, { reasoning: 'a', score: 50, tier: 'warm', resumo: '   ' }).tier, 'review');

console.log('OK — demo2 offline: sanitize (2 asserts) + guard (6 casos) verdes.');
