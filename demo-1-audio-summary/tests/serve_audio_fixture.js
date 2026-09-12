// Serve uma única fixture de áudio com CORS para o teste automatizado do microfone.
// Uso: bun tests/serve_audio_fixture.js <arquivo.wav> [porta]

const filePath = process.argv[2];
const port = Number(process.argv[3] || 8081);

if (!filePath) {
  throw new Error('Informe o caminho da fixture WAV.');
}

const audio = Bun.file(filePath);
if (!(await audio.exists())) {
  throw new Error(`Fixture não encontrada: ${filePath}`);
}

Bun.serve({
  hostname: '127.0.0.1',
  port,
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      return new Response(
        '<!doctype html><html lang="pt-BR"><body><h1>QA — mini reunião</h1><audio controls src="/audio.wav"></audio></body></html>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
      );
    }
    if (url.pathname !== '/audio.wav') {
      return new Response('Not found', { status: 404 });
    }

    return new Response(audio, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Content-Type': 'audio/wav',
      },
    });
  },
});

console.log(`Fixture disponível em http://127.0.0.1:${port}/audio.wav`);
