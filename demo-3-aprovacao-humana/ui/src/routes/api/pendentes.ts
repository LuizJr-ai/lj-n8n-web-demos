// Purpose: expose the sanitized pending queue to the future reviewer screen.
import { createFileRoute } from "@tanstack/react-router";
import { listarPendentes } from "../../lib/pendentes.server";

export const Route = createFileRoute("/api/pendentes")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return Response.json(await listarPendentes());
        } catch (error) {
          console.error(error);
          return Response.json(
            { mensagem: "Não conseguimos carregar as mensagens agora. Tente novamente em instantes." },
            { status: 503 },
          );
        }
      },
    },
  },
});
