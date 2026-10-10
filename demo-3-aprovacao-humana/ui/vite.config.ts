// Purpose: use the same TanStack Start and Vite integration as Demo 1, and load this demo's
// configuration from the machine's secret store instead of from a file inside the repository.
//
// Why it is done here, and not with a `.env` file: the real values (database connection, resume
// secret) must never sit inside the project folder, where a tool or an agent could read them.
// They live in a `.secrets` folder kept beside the repository, outside every working directory a
// tool is pointed at. The lines below read that file into this process's memory when the dev server
// starts — nothing is copied, and nothing is written to disk. The repository holds the PATH, never
// the values, and the path is relative, so it carries no machine layout of its own.
//
// Reading it here is what makes it reach both halves of the app: the Vite wrapper publishes every
// `VITE_*` variable it finds in this process to the browser, and the server routes read the
// non-public ones straight from `process.env`.
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const aquiDentro = dirname(fileURLToPath(import.meta.url));

// Tried in order. The secret store comes first so that where it exists the values are always the
// ones outside the repository; `.env.local` is the fallback for anyone who clones the demo from
// GitHub and follows the README, since they keep no secret store beside it.
//
// The store is addressed relative to this file — three levels up is the folder that holds the
// repository, so `<parent of repo>/.secrets/n8n_web_demos/demo3-app.env`. Set DEMO3_ENV_FILE to
// put it anywhere else.
const LOJA_DE_SEGREDOS = resolve(aquiDentro, "../../..", ".secrets/n8n_web_demos/demo3-app.env");

const CANDIDATOS = [
  process.env["DEMO3_ENV_FILE"],
  LOJA_DE_SEGREDOS,
  resolve(aquiDentro, ".env.local"),
].filter((caminho): caminho is string => typeof caminho === "string" && caminho.length > 0);

const ARQUIVO_DE_CONFIG = CANDIDATOS.find((caminho) => existsSync(caminho));

const OBRIGATORIAS = ["DATABASE_URL", "VITE_DEMO3_WEBHOOK_URL", "RESUME_SECRET"] as const;
// A placeholder copied from `.env.example` breaks the app exactly like a missing key, and is far
// harder to notice, so it is rejected the same way.
const EXEMPLO = /YOUR-N8N-HOST|YOUR_SHARED_SECRET|USER:PASSWORD/;

function pararCom(motivo: string): never {
  // Fail at startup with the reason in plain words. The previous failure mode was the opposite:
  // the server started happily and the customer page blamed the person's internet connection.
  throw new Error(
    `\n\n  Demo 3 não pode subir: ${motivo}\n` +
      `  Procurei nesta ordem:\n` +
      CANDIDATOS.map((caminho) => `    - ${caminho}\n`).join("") +
      `  Esse arquivo guarda o endereço do fluxo no n8n, a conexão do banco e a chave de\n` +
      `  retomada. Aponte outro caminho com a variável de ambiente DEMO3_ENV_FILE.\n`,
  );
}

if (!ARQUIVO_DE_CONFIG) pararCom("nenhum arquivo de configuração foi encontrado");

for (const linha of readFileSync(ARQUIVO_DE_CONFIG, "utf8").split(/\r?\n/)) {
  const par = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(linha);
  if (!par || linha.trimStart().startsWith("#")) continue;
  const [, chave, bruto] = par;
  if (!chave || bruto === undefined) continue;
  // Accept `CHAVE="valor"` and `CHAVE='valor'` as well as the bare form.
  // Anything already set in the real environment wins, so a one-off override still works.
  process.env[chave] ??= bruto.trim().replace(/^(["'])(.*)\1$/, "$2");
}

const faltando = OBRIGATORIAS.filter((chave) => {
  const valor = process.env[chave];
  return !valor || EXEMPLO.test(valor);
});
if (faltando.length > 0) pararCom(`${faltando.join(", ")} está faltando ou ainda é um exemplo`);

export default defineConfig({});
