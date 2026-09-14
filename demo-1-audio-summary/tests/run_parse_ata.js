// QA offline do Code node "Parse ata (JSON seguro)" do Demo 1.
// Prova os dois contratos REAIS ja observados no n8n:
// - execution 3646: JSON serializado em item.json.text;
// - execution 3650: objeto JSON ja parseado diretamente em item.json.
// Tambem cobre wrappers/fallbacks conhecidos sem mascarar contrato incompleto.
// Rodar: node tests/run_parse_ata.js  -> sai 0 se tudo passar, 1 se algo falhar.

// Converte uma data explicita ou falada para a referencia usada na conferencia do calendario.
function obterDataReferencia(meetingDate, transcript, fallbackDate = new Date()) {
  const meses = {
    janeiro: 0, fevereiro: 1, marco: 2, março: 2, abril: 3, maio: 4, junho: 5,
    julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
  };

  const explicita = String(meetingDate || '').match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  const falada = String(transcript || '').match(
    /\b(?:dia\s+)?(\d{1,2})\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})\b/i,
  );

  let day;
  let month;
  let year;
  if (explicita) {
    [, day, month, year] = explicita;
    month = Number(month) - 1;
  } else if (falada) {
    [, day] = falada;
    month = meses[falada[2].toLowerCase()];
    year = falada[3];
  } else {
    return new Date(Date.UTC(fallbackDate.getUTCFullYear(), fallbackDate.getUTCMonth(), fallbackDate.getUTCDate()));
  }

  const reference = new Date(Date.UTC(Number(year), Number(month), Number(day)));
  if (reference.getUTCFullYear() !== Number(year) || reference.getUTCMonth() !== Number(month)
    || reference.getUTCDate() !== Number(day)) return null;
  return reference;
}

// Marca combinacoes impossiveis de dia da semana + dia do mes sem inventar uma data substituta.
function normalizarPrazosContraditorios(acoes, referenceDate) {
  if (!(referenceDate instanceof Date) || Number.isNaN(referenceDate.getTime())) return acoes;

  const weekdays = {
    domingo: 0, segunda: 1, 'segunda-feira': 1, terca: 2, terça: 2, 'terca-feira': 2,
    'terça-feira': 2, quarta: 3, 'quarta-feira': 3, quinta: 4, 'quinta-feira': 4,
    sexta: 5, 'sexta-feira': 5, sabado: 6, sábado: 6,
  };
  const pattern = /\b(domingo|segunda(?:-feira)?|ter[cç]a(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|s[aá]bado)\b\s*,?\s*(?:dia\s+)?(\d{1,2})\b/i;

  return acoes.map((acao) => {
    const parts = String(acao).split(' — ');
    if (parts.length !== 3 || /prazo amb[ií]guo/i.test(parts[2])) return acao;

    const match = parts[2].match(pattern);
    if (!match) return acao;

    const key = match[1].toLowerCase();
    const expectedWeekday = weekdays[key];
    const candidate = new Date(Date.UTC(
      referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), Number(match[2]),
    ));
    if (expectedWeekday === undefined || candidate.getUTCMonth() !== referenceDate.getUTCMonth()
      || candidate.getUTCDay() === expectedWeekday) return acao;

    const literal = match[0].replace(/[.,;:]+$/, '');
    parts[2] = `Prazo ambíguo na transcrição: "${literal}".`;
    return parts.join(' — ');
  });
}

// Corrige o rótulo do papel sem inventar a identidade que o áudio não informou.
function normalizarResponsavelNaoIdentificado(acoes) {
  return acoes.map((acao) => String(acao)
    .replace(/\bParticipante não identificado\b/gi, 'Responsável não identificado')
    .replace(/\bResponsável não definido\b/gi, 'Responsável não informado'));
}

