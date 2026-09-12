// QA semantico offline da ata executiva do Demo 1.
// Nao chama LLM, webhook nem banco. Compara o output real reprovado (execution 3651)
// com uma referencia que satisfaz o contrato profissional definido para o app.
// Rodar: node tests/run_ata_quality.js [resultado-real.json]

const fs = require('node:fs');

function avaliarAta(ata, fixture = false) {
  const erros = [];
  const chaves = ['resumo', 'decisoes', 'acoes', 'insight'];

  for (const chave of chaves) {
    if (!Object.prototype.hasOwnProperty.call(ata, chave)) erros.push(`campo ausente: ${chave}`);
  }
  if (!Array.isArray(ata.resumo)) erros.push('resumo deve ser array');
  if (!Array.isArray(ata.decisoes)) erros.push('decisoes deve ser array');
  if (!Array.isArray(ata.acoes)) erros.push('acoes deve ser array');
  if (typeof ata.insight !== 'string' || !ata.insight.startsWith('Sugestão: ')) {
    erros.push('insight deve começar com "Sugestão: "');
  }
  if (erros.length) return erros;

  if (ata.resumo.length < 1 || ata.resumo.length > 4) {
    erros.push('resumo deve ter de 1 a 4 itens curtos');
  }

  for (const [indice, acao] of ata.acoes.entries()) {
    const partes = acao.split(' — ');
    if (partes.length !== 3 || partes.some((parte) => !parte.trim())) {
      erros.push(`acao[${indice}] deve seguir "Ação — Responsável — Prazo ou condição"`);
    }
  }

  const resumo = ata.resumo.join(' ').toLowerCase();
  const decisoes = ata.decisoes.map((item) => item.toLowerCase());
  for (const decisao of decisoes) {
    if (resumo.includes(decisao.replace(/[.]$/, ''))) erros.push('decisão repetida no resumo');
  }

  const responsaveis = ata.acoes
    .map((acao) => acao.split(' — ')[1])
    .filter(Boolean)
    .filter((nome) => !/não informado|não identificado/i.test(nome));
  for (const responsavel of responsaveis) {
    if (resumo.includes(responsavel.toLowerCase())) {
      erros.push(`responsável operacional repetido no resumo: ${responsavel}`);
    }
  }

  if (fixture) {
    const acoes = ata.acoes.join(' ').toLowerCase();
    const cobertura = [
      ['integração de pagamento', /integração de pagamento/],
      ['dashboard', /dashboard|painel de relatórios/],
      ['Carlos/login', /carlos.*login|login.*carlos/],
      [
        'Maria/onboarding',
        /maria.*(?:onboarding|integração de novos clientes)|(?:onboarding|integração de novos clientes).*maria/,
      ],
      ['Suporte/revisão', /suporte.*revis|revis.*suporte/],
      ['proposta/testes', /proposta.*test|test.*proposta/],
      ['envio das notas', /enviar.*notas/],
      ['follow-up', /agendar.*follow-up|agendar.*acompanhamento/],
    ];
    for (const [rotulo, expressao] of cobertura) {
      if (!expressao.test(acoes)) erros.push(`ação ausente: ${rotulo}`);
    }

    if (ata.acoes.length !== 8) erros.push('fixture deve conter exatamente 8 ações atômicas');
    if (ata.decisoes.length !== 2) erros.push('fixture deve conter exatamente 2 decisões atômicas');

    const integracao = ata.acoes.find((acao) => /integração de pagamento/i.test(acao)) || '';
    if (!/prazo ambíguo/i.test(integracao)) {
      erros.push('contradição "sexta-feira, dia 20" não foi marcada como prazo ambíguo');
    }

    const dashboard = ata.acoes.find((acao) => /dashboard|painel de relatórios/i.test(acao)) || '';
    if (/até uma semana/i.test(dashboard)) {
      erros.push('modalidade alterada: "uma semana depois" virou "até uma semana depois"');
    }

    const notas = ata.acoes.find((acao) => /enviar.*notas/i.test(acao)) || '';
    if (!/todos/i.test(notas)) erros.push('escopo omitido: notas devem ser enviadas a todos');

    if (/priorizar.*integração de pagamento/i.test(ata.insight)) {
      erros.push('insight apenas repete/prioriza uma ação já registrada');
    }

    if (/carlos|maria|suporte|follow-up|dia 22|20\/09|27\/09|11\/09/.test(resumo)) {
      erros.push('resumo contém detalhe operacional da fixture');
    }
    if (/20\/09\/2026|27\/09\/2026|11\/09\/2026/.test(acoes)) {
      erros.push('prazo relativo/ambíguo foi convertido indevidamente na fixture');
    }
  }

  return erros;
}

if (process.argv[2]) {
  const arquivo = process.argv[2];
  const ata = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const erros = avaliarAta(ata, true);
  if (erros.length) {
    console.error(`REPROVADO - ${arquivo}:`);
    for (const erro of erros) console.error('  -', erro);
    process.exit(1);
  }
  console.log(`APROVADO - ${arquivo}`);
  process.exit(0);
}

