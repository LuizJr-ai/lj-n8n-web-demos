/** Purpose: read pending approvals from Neon without selecting the private resume URL. */
import { neon } from "@neondatabase/serverless";
import { mapearPendente, type LinhaPendente, type PendentePublico } from "./pendentes-contract";

export async function listarPendentes(): Promise<PendentePublico[]> {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("DATABASE_URL não configurada.");

  const sql = neon(databaseUrl);
  const linhas = await sql`
    SELECT id, remetente_nome, assunto, urgencia, resumo, mensagem_cliente, rascunho_ia, criado_em
    FROM public.aprovacoes_pendentes
    WHERE status = 'pendente'
    ORDER BY urgencia DESC NULLS LAST, criado_em ASC
  ` as LinhaPendente[];

  const agora = new Date();
  return linhas.map((linha) => mapearPendente(linha, agora));
}
