/** Purpose: map a database row to the only pending-item fields allowed in the browser. */
export type PendentePublico = {
  id: string;
  cliente_nome: string;
  assunto: string;
  urgencia: 1 | 2 | 3;
  resumo: string;
  mensagem_cliente: string;
  rascunho: string;
  esperando_ha_min: number;
};

export type LinhaPendente = {
  id: string | number;
  remetente_nome: string;
  assunto: string | null;
  urgencia: number | null;
  resumo: string | null;
  mensagem_cliente: string | null;
  rascunho_ia: string | null;
  criado_em: string | Date;
};

export const PENDENTE_PUBLIC_KEYS = [
  "id",
  "cliente_nome",
  "assunto",
  "urgencia",
  "resumo",
  "mensagem_cliente",
  "rascunho",
  "esperando_ha_min",
] as const satisfies ReadonlyArray<keyof PendentePublico>;

function textoObrigatorio(valor: string | null, campo: string): string {
  const texto = valor?.trim();
  if (!texto) throw new Error(`Linha pendente sem ${campo}.`);
  return texto;
}

export function mapearPendente(linha: LinhaPendente, agora = new Date()): PendentePublico {
  const criadoEm = new Date(linha.criado_em);
  if (Number.isNaN(criadoEm.getTime())) throw new Error("Linha pendente sem data válida.");
  if (linha.urgencia !== 1 && linha.urgencia !== 2 && linha.urgencia !== 3) {
    throw new Error("Linha pendente sem urgência válida.");
  }

  return {
    id: String(linha.id),
    cliente_nome: textoObrigatorio(linha.remetente_nome, "nome do cliente"),
    assunto: textoObrigatorio(linha.assunto, "assunto"),
    urgencia: linha.urgencia,
    resumo: textoObrigatorio(linha.resumo, "resumo"),
    mensagem_cliente: textoObrigatorio(linha.mensagem_cliente, "mensagem do cliente"),
    rascunho: textoObrigatorio(linha.rascunho_ia, "rascunho"),
    esperando_ha_min: Math.max(0, Math.floor((agora.getTime() - criadoEm.getTime()) / 60_000)),
  };
}
