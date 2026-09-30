// Purpose: let a customer create a real case for human-reviewed support.
import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/")({ component: CustomerMessagePage });

const examples = [
  { label: "Troca de produto", message: "Quero trocar um produto que chegou com defeito." },
  { label: "Cobrança", message: "Preciso entender uma cobrança que não reconheço." },
  { label: "Entrega", message: "Meu pedido ainda não chegou. Podem verificar?" },
] as const;

type SubmitState = "idle" | "sending" | "success" | "error";

function CustomerMessagePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  // The address the answer will go to, kept for the confirmation after the form is cleared.
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const webhookUrl = import.meta.env["VITE_DEMO3_WEBHOOK_URL"] as string | undefined;

    if (!webhookUrl || webhookUrl.includes("YOUR-N8N-HOST")) {
      setSubmitState("error");
      return;
    }

    setSubmitState("sending");
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origem: "site-contato",
          remetente: { nome: name.trim(), email: email.trim() },
          mensagem: message.trim(),
          recebido_em: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      setSentTo(email.trim());
      setSubmitState("success");
      setMessage("");
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
          Conte o que aconteceu. Você receberá a resposta por e-mail.
        </p>

        <div className="examples" aria-labelledby="examples-title">
          <p id="examples-title">Escolha um exemplo ou escreva com suas palavras</p>
          <div className="example-grid">
            {examples.map((example) => (
              <button
                type="button"
                className="example-button"
                key={example.label}
                onClick={() => {
                  setMessage(example.message);
                  setSubmitState("idle");
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
              name="message"
              rows={5}
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
                Um atendente confere a resposta antes de ela chegar ao e-mail <b>{sentTo}</b>.
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
    </main>
  );
}
