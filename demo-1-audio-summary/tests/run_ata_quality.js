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
    const nomeLiteral = responsavel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${nomeLiteral}\\b`, 'i').test(resumo)) {
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

// Prova o cenário real da execução 3813: cinco ações, três decisões independentes
// e preservação de pessoas/equipes citadas na transcrição.
function avaliarCenario3813(ata) {
  const erros = avaliarAta(ata);
  if (erros.length) return erros;

  const acoes = ata.acoes.join(' ');
  const decisoes = ata.decisoes.join(' ');
  const resumo = ata.resumo.join(' ');

  if (ata.acoes.length !== 5) erros.push('exec 3813 deve conter exatamente 5 ações');
  if (!/Beatriz.*acompanhar|Acompanhar.*Beatriz/i.test(acoes)) erros.push('ação de Beatriz ausente');
  if (!/Capacitar.*— Treinamento —/i.test(acoes)) erros.push('equipe de Treinamento não preservada');
  if (!/Enviar.*— Luiz Martins —/i.test(acoes)) erros.push('primeira pessoa não associada a Luiz Martins');

  if (ata.decisoes.length !== 3) erros.push('exec 3813 deve conter exatamente 3 decisões independentes');
  if (!/turno da manhã/i.test(decisoes)) erros.push('decisão do turno da manhã ausente');
  if (!/canal antigo.*sete dias/i.test(decisoes)) erros.push('decisão de manter o canal antigo ausente');
  if (!/cinco minutos.*interromp|interromp.*cinco minutos/i.test(decisoes)) erros.push('regra de interrupção ausente');

  if (!/instável|instabilidade|tempo de resposta/i.test(resumo)) erros.push('risco operacional ausente do resumo');
  if (/monitorar.*resposta média|ponto de verificação.*lançamento/i.test(ata.insight)) {
    erros.push('insight repete a regra de interrupção já informada');
  }
  return erros;
}

// Prova o cenário real da execução 3897: pedido de definição ainda pendente é ação,
// não decisão, e não pode ser reciclado como sugestão.
function avaliarCenario3897(ata) {
  const erros = avaliarAta(ata);
  if (erros.length) return erros;

  const acoes = ata.acoes.join(' ');
  const decisoes = ata.decisoes.join(' ');

  if (ata.acoes.length !== 7) erros.push('exec 3897 deve conter exatamente 7 ações');
  if (!/Definir.*autorizar.*retomada.*— Responsável não identificado —/i.test(acoes)) {
    erros.push('pendência sobre autoridade de retomada não virou ação');
  }
  if (ata.decisoes.length !== 3) erros.push('exec 3897 deve conter exatamente 3 decisões');
  if (/definir quem.*autorizar.*retomada/i.test(decisoes)) {
    erros.push('pendência foi classificada incorretamente como decisão');
  }
  if (/definir|estabelecer.*autoriza.*retomada/i.test(ata.insight)) {
    erros.push('insight repete a pendência sobre autoridade de retomada');
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

// Saída real da execução 3813, mantida como regressão reproduzível.
const outputReal3813 = {
  resumo: [
    'O treinamento de 40 agentes foi concluído, com 8 agentes necessitando de reforço, e o lançamento do novo atendimento está previsto para quarta-feira.',
  ],
  decisoes: [
    'Lançar o novo atendimento no turno da manhã e manter o canal antigo por sete dias.',
  ],
  acoes: [
    'Realizar o teste de carga — Diego — Até segunda-feira, dia 14.',
    'Capacitar os oito agentes que precisam de reforço — Responsável não informado — Após o teste de carga.',
    'Enviar o comunicado aos gestores — Luiz Martins — Até segunda-feira, dia 14.',
    'Publicar o painel de incidentes — TI — Sem prazo definido.',
  ],
  insight: 'Sugestão: Monitorar a resposta média e estabelecer um ponto de verificação antes do lançamento para evitar interrupções.',
};

// Referência profissional que precisa passar depois da correção do prompt.
const referencia3813 = {
  resumo: [
    'Quarenta agentes estão aptos, mas a necessidade de reforço para oito deles e a instabilidade do chat antigo elevam o risco operacional.',
  ],
  decisoes: [
    'Lançar o novo atendimento primeiro no turno da manhã.',
    'Manter o canal antigo disponível por sete dias.',
    'Interromper o lançamento para revisão se a resposta média superar cinco minutos.',
  ],
  acoes: [
    'Realizar o teste de carga — Diego — Até segunda-feira, dia 14.',
    'Capacitar os oito agentes que precisam de reforço — Treinamento — Após o teste de carga.',
    'Acompanhar o primeiro turno — Beatriz — Na terça-feira.',
    'Enviar o comunicado aos gestores — Luiz Martins — Até segunda-feira, dia 14.',
    'Publicar o painel de incidentes — TI — Prazo não informado.',
  ],
  insight: 'Sugestão: Definir quem autoriza a retomada após uma eventual interrupção do lançamento.',
};

// Saída real da execução 3897, preservada para provar a regressão observada.
const outputReal3897 = {
  resumo: [
    'De 200 produtos cadastrados, 18 apresentam divergência entre o estoque físico e o sistema, representando o principal risco para a transferência do estoque.',
  ],
  decisoes: [
    'Iniciar o piloto somente em Campinas.',
    'Manter a operação antiga por cinco dias.',
    'Interromper a migração caso a taxa de erro ultrapasse 2%.',
    'Definir quem poderá autorizar a retomada caso a migração seja interrompida.',
  ],
  acoes: [
    'Atualizar o inventário — Carla — Até terça-feira.',
    'Negociar com a transportadora a nova janela de coleta — Marcos — Após a atualização do inventário.',
    'Validar o orçamento — Equipe financeira — Até sexta-feira.',
    'Configurar a integração — Equipe de TI — Antes do piloto.',
    'Testar 20 pedidos — Operações — Após a configuração da integração.',
    'Enviar o cronograma completo a todos — Responsável não identificado — Até amanhã.',
  ],
  insight: 'Sugestão: Estabelecer um critério claro para a autorização de retomada da migração após uma interrupção.',
};

const referencia3897 = {
  resumo: [
    'De 200 produtos cadastrados, 18 apresentam divergência entre o estoque físico e o sistema, representando o principal risco para a transferência do estoque.',
  ],
  decisoes: [
    'Iniciar o piloto somente em Campinas.',
    'Manter a operação antiga por cinco dias.',
    'Interromper a migração caso a taxa de erro ultrapasse 2%.',
  ],
  acoes: [
    'Atualizar o inventário — Carla — Até terça-feira.',
    'Negociar com a transportadora a nova janela de coleta — Marcos — Após a atualização do inventário.',
    'Validar o orçamento — Equipe financeira — Até sexta-feira.',
    'Configurar a integração — Equipe de TI — Antes do piloto.',
    'Testar 20 pedidos — Operações — Após a configuração da integração.',
    'Enviar o cronograma completo a todos — Responsável não identificado — Até amanhã.',
    'Definir quem poderá autorizar a retomada da migração — Responsável não identificado — Prazo não informado.',
  ],
  insight: 'Sugestão: Usar a conciliação entre estoque físico e sistema como critério de liberação do piloto.',
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

const erros3813 = avaliarCenario3813(outputReal3813);
if (erros3813.length === 0) {
  console.error('FAIL - execution 3813 deveria ser reprovada pelo gate semantico');
  process.exit(1);
}
console.log('PASS - execution 3813 reprovada pelos motivos esperados:');
for (const erro of erros3813) console.log('  -', erro);

const errosReferencia3813 = avaliarCenario3813(referencia3813);
if (errosReferencia3813.length) {
  console.error('FAIL - referencia 3813 foi reprovada:', errosReferencia3813);
  process.exit(1);
}
console.log('PASS - referencia 3813 aprovada pelo gate semantico.');

const erros3897 = avaliarCenario3897(outputReal3897);
if (erros3897.length === 0) {
  console.error('FAIL - execution 3897 deveria ser reprovada pelo gate semantico');
  process.exit(1);
}
console.log('PASS - execution 3897 reprovada pelos motivos esperados:');
for (const erro of erros3897) console.log('  -', erro);

const errosReferencia3897 = avaliarCenario3897(referencia3897);
if (errosReferencia3897.length) {
  console.error('FAIL - referencia 3897 foi reprovada:', errosReferencia3897);
  process.exit(1);
}
console.log('PASS - referencia 3897 aprovada pelo gate semantico.');
console.log('\nQA SEMANTICO OFFLINE OK.');
