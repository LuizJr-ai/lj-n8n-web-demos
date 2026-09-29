/** Purpose: resume the frozen run for one item. The resume address never leaves this file. */
import { neon } from "@neondatabase/serverless";
import {
  DecisaoInvalida,
  mensagemDeConfirmacao,
  montarCorpoRetomada,
  type DecisaoValida,
} from "./decisao-contract";

/** Header the `Wait for approval` node checks. Its value is the shared secret, never the URL. */
const CABECALHO_RETOMADA = "X-Demo3-Resume";

type LinhaDecisao = { resume_url: string | null; status: string };

export async function aplicarDecisao(decisao: DecisaoValida): Promise<{ mensagem: string }> {
  const databaseUrl = process.env["DATABASE_URL"];
  const segredo = process.env["RESUME_SECRET"];
  if (!databaseUrl) throw new DecisaoInvalida("Serviço indisponível no momento.", 503);
  if (!segredo) throw new DecisaoInvalida("Serviço indisponível no momento.", 503);

  const sql = neon(databaseUrl);

  // D2: o endereço de retomada é buscado aqui, pelo id. O navegador nunca o envia nem o recebe.
  const linhas = (await sql`
    SELECT resume_url, status
    FROM public.aprovacoes_pendentes
    WHERE id = ${decisao.id}::bigint
  `) as LinhaDecisao[];

  const linha = linhas[0];
  if (!linha) {
    throw new DecisaoInvalida("Essa mensagem não está mais na lista.", 404);
  }

  // D4: item já decidido não decide de novo — duas abas abertas não podem enviar duas vezes.
  if (linha.status !== "pendente") {
    throw new DecisaoInvalida("Alguém já respondeu essa mensagem.", 409);
  }
  if (!linha.resume_url) {
    throw new DecisaoInvalida("Essa mensagem ficou sem o passo de aprovação. Avise o time.", 409);
  }

  // D3: a retomada vai assinada; o segredo fica no servidor.
  let resposta: Response;
  try {
    resposta = await fetch(linha.resume_url, {
      method: "POST",
      headers: { "Content-Type": "application/json", [CABECALHO_RETOMADA]: segredo },
      body: JSON.stringify(montarCorpoRetomada(decisao)),
    });
  } catch {
    throw new DecisaoInvalida("Não conseguimos concluir agora. Tente de novo em instantes.", 502);
  }

  if (!resposta.ok) {
    // O código cru fica no log do servidor; a pessoa lê uma frase de atendimento.
    console.error(`Retomada recusada para o item ${decisao.id}: HTTP ${resposta.status}`);
    throw new DecisaoInvalida("Não conseguimos concluir agora. Tente de novo em instantes.", 502);
  }

  return { mensagem: mensagemDeConfirmacao(decisao.decisao) };
}
