// QA offline do Code node "Parse ata (JSON seguro)" do Demo 1.
// Prova os dois contratos REAIS ja observados no n8n:
// - execution 3646: JSON serializado em item.json.text;
// - execution 3650: objeto JSON ja parseado diretamente em item.json.
// Tambem cobre wrappers/fallbacks conhecidos sem mascarar contrato incompleto.
// Rodar: node tests/run_parse_ata.js  -> sai 0 se tudo passar, 1 se algo falhar.

// --- Funcao IDENTICA a do Code node (manter em sincronia) ---
function parseAta(itemJson) {
  const expectedKeys = ['resumo', 'decisoes', 'acoes', 'insight'];
  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

  const parseText = (value) => {
    if (typeof value !== 'string') return null;
    let s = value.trim();
    if (!s) return null;
    // Extrai o primeiro objeto { ... }, tolerando crases e texto em volta.
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) return null;
    s = s.slice(start, end + 1);
    try { return JSON.parse(s); }
    catch (e) { throw new Error('Falha no JSON.parse da ata: ' + e.message); }
  };

  const data = isObject(itemJson) ? itemJson : {};
  let obj = expectedKeys.some((key) => Object.prototype.hasOwnProperty.call(data, key)) ? data : null;

  if (!obj) {
    for (const candidate of [data.output, data.text, data.response]) {
      if (isObject(candidate)) { obj = candidate; break; }
      const parsed = parseText(candidate);
      if (parsed !== null) { obj = parsed; break; }
    }
  }

  if (!isObject(obj)) {
    const fields = Object.keys(data).join(', ') || '(sem campos)';
    throw new Error('Ata JSON ausente. Campos recebidos: ' + fields);
  }

  const missing = expectedKeys.filter((key) => !Object.prototype.hasOwnProperty.call(obj, key));
  if (missing.length) throw new Error('Contrato da ata incompleto. Campos ausentes: ' + missing.join(', '));

  const invalid = [];
  if (!Array.isArray(obj.resumo)) invalid.push('resumo deve ser array');
  if (!Array.isArray(obj.decisoes)) invalid.push('decisoes deve ser array');
  if (!Array.isArray(obj.acoes)) invalid.push('acoes deve ser array');
  if (typeof obj.insight !== 'string') invalid.push('insight deve ser string');
  if (invalid.length) throw new Error('Contrato da ata invalido: ' + invalid.join('; '));

  return {
    resumo: obj.resumo,
    decisoes: obj.decisoes,
    acoes: obj.acoes,
    insight: obj.insight
  };
}

const bloco = '{"resumo":["Engenharia em 80%."],"decisoes":["Feature freeze em 25/09/2026."],"acoes":["Carlos - corrigir login - 25/09/2026"],"insight":"Sugestao: antecipar testes de pagamento."}';

// Shape exato da execution 3650: as quatro chaves chegaram diretamente em item.json.
const objeto3650 = {
  resumo: [
    'A engenharia finalizou cerca de 80% das funcionalidades; a integração de pagamento e o painel de relatórios ainda estão pendentes.',
    'A integração de pagamento deve ser concluída até 20/09/2026, e o painel de relatórios uma semana depois.',
    'A campanha de marketing começa no dia 01/10/2026, portanto, é necessário ter uma versão estável antes disso.',
    'Foi acordado congelar novas funcionalidades no dia 25/09/2026 e dedicar a última semana para testes e correção de bugs.'
  ],
  decisoes: ['Congelar novas funcionalidades em 25/09/2026.'],
  acoes: [
    'Carlos — corrigir o login lento — Antes de 25/09/2026.',
    'Maria — finalizar o primeiro rascunho dos documentos de onboarding — Até 22/09/2026.',
    'Participante não identificado — preparar uma proposta para um contratado de testes — Até 14/09/2026.',
    'Participante não identificado — enviar as notas para todos — Prazo não informado.',
    'Participante não identificado — agendar um acompanhamento — Para a próxima segunda-feira.'
  ],
  insight: 'Sugestão: Considerar a alocação de recursos adicionais para garantir a conclusão da integração de pagamento e do painel de relatórios antes do início da campanha de marketing.'
};

// Casos reais e fallbacks aceitos.
const casos = [
  { nome: 'execution 3650 - objeto direto', raw: objeto3650 },
  { nome: 'execution 3646 - texto', raw: { text: bloco } },
  { nome: 'objeto em output', raw: { output: objeto3650 } },
  { nome: 'texto em output', raw: { output: bloco } },
  { nome: 'texto em response', raw: { response: bloco } },
  { nome: 'cerca ```json', raw: { text: '```json\n' + bloco + '\n```' } },
  { nome: 'texto antes e depois', raw: { text: 'Claro! Aqui esta a ata:\n' + bloco + '\nEspero ter ajudado.' } },
];

let falhas = 0;
for (const c of casos) {
  try {
    const out = parseAta(c.raw);
    const ok = Array.isArray(out.resumo) && Array.isArray(out.decisoes)
      && Array.isArray(out.acoes) && typeof out.insight === 'string';
    if (!ok) { throw new Error('shape invalido: ' + JSON.stringify(out)); }
    // assercao extra: no caso base, o resumo tem 1 item e o insight comeca com "Sugestao"
    if (c.nome === 'execution 3650 - objeto direto' && (out.resumo.length !== 4 || !out.insight.startsWith('Sugestão'))) {
      throw new Error('conteudo inesperado no caso base');
    }
    console.log('PASS -', c.nome, '->', JSON.stringify(out));
  } catch (e) {
    falhas++;
    console.error('FAIL -', c.nome, '->', e.message);
  }
}

// Casos negativos: falha visivel, sem converter ausencia/malformacao em arrays vazios.
try {
  parseAta({ text: 'desculpe, nao consegui gerar a ata' });
  falhas++;
  console.error('FAIL - sem json deveria lancar erro');
} catch (e) {
  console.log('PASS - sem json lanca erro (esperado):', e.message.slice(0, 40));
}

try {
  parseAta({ resumo: ['X.'], acoes: [], insight: 'Sugestao: W.' });
  falhas++;
  console.error('FAIL - contrato incompleto deveria lancar erro');
} catch (e) {
  console.log('PASS - contrato incompleto lanca erro (esperado):', e.message);
}

if (falhas > 0) { console.error('\nQA FALHOU:', falhas, 'caso(s).'); process.exit(1); }
console.log('\nQA OK: todos os casos passaram.');
