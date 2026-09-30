// Purpose: close the loop — the customer reads the answer a person approved, never the draft.
import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { frasePara, type PedidoPublico } from "../lib/acompanhamento-contract";
import "../styles-acompanhar.css";

export const Route = createFileRoute("/acompanhar")({ component: FollowUpPage });

const CHAVE_EMAIL = "demo3:email";

type Estado = "idle" | "buscando" | "pronto" | "erro";

const ROTULO: Record<PedidoPublico["situacao"], string> = {
  em_analise: "Em análise",
  respondida: "Respondida",
  encerrada: "Encerrada",
};

function dataLegivel(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FollowUpPage() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [pedidos, setPedidos] = useState<PedidoPublico[]>([]);
  const [aviso, setAviso] = useState("");

  // Lembra o e-mail de quem acabou de escrever, para ela não digitar de novo.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_EMAIL);
      if (salvo) setEmail(salvo);
    } catch {
      /* navegador sem armazenamento: a pessoa digita o e-mail, e está tudo bem */
    }
  }, []);

  async function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEstado("buscando");
    setAviso("");

    try {
      // O e-mail vai no corpo do pedido, nunca no endereço da página.
      const resposta = await fetch("/api/meu-pedido", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const dados = (await resposta.json()) as { pedidos?: PedidoPublico[]; mensagem?: string };

      if (!resposta.ok) {
        setAviso(dados.mensagem ?? "Não conseguimos consultar agora. Tente novamente em instantes.");
        setEstado("erro");
        return;
      }

      try {
        window.localStorage.setItem(CHAVE_EMAIL, email.trim());
      } catch {
        /* sem armazenamento, seguimos normalmente */
      }

      setPedidos(dados.pedidos ?? []);
      setEstado("pronto");
    } catch {
      setAviso("Não conseguimos consultar agora. Confira sua conexão e tente novamente.");
      setEstado("erro");
    }
  }

  return (
    <main className="customer-page">
      <section className="customer-card" aria-labelledby="acompanhar-title">
        <div className="eyebrow">
          <span aria-hidden="true">●</span> Central de atendimento
        </div>
        <h1 id="acompanhar-title">Acompanhe sua mensagem</h1>
        <p className="intro">
          Informe o e-mail que você usou ao escrever para nós. Toda resposta passa pela conferência
          de um atendente antes de chegar até você.
        </p>

        <form onSubmit={buscar} className="acompanhar-form">
          <label>
            <span>Seu e-mail</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              required
            />
          </label>
          <button className="submit-button" type="submit" disabled={estado === "buscando"}>
            {estado === "buscando" ? "Procurando..." : "Ver minha resposta"}
          </button>
        </form>

        {estado === "erro" && (
          <p className="feedback error" role="alert">
            {aviso}
          </p>
        )}

        {estado === "pronto" && pedidos.length === 0 && (
          <p className="feedback success" role="status">
            Não encontramos nenhuma mensagem com esse e-mail. Confira se digitou o mesmo endereço
            que usou ao escrever para nós.
          </p>
        )}

        {pedidos.length > 0 && (
          <ul className="acompanhar-lista">
            {pedidos.map((pedido) => (
              <li className="pedido-card" key={pedido.id}>
                <div className="pedido-topo">
                  <h2 className="pedido-assunto">{pedido.assunto}</h2>
                  <span className={`selo ${pedido.situacao}`}>{ROTULO[pedido.situacao]}</span>
                  <span className="pedido-data">Enviada em {dataLegivel(pedido.enviado_em)}</span>
                </div>
                <p className="pedido-frase">{frasePara(pedido.situacao)}</p>
                {pedido.resposta && <p className="pedido-resposta">{pedido.resposta}</p>}
              </li>
            ))}
          </ul>
        )}

        <Link to="/" className="voltar">
          ← Escrever uma nova mensagem
        </Link>
      </section>
    </main>
  );
}
