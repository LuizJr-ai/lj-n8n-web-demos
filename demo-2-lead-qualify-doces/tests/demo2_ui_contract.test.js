// QA OFFLINE da interface do Demo 2.
// Protege o contrato público: marca fictícia consistente, configuração local obrigatória e
// respostas do webhook tratadas como texto, nunca como HTML injetável.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'ui', 'index.html'), 'utf8');
const config = fs.readFileSync(path.join(__dirname, '..', 'ui', 'config.example.js'), 'utf8');

assert.match(html, /<title>Doce Aurora — Peça seu orçamento<\/title>/);
assert.match(html, /🧁 Doce Aurora · sob encomenda/);
assert.ok(!html.includes(['Ala', 'nna'].join('')), 'a página não pode expor o antigo nome do negócio');
assert.match(html, /result\.replaceChildren\(\)/, 'a resposta do orçamento deve limpar nós antigos');
assert.match(html, /text\.textContent = resumo \|\|/, 'a mensagem do servidor deve ser texto');
assert.doesNotMatch(html, /result\.innerHTML/, 'a resposta do servidor não pode ser inserida como HTML');
assert.ok(
  html.indexOf('if(!WEBHOOK_URL)') < html.indexOf('fetch(WEBHOOK_URL'),
  'o orçamento deve falhar localmente antes de qualquer POST sem configuração',
);
assert.ok(
  html.indexOf('if(!CHAT_URL)') < html.indexOf('fetch(CHAT_URL'),
  'o chat deve falhar localmente antes de qualquer POST sem configuração',
);
assert.match(config, /https:\/\/SEU_HOST_N8N\/webhook\/demo2-lead-doces/);
assert.match(config, /https:\/\/SEU_HOST_N8N\/webhook\/demo2-chat/);

console.log('OK — demo2 UI contract: branding, safe rendering and configuration guards are green.');
