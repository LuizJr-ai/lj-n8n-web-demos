/** Purpose: read back the customer's own messages, never the private columns. */
import { neon } from "@neondatabase/serverless";
import { mapearPedido, type LinhaPedido, type PedidoPublico } from "./acompanhamento-contract";

export async function listarPedidosDe(email: string): Promise<PedidoPublico[]> {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("DATABASE_URL não configurada.");

  const sql = neon(databaseUrl);
  // `resume_url`, `rascunho_ia`, `motivo_recusa` e `decidido_por` ficam fora do SELECT de propósito.
  const linhas = (await sql`
    SELECT id, assunto, criado_em, status, texto_final
    FROM public.aprovacoes_pendentes
    WHERE lower(remetente_email) = lower(${email.trim()})
    ORDER BY criado_em DESC
    LIMIT 10
  `) as LinhaPedido[];

  return linhas.map(mapearPedido);
}
