/** Purpose: validate a reviewer decision and shape the resume payload, with no I/O. */

export type DecisaoEntrada = {
  id?: unknown;
  decisao?: unknown;
  texto_final?: unknown;
  motivo?: unknown;
  decidido_por?: unknown;
};

export type DecisaoValida = {
  id: string;
  decisao: "aprovar" | "ajustar" | "recusar";
  texto_final: string | null;
  motivo: string | null;
  decidido_por: string;
};

/** The body the n8n `Wait for approval` node expects when the run is resumed. */
export type CorpoRetomada = {
  decision: "approved" | "adjusted" | "rejected";
  decidedBy: string;
  editedText?: string;
  rejectReason?: string;
};

export class DecisaoInvalida extends Error {
  readonly status: number;
  constructor(mensagem: string, status = 400) {
    super(mensagem);
    this.name = "DecisaoInvalida";
    this.status = status;
  }
}

const DECISOES = ["aprovar", "ajustar", "recusar"] as const;

const PARA_O_FLUXO: Record<DecisaoValida["decisao"], CorpoRetomada["decision"]> = {
  aprovar: "approved",
  ajustar: "adjusted",
  recusar: "rejected",
};

function texto(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo.length > 0 ? limpo : null;
}

/**
 * Reads whatever the browser sent and either returns a decision we trust, or throws
 * with a message the reviewer can act on. Nothing here talks to the network.
 */
export function validarDecisao(entrada: DecisaoEntrada): DecisaoValida {
  const id = texto(entrada.id) ?? (typeof entrada.id === "number" ? String(entrada.id) : null);
  if (!id || !/^\d+$/.test(id)) {
    throw new DecisaoInvalida("Não reconhecemos essa mensagem. Atualize a lista e tente de novo.");
  }

  const decisao = texto(entrada.decisao);
  if (!decisao || !(DECISOES as readonly string[]).includes(decisao)) {
    throw new DecisaoInvalida("Escolha uma das três opções antes de continuar.");
  }

  const textoFinal = texto(entrada.texto_final);
  const motivo = texto(entrada.motivo);

  if (decisao === "ajustar" && !textoFinal) {
    throw new DecisaoInvalida("Escreva a sua versão da resposta antes de enviar.");
  }
  if (decisao === "recusar" && !motivo) {
    throw new DecisaoInvalida("Diga o motivo de não enviar. Isso fica registrado.");
  }

  return {
    id,
    decisao: decisao as DecisaoValida["decisao"],
    texto_final: decisao === "ajustar" ? textoFinal : null,
    motivo: decisao === "recusar" ? motivo : null,
    decidido_por: texto(entrada.decidido_por) ?? "atendimento",
  };
}

/** Builds exactly the body the flow reads in `$json.body`. */
export function montarCorpoRetomada(decisao: DecisaoValida): CorpoRetomada {
  const corpo: CorpoRetomada = {
    decision: PARA_O_FLUXO[decisao.decisao],
    decidedBy: decisao.decidido_por,
  };
  if (decisao.texto_final) corpo.editedText = decisao.texto_final;
  if (decisao.motivo) corpo.rejectReason = decisao.motivo;
  return corpo;
}

/** What the reviewer sees after a decision goes through. Never echoes the resume address. */
export function mensagemDeConfirmacao(decisao: DecisaoValida["decisao"]): string {
  if (decisao === "aprovar") return "Resposta enviada para a cliente.";
  if (decisao === "ajustar") return "Sua versão foi enviada para a cliente.";
  return "Nada foi enviado. O motivo ficou registrado.";
}
