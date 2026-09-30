// Purpose: the only way the reviewer screen can act on an item. Nothing here echoes the resume URL.
import { createFileRoute } from "@tanstack/react-router";
import { DecisaoInvalida, validarDecisao } from "../../lib/decisao-contract";
import { aplicarDecisao } from "../../lib/decisao.server";

export const Route = createFileRoute("/api/decisao")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const corpo = await request.json().catch(() => ({}));
          const decisao = validarDecisao(corpo);
          const { mensagem } = await aplicarDecisao(decisao);
          return Response.json({ mensagem });
        } catch (error) {
          if (error instanceof DecisaoInvalida) {
            return Response.json({ mensagem: error.message }, { status: error.status });
          }
          console.error(error);
          return Response.json(
            { mensagem: "Não conseguimos concluir agora. Tente de novo em instantes." },
            { status: 500 },
          );
        }
      },
    },
  },
});
