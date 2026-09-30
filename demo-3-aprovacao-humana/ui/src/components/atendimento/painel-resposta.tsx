// Purpose: show what the customer wrote and let the reviewer shape the answer before it goes out.
import { useId, useState } from "react";
import type { PendentePublico } from "../../lib/pendentes-contract";
import type { EscolhaDecisao } from "../../lib/atendimento-decisao";
import {
  assuntoLegivel,
  contarCaracteres,
  etiquetaUrgencia,
  formatarEspera,
  textoFoiAlterado,
} from "../../lib/atendimento-format";
import { AjudaBolha } from "./ajuda-bolha";

type Props = {
  item: PendentePublico;
  texto: string;
  modoAjuste: boolean;
  enviando: boolean;
  /** Frase que veio do servidor quando a decisão não passou. Já está em linguagem de atendimento. */
  erro: string | null;
  onTextoChange: (texto: string) => void;
  onAlternarAjuste: () => void;
  onRestaurar: () => void;
  onDecidir: (decisao: EscolhaDecisao, campos?: { texto?: string; motivo?: string }) => void;
};

export function PainelResposta({
  item,
  texto,
  modoAjuste,
  enviando,
  erro,
  onTextoChange,
  onAlternarAjuste,
  onRestaurar,
  onDecidir,
}: Props) {
  const etiqueta = etiquetaUrgencia(item.urgencia);
  const alterado = textoFoiAlterado(item.rascunho, texto);

  // O terceiro botão abre um campo antes de valer: sem motivo escrito, nada é enviado.
  const [pedindoMotivo, setPedindoMotivo] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [avisoLocal, setAvisoLocal] = useState<string | null>(null);
  const idMotivo = useId();
  const idResposta = useId();

  const problema =
    avisoLocal ??
    (erro ? `${erro} Esta mensagem continua aberta aqui — você pode tentar de novo.` : null);

  function decidirAjuste() {
    if (!alterado) {
      setAvisoLocal(
        "Você ainda não mudou nada no texto. Use “Enviar como está” ou escreva a sua versão primeiro.",
      );
      return;
    }
    setAvisoLocal(null);
    onDecidir("ajustar", { texto });
  }

  function confirmarRecusa() {
    if (motivo.trim().length === 0) {
      setAvisoLocal("Escreva o motivo antes de confirmar. Ele fica registrado no atendimento.");
      return;
    }
    setAvisoLocal(null);
    onDecidir("recusar", { motivo });
  }

  const campoResposta = (
    <label className="campo-resposta" htmlFor={idResposta}>
      <span>{modoAjuste ? "A sua versão" : "Resposta que vai para a cliente"}</span>
      <textarea
        id={idResposta}
        value={texto}
        rows={modoAjuste ? 14 : 10}
        disabled={enviando}
        onChange={(evento) => onTextoChange(evento.target.value)}
      />
      <span className="contador" aria-live="polite">
        {contarCaracteres(texto)} caracteres
      </span>
    </label>
  );

  return (
    <section className="painel" aria-labelledby="painel-titulo">
      <header className="painel-cabecalho">
        <div>
          <h2 id="painel-titulo">{item.cliente_nome}</h2>
          <p className="painel-linha">
            {assuntoLegivel(item.assunto)} · esperando {formatarEspera(item.esperando_ha_min)}
          </p>
        </div>
        <span className={`etiqueta ${etiqueta.classe}`}>
          <span className="etiqueta-marcas" aria-hidden="true">
            {etiqueta.marcas}
          </span>
          {etiqueta.texto}
          <AjudaBolha
            alinhamento="direita"
            sobre={etiqueta.texto}
            texto="A pressa é medida pelo tom e pelo assunto da mensagem. Quanto mais urgente, mais alto o caso aparece na lista da esquerda."
          />
        </span>
      </header>

      <div className="bloco-cliente">
        <p className="rotulo-bloco">
          O que a cliente escreveu
          <AjudaBolha
            sobre="O que a cliente escreveu"
            texto="É o texto original, exatamente como ela mandou. Nada aqui foi reescrito nem resumido."
          />
        </p>
        <blockquote className="mensagem-cliente">{item.mensagem_cliente}</blockquote>
      </div>

      <div className="bloco-resposta">
        <div className="bloco-resposta-topo">
          <p className="rotulo-bloco">
            Resposta sugerida
            <AjudaBolha
              sobre="Resposta sugerida"
              texto="Um texto pronto para poupar seu tempo. Você pode enviar assim mesmo, mudar o que quiser, ou não enviar nada."
            />
          </p>
          <button
            type="button"
            className="botao-secundario"
            disabled={enviando}
            onClick={onAlternarAjuste}
          >
            {modoAjuste ? "Voltar à vista simples" : "Comparar com o original"}
          </button>
        </div>

        {modoAjuste ? (
          <div className="comparacao">
            <div className="coluna-original">
              <span className="rotulo-coluna">Texto sugerido</span>
              <div className="texto-original">{item.rascunho}</div>
            </div>
            <div className="coluna-minha">{campoResposta}</div>
          </div>
        ) : (
          campoResposta
        )}

        {alterado && (
          <p className="aviso-alterado" role="status">
            Você mudou o texto. A cliente vai receber a sua versão.{" "}
            <button
              type="button"
              className="botao-texto"
              disabled={enviando}
              onClick={onRestaurar}
            >
              Voltar ao texto sugerido
            </button>
          </p>
        )}
      </div>

      <footer className="painel-acoes">
        {pedindoMotivo && (
          <div className="bloco-motivo">
            <label className="campo-motivo" htmlFor={idMotivo}>
              <span>Por que esta resposta não deve ser enviada?</span>
              {/* O botão que abriu este bloco sai da tela: sem isto o foco do teclado se perde. */}
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <textarea
                autoFocus
                id={idMotivo}
                value={motivo}
                rows={3}
                disabled={enviando}
                placeholder="Ex.: o caso precisa de uma ligação, não de uma resposta escrita."
                onChange={(evento) => {
                  setMotivo(evento.target.value);
                  if (avisoLocal) setAvisoLocal(null);
                }}
              />
            </label>
            <p className="motivo-nota">Fica registrado no atendimento. A cliente não vê este texto.</p>
            <div className="grupo-botoes">
              <button
                type="button"
                className="botao-recusar-confirmar"
                disabled={enviando}
                onClick={confirmarRecusa}
              >
                Confirmar que não vai enviar
              </button>
              <button
                type="button"
                className="botao-secundario"
                disabled={enviando}
                onClick={() => {
                  setPedindoMotivo(false);
                  setMotivo("");
                  setAvisoLocal(null);
                }}
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {!pedindoMotivo && (
          <div className="grupo-botoes">
            <button
              type="button"
              className="botao-aprovar"
              disabled={enviando}
              onClick={() => {
                setAvisoLocal(null);
                onDecidir("aprovar");
              }}
            >
              Enviar como está
            </button>
            <button type="button" className="botao-ajuste" disabled={enviando} onClick={decidirAjuste}>
              Enviar a minha versão
            </button>
            <button
              type="button"
              className="botao-recusar"
              disabled={enviando}
              onClick={() => {
                setAvisoLocal(null);
                setPedindoMotivo(true);
              }}
            >
              Não enviar
            </button>
          </div>
        )}

        {enviando && (
          <p className="aviso-enviando" role="status">
            <span className="aviso-marca" aria-hidden="true">
              ⏳
            </span>
            Enviando a sua decisão…
          </p>
        )}

        {/* Um aviso por vez: o que a pessoa acabou de causar vem antes do anterior. */}
        {problema && !enviando && (
          <p className="aviso-problema" role="alert">
            <span className="aviso-marca" aria-hidden="true">
              !
            </span>
            {problema}
          </p>
        )}
      </footer>
    </section>
  );
}
