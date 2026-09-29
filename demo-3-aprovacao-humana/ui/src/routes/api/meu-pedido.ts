// Purpose: let the customer look up their own messages. The e-mail travels in the body, never in the URL.
import { createFileRoute } from "@tanstack/react-router";
import { emailValido } from "../../lib/acompanhamento-contract";
import { listarPedidosDe } from "../../lib/acompanhamento.server";

export const Route = createFileRoute("/api/meu-pedido")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const corpo = (await request.json().catch(() => ({}))) as { email?: unknown };
          if (!emailValido(corpo.email)) {
            return Response.json(
              { mensagem: "Confira o e-mail que você digitou." },
              { status: 400 },
            );
          }
          return Response.json({ pedidos: await listarPedidosDe(corpo.email) });
        } catch (error) {
          console.error(error);
          return Response.json(
            { mensagem: "Não conseguimos consultar agora. Tente novamente em instantes." },
            { status: 503 },
          );
        }
      },
    },
  },
});