const outputReal3651 = {
  resumo: [
    'A engenharia finalizou cerca de 80% das funcionalidades.',
    'A integração de pagamento e o dashboard de relatórios estão pendentes.',
    'A campanha de marketing começa no dia 1 do próximo mês, exigindo uma build estável antes disso.',
    'Carlos irá corrigir o login lento antes do congelamento.',
    'Maria finalizará o primeiro rascunho dos documentos de onboarding até o dia 22.',
  ],
  decisoes: [
    'Congelar novas funcionalidades em 25/09/2026.',
    'Dedicar a última semana a testes e correção de bugs.',
  ],
  acoes: [
    'Responsável não informado — concluir a integração de pagamento — 20/09/2026.',
    'Responsável não informado — concluir o dashboard — 27/09/2026.',
    'Participante não identificado — preparar uma proposta para um contratado de testes — 11/09/2026.',
    'Participante não identificado — enviar as notas — Prazo não informado.',
    'Participante não identificado — agendar o follow-up — 11/09/2026.',
  ],
  insight: 'Sugestão: Priorizar a finalização da integração de pagamento para garantir a estabilidade antes da campanha de marketing.',
};

const outputReal3652 = {
  resumo: [
    'A engenharia concluiu cerca de 80% das funcionalidades, com a integração de pagamento e o dashboard de relatórios ainda pendentes.',
    'A campanha de marketing começará no dia 1 do próximo mês, exigindo uma versão estável antes disso.',
  ],
  decisoes: [
    'Congelar novas funcionalidades no dia 25 e dedicar a última semana para testes e correção de bugs.',
  ],
  acoes: [
    'Concluir a integração de pagamento — Responsável não informado — Até sexta-feira, dia 20.',
    'Finalizar o dashboard de relatórios — Responsável não informado — Até uma semana após a integração de pagamento.',
    'Finalizar o primeiro rascunho dos documentos de onboarding — Maria — Até o dia 22.',
    'Revisar os documentos de onboarding — Suporte — Após a finalização do rascunho.',
    'Preparar uma proposta para um contratado de testes — Participante não identificado — Até quarta-feira.',
    'Enviar as notas da reunião — Participante não identificado — Prazo não informado.',
    'Agendar um follow-up — Participante não identificado — Para a próxima segunda-feira.',
  ],
  insight: 'Sugestão: Priorizar a conclusão da integração de pagamento para garantir a estabilidade antes do início da campanha de marketing.',
};

const referenciaProfissional = {
  resumo: [
    'A engenharia concluiu cerca de 80% das funcionalidades, com a integração de pagamento e o dashboard de relatórios ainda pendentes.',
    'A estabilidade da versão antes do início da campanha de marketing é o principal marco do ciclo.',
  ],
  decisoes: [
    'Congelar novas funcionalidades no dia 25.',
    'Dedicar a última semana a testes e correção de bugs.',
  ],
  acoes: [
    'Concluir a integração de pagamento — Responsável não informado — Prazo ambíguo na transcrição: "Friday the 20th".',
    'Concluir o dashboard de relatórios — Responsável não informado — Uma semana após a integração de pagamento.',
    'Corrigir a lentidão no login — Carlos — Antes do congelamento de funcionalidades.',
    'Finalizar o primeiro rascunho dos documentos de onboarding — Maria — Até o dia 22.',
    'Revisar os documentos de onboarding — Suporte — Após a finalização do primeiro rascunho.',
    'Preparar uma proposta para contratação de apoio em testes — Participante não identificado — Até quarta-feira.',
    'Enviar as notas da reunião a todos — Participante não identificado — Prazo não informado.',
    'Agendar o follow-up — Participante não identificado — Próxima segunda-feira.',
  ],
  insight: 'Sugestão: Confirmar o prazo da integração de pagamento, pois ele condiciona o dashboard e a estabilidade necessária antes da campanha.',
};

const erros3651 = avaliarAta(outputReal3651, true);
if (erros3651.length === 0) {
  console.error('FAIL - execution 3651 deveria ser reprovada pelo gate semantico');
  process.exit(1);
}
console.log('PASS - execution 3651 reprovada pelos motivos esperados:');
for (const erro of erros3651) console.log('  -', erro);

const erros3652 = avaliarAta(outputReal3652, true);
if (erros3652.length === 0) {
  console.error('FAIL - execution 3652 deveria ser reprovada pelo gate semantico');
  process.exit(1);
}
console.log('PASS - execution 3652 reprovada pelos motivos esperados:');
for (const erro of erros3652) console.log('  -', erro);

const errosReferencia = avaliarAta(referenciaProfissional, true);
if (errosReferencia.length) {
  console.error('FAIL - referencia profissional foi reprovada:', errosReferencia);
  process.exit(1);
}
console.log('PASS - referencia profissional aprovada pelo gate semantico.');
console.log('\nQA SEMANTICO OFFLINE OK.');
