/**
 * Purpose: shape what the customer is allowed to see about their own message.
 *
 * The rule this file exists to enforce: an unapproved draft is NOT an answer. Until a person
 * approves it, the customer sees that it is being reviewed — never `rascunho_ia`. The refusal
 * note is an internal record and never reaches the customer either.
 */

export type Situacao = "em_analise" | "respondida" | "encerrada";

export type PedidoPublico = {
  id: string;
  assunto: string;
  enviado_em: string;
  situacao: Situacao;
  /** Only ever present when a person approved the text. */
  resposta: string | null;
};

export type LinhaPedido = {
  id: string | number;
  assunto: string | null;
  criado_em: string | Date;
  status: string;
  texto_final: string | null;
};

export const PEDIDO_PUBLIC_KEYS = [
  "id",
  "assunto",
  "enviado_em",
  "situacao",
  "resposta",
] as const satisfies ReadonlyArray<keyof PedidoPublico>;

const ASSUNTO_LEGIVEL: Record<string, string> = {
  exchange: "Troca de produto",
  billing: "Cobrança",
  delivery: "Entrega",
  other: "Outro assunto",
};

export function emailValido(valor: unknown): valor is string {
  return typeof valor === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

export function mapearPedido(linha: LinhaPedido): PedidoPublico {
  const enviadoEm = new Date(linha.criado_em);
  if (Number.isNaN(enviadoEm.getTime())) throw new Error("Pedido sem data válida.");

  const decidida = linha.status === "aprovado" || linha.status === "ajustado";
  const resposta = decidida ? linha.texto_final?.trim() || null : null;

  let situacao: Situacao = "em_analise";
  if (resposta) situacao = "respondida";
  else if (linha.status === "recusado") situacao = "encerrada";

  const chave = linha.assunto?.trim().toLowerCase() ?? "";
  return {
    id: String(linha.id),
    assunto: ASSUNTO_LEGIVEL[chave] ?? "Sua mensagem",
    enviado_em: enviadoEm.toISOString(),
    situacao,
    resposta,
  };
}

/** The sentence the customer reads. No jargon, no internal note, no error code. */
export function frasePara(situacao: Situacao): string {
  if (situacao === "respondida") return "Um atendente revisou e aprovou esta resposta.";
  if (situacao === "encerrada") {
    return "Vamos falar com você por outro caminho. Nenhuma resposta automática foi enviada.";
  }
  return "Um atendente está revisando a resposta. Volte aqui em alguns minutos.";
}
