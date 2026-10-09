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
  {
    label: "Produto com defeito",
    message: [
      "Recebi um produto que não está funcionando como deveria.",
      "",
      "Pedido nº: [número do pedido]",
      "Produto: [nome do produto]",
      "O que está acontecendo: [descreva o defeito]",
      "Quando começou: [dd/mm]",
    ].join("\n"),
  },
] as const;

type SubmitState = "idle" | "sending" | "success" | "error";

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
      setSubmitState("error");
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
        <div className="eyebrow"><span aria-hidden="true">●</span> Central de atendimento</div>
        <h1 id="page-title">Como podemos ajudar?</h1>
        <p className="intro">
          Conte o que aconteceu. Quanto mais completo, mais rápido conseguimos resolver.
        </p>

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

          <label>
            <span>Sua mensagem</span>
            <textarea
              ref={messageRef}
              name="message"
              rows={8}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escreva aqui o que você precisa..."
              required
            />
          </label>

          <button className="submit-button" type="submit" disabled={submitState === "sending"}>
            {submitState === "sending" ? "Enviando..." : "Enviar mensagem"}
          </button>

          {submitState === "success" && (
            <div className="feedback success" role="status">
              <strong>Recebemos sua mensagem.</strong>
              <span>
                Um atendente vai analisar o seu caso. Se houver uma resposta a enviar, ela vai
                para o e-mail <b>{sentTo}</b>.
              </span>
              <Link to="/acompanhar">Ver o andamento da sua mensagem</Link>
            </div>
          )}
          {submitState === "error" && (
            <p className="feedback error" role="alert">
              Não conseguimos enviar sua mensagem agora. Confira sua conexão e tente novamente.
            </p>
          )}
        </form>
      </section>

      {/* Entrada discreta para o outro papel: quem escreve é cliente, quem responde é a equipe.
          Fica no rodapé de propósito — não deve competir com o formulário. */}
      <footer className="rodape-papeis">
        <Link to="/atendimento">Sou da equipe de atendimento</Link>
      </footer>
    </main>
  );
}