// --- Funcao IDENTICA a do Code node (manter em sincronia) ---
function parseAta(itemJson, context = {}) {
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

  // Aceita o contrato novo estruturado e conserva o contrato legado em strings.
  // O modelo extrai campos; este parser monta a frase exibida pela interface.
  const formatarAcoes = obj.acoes.map((acao, index) => {
    if (typeof acao === 'string') return acao;
    if (!isObject(acao)) throw new Error(`Ação ${index + 1} deve ser string ou objeto`);

    const tarefa = String(acao.tarefa || '').trim();
    let responsavel = String(acao.responsavel || '').trim();
    const prazo = String(acao.prazo_condicao || '').trim();
    if (!tarefa) throw new Error(`Ação ${index + 1} sem tarefa`);
    if (!responsavel || /^eu$/i.test(responsavel)) responsavel = 'Responsável não identificado';
    if (/^respons[aá]vel não definido$/i.test(responsavel)) responsavel = 'Responsável não informado';

    const texto = tarefa.charAt(0).toUpperCase() + tarefa.slice(1);
    return `${texto} — ${responsavel} — ${prazo || 'Prazo não informado'}`;
  });

  // Confere prazos contra a data da reuniao depois que o contrato JSON foi validado.
  const referenceDate = obterDataReferencia(context.meetingDate, context.transcript, context.fallbackDate);
  const acoesComPrazoSeguro = normalizarPrazosContraditorios(formatarAcoes, referenceDate);

  // Padroniza o responsável ausente depois das validações, sem alterar nomes informados.
  return {
    resumo: obj.resumo,
    decisoes: obj.decisoes,
    acoes: normalizarResponsavelNaoIdentificado(acoesComPrazoSeguro),
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

// Reproduz a execution 3806: o LLM preservou o prazo contraditorio, mas nao o marcou.
const execution3806 = {
  resumo: ['A engenharia concluiu 80% do portal.'],
  decisoes: [],
  acoes: ['Concluir a integração de pagamento — Responsável não informado — Até sexta-feira, dia 20.'],
  insight: 'Sugestão: Estabelecer um ponto de verificação antes da campanha.',
};
const transcript3806 = 'Hoje é sábado, dia 12 de setembro de 2026. Precisamos concluir até sexta-feira, dia 20.';

// Saída estruturada real da bancada QA: o parser deve produzir o contrato que a UI já consome.
const estruturadaV4 = {
  resumo: ['A engenharia concluiu cerca de oitenta por cento das funcionalidades.'],
  decisoes: ['congelar novas funcionalidades no dia vinte e cinco'],
  acoes: [
    { tarefa: 'concluir a integração de pagamento', responsavel: 'Responsável não definido', prazo_condicao: 'até sexta-feira, dia 20' },
    { tarefa: 'enviar as notas da reunião', responsavel: 'eu', prazo_condicao: 'sem prazo definido' },
  ],
  insight: 'Sugestão: Implementar um controle de estabilidade antes da campanha.',
};

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
    if (out.acoes.some((acao) => /Participante não identificado/i.test(acao))) {
      throw new Error('rotulo antigo de responsavel permaneceu na saida');
    }
    console.log('PASS -', c.nome, '->', JSON.stringify(out));
  } catch (e) {
    falhas++;
    console.error('FAIL -', c.nome, '->', e.message);
  }
}

// Prova que 20/09/2026 e domingo e que o texto vira ambiguidade sem calcular outro prazo.
try {
  const out = parseAta(execution3806, { transcript: transcript3806 });
  if (!/Prazo ambíguo na transcrição: "sexta-feira, dia 20"/i.test(out.acoes[0])) {
    throw new Error('prazo contraditorio nao foi marcado');
  }
  console.log('PASS - execution 3806 -> prazo contraditorio marcado deterministicamente');
} catch (e) {
  falhas++;
  console.error('FAIL - execution 3806 ->', e.message);
}

// Prova que uma combinacao correta permanece intacta.
try {
  const correto = { ...execution3806, acoes: ['Concluir a tarefa — Ana — Até domingo, dia 20.'] };
  const out = parseAta(correto, { meetingDate: '12/09/2026' });
  if (out.acoes[0] !== correto.acoes[0]) throw new Error('prazo correto foi alterado');
  console.log('PASS - prazo coerente permanece inalterado');
} catch (e) {
  falhas++;
  console.error('FAIL - prazo coerente ->', e.message);
}

// Prova a ponte entre o JSON estruturado e o contrato de strings da interface.
try {
  const out = parseAta(estruturadaV4, { transcript: transcript3806 });
  if (!/Prazo ambíguo na transcrição: "sexta-feira, dia 20"/i.test(out.acoes[0])) {
    throw new Error('prazo estruturado contraditório não foi marcado');
  }
  if (!/Responsável não identificado/.test(out.acoes[1])) {
    throw new Error('pronome de primeira pessoa não foi normalizado');
  }
  console.log('PASS - contrato estruturado convertido para a interface');
} catch (e) {
  falhas++;
  console.error('FAIL - contrato estruturado ->', e.message);
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
