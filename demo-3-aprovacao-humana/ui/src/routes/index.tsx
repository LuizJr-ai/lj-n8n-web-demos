// Purpose: let a customer create a real case for human-reviewed support.
import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useRef, useState } from "react";
import { idParaTentativa } from "../lib/request-id";

export const Route = createFileRoute("/")({ component: CustomerMessagePage });

// Modelos de mensagem, não frases soltas. Cada um já pede o que o atendimento precisaria
// perguntar depois — número do pedido, produto, motivo e prazo — porque é essa ida e volta
// que atrasa a resposta. O que está entre colchetes é o que a pessoa troca pelos dados dela.
const examples = [
  {
    label: "Troca ou devolução",
    message: [
      "Gostaria de solicitar a troca de um produto.",
      "",
      "Pedido nº: [número do pedido]",
      "Produto: [nome do produto]",
      "Motivo: [chegou com defeito / tamanho ou modelo errado / não era o que eu esperava]",
      "Prefiro: [trocar pelo mesmo item / trocar por outro / receber o valor de volta]",
    ].join("\n"),
  },
  {
    label: "Cobrança",
    message: [
      "Preciso de um esclarecimento sobre uma cobrança.",
      "",
      "Pedido ou fatura nº: [número]",
      "Valor cobrado: R$ [valor]",
      "Data da cobrança: [dd/mm]",
      "O que não confere: [cobrança repetida / valor diferente do combinado / não reconheço a compra]",
    ].join("\n"),
  },
  {
    label: "Entrega atrasada",
    message: [
      "Meu pedido ainda não chegou.",
      "",
      "Pedido nº: [número do pedido]",
      "Data prevista de entrega: [dd/mm]",
      "Endereço: [cidade e bairro]",
      "Preciso receber até: [dd/mm, se houver uma data importante]",
    ].join("\n"),
  },
] as const;

// "misconfigured" exists so a setup problem never wears the clothes of a network problem. Telling
// a visitor to "check your connection" when the app has no address to call sends them chasing a
// fault on their side that is not there — and hides the real one from whoever has to fix it.
type SubmitState = "idle" | "sending" | "success" | "error" | "misconfigured";

function CustomerMessagePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  // The address the answer will go to, kept for the confirmation after the form is cleared.
  const [sentTo, setSentTo] = useState("");
  // Identity of the submission in progress. It survives a failed attempt on purpose: a retry
  // has to carry the SAME id, so the server recognises it instead of opening a second case.
  const requestIdRef = useRef<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const webhookUrl = import.meta.env["VITE_DEMO3_WEBHOOK_URL"] as string | undefined;

    if (!webhookUrl || webhookUrl.includes("YOUR-N8N-HOST")) {
      console.error(
        "VITE_DEMO3_WEBHOOK_URL ausente. O servidor deveria ter recusado subir: ver ui/vite.config.ts.",
      );
      setSubmitState("misconfigured");
      return;
    }

    setSubmitState("sending");
    // Reuses the id of the attempt that failed; creates one only when there is none.
    const requestId = idParaTentativa(requestIdRef.current);
    requestIdRef.current = requestId;
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origem: "site-contato",
          request_id: requestId,
          remetente: { nome: name.trim(), email: email.trim() },
          mensagem: message.trim(),
          recebido_em: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      setSentTo(email.trim());
      setSubmitState("success");
      setMessage("");
      // Stored for good: the next message the person writes is a new case, with a new id.
      requestIdRef.current = null;
    } catch (error) {
      console.error(error);
      setSubmitState("error");
    }
  }

  return (
    <main className="customer-page">
      <section className="customer-card" aria-labelledby="page-title">
        {/* A porta da equipe fica no alto, à direita, rotulada como restrita — onde uma pessoa
            procura a conta dela, e não no rodapé, onde parecia mais uma opção de atendimento.
            Em produção ela sairia da página do cliente: endereço separado, atrás de login. */}
        <div className="topo-cartao">
          <div className="eyebrow"><span aria-hidden="true">●</span> Central de atendimento</div>
          <Link to="/atendimento" className="acesso-equipe">
            <span aria-hidden="true">🔒</span> Área restrita
          </Link>
        </div>
        <h1 id="page-title">Como podemos ajudar?</h1>
        <p className="intro">
          Conte o que aconteceu. Quanto mais completo, mais rápido conseguimos resolver.
        </p>

        {/* Depois de enviar, o formulário sai de cena. Não é só para a página caber em uma tela:
            quem acabou de escrever não tem mais nada a preencher, e deixar os campos ali ao lado
            da confirmação convida a mandar a mesma mensagem duas vezes. */}
        {submitState === "success" ? (
          <>
            <div className="feedback success" role="status">
              <strong>Recebemos sua mensagem.</strong>
              <span>
                Um atendente vai analisar o seu caso. Se houver uma resposta a enviar, ela vai
                para o e-mail <b>{sentTo}</b>.
              </span>
              <Link to="/acompanhar">Ver o andamento da sua mensagem</Link>
            </div>
            <button
              type="button"
              className="botao-voltar-ao-formulario"
              onClick={() => setSubmitState("idle")}
            >
              Escrever outra mensagem
            </button>
          </>
        ) : (
          <>
        <div className="examples" aria-labelledby="examples-title">
          <p id="examples-title">
            Escolha o assunto para começar com um modelo pronto, ou escreva com suas palavras.
            Depois é só trocar o que está [entre colchetes] pelos seus dados.
          </p>
          <div className="example-grid">
            {examples.map((example) => (
              <button
                type="button"
                className="example-button"
                key={example.label}
                onClick={() => {
                  setMessage(example.message);
                  setSubmitState("idle");
                  // Leva a pessoa direto para o texto: o modelo só serve se ela editar.
                  messageRef.current?.focus();
                }}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="field-row">
            <label>
              <span>Seu nome</span>
              <input
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Seu e-mail</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
          </div>

          <label className="campo-mensagem">
            <span>Sua mensagem</span>
            <textarea
              ref={messageRef}
              name="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escreva aqui o que você precisa..."
              required
            />
          </label>

          <button className="submit-button" type="submit" disabled={submitState === "sending"}>
            {submitState === "sending" ? "Enviando..." : "Enviar mensagem"}
          </button>

          {/* Logo abaixo da ação principal, onde quem volta depois procura — e não no rodapé,
              solto, com uma pergunta no meio do caminho. */}
          <Link to="/acompanhar" className="link-acompanhar">
            {/* Envelope com um visto: o mesmo desenho diz "mensagem" e "já enviada", que é
                exatamente a condição de quem deve clicar aqui. Desenhado em linha e herdando a
                cor do texto, para acompanhar o estado de passagem do mouse sem código extra. */}
            <svg
              className="icone-acompanhar"
              viewBox="0 0 24 24"
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 8.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9.5" />
              <path d="M3.3 6.2 12 12l4.2-2.8" />
              <path d="m17.5 5.6 1.7 1.7 3-3" />
            </svg>
            Acompanhar uma mensagem já enviada
          </Link>

          {submitState === "error" && (
            <p className="feedback error" role="alert">
              Não conseguimos enviar sua mensagem agora. Confira sua conexão e tente novamente.
            </p>
          )}
          {submitState === "misconfigured" && (
            <p className="feedback error" role="alert">
              O atendimento está fora do ar por um problema nosso de configuração — não é a sua
              conexão. Já estamos avisados; tente de novo em alguns minutos.
            </p>
          )}
        </form>
          </>
        )}
      </section>

    </main>
  );
}
