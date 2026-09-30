/** Purpose: what the reviewer screen needs to send a decision and move on — no React, testable. */
import type { PendentePublico } from "./pendentes-contract";

export type EscolhaDecisao = "aprovar" | "ajustar" | "recusar";

export type PedidoDecisao = {
  id: string;
  decisao: EscolhaDecisao;
  texto_final?: string;
  motivo?: string;
};

export type RespostaDecisao = { ok: boolean; mensagem: string };

/** Mensagem única para quando a resposta do servidor não traz texto algum. */
const SEM_RESPOSTA = "Não conseguimos concluir agora. Tente de novo em instantes.";

/**
 * Monta exatamente o corpo que `POST /api/decisao` valida. O texto só acompanha
 * a escolha "enviar a minha versão"; o motivo, só a de "não enviar".
 */
export function montarPedido(
  item: Pick<PendentePublico, "id">,
  decisao: EscolhaDecisao,
  campos: { texto?: string; motivo?: string } = {},
): PedidoDecisao {
  const pedido: PedidoDecisao = { id: item.id, decisao };
  if (decisao === "ajustar") pedido.texto_final = campos.texto ?? "";
  if (decisao === "recusar") pedido.motivo = campos.motivo ?? "";
  return pedido;
}

/**
 * Qual caso abrir depois que um foi decidido: o seguinte na fila; se era o último,
 * o anterior; se a fila esvaziou, nenhum.
 */
export function proximoItemApos(
  itens: ReadonlyArray<Pick<PendentePublico, "id">>,
  idDecidido: string,
): string | null {
  const posicao = itens.findIndex((item) => item.id === idDecidido);
  const restantes = itens.filter((item) => item.id !== idDecidido);
  if (restantes.length === 0) return null;
  if (posicao < 0) return restantes[0]!.id;
  return (restantes[posicao] ?? restantes[restantes.length - 1]!).id;
}

/**
 * Chama o servidor da decisão. Sucesso e erro voltam no mesmo formato, porque a tela
 * mostra a frase que veio do servidor nos dois casos — nunca um código.
 */
export async function enviarDecisao(pedido: PedidoDecisao): Promise<RespostaDecisao> {
  let resposta: Response;
  try {
    resposta = await fetch("/api/decisao", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(pedido),
    });
  } catch {
    // Sem rede não há frase do servidor para mostrar: essa é a única que a tela escreve.
    return { ok: false, mensagem: "Sem conexão agora. Verifique a internet e tente de novo." };
  }

  const corpo = (await resposta.json().catch(() => null)) as { mensagem?: unknown } | null;
  const mensagem = typeof corpo?.mensagem === "string" && corpo.mensagem.trim().length > 0
    ? corpo.mensagem
    : SEM_RESPOSTA;

  return { ok: resposta.ok, mensagem };
}
