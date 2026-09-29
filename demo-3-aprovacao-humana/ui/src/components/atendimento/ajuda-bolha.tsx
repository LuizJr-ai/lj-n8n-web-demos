// Purpose: explain a detail of the screen in a bubble the app owns, never the browser's own.
import { useId, useState } from "react";

type Props = {
  /** O que a bolha explica, em linguagem de atendimento. */
  texto: string;
  /** Nome do que está sendo explicado, lido por leitor de tela. */
  sobre: string;
  /** "direita" para quem fica colado na borda da tela e não pode abrir centralizado. */
  alinhamento?: "centro" | "direita";
};

export function AjudaBolha({ texto, sobre, alinhamento = "centro" }: Props) {
  const [aberta, setAberta] = useState(false);
  const id = useId();

  return (
    <span
      className="ajuda"
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => setAberta(false)}
    >
      <button
        type="button"
        className="ajuda-gatilho"
        aria-label={`O que significa: ${sobre}`}
        aria-expanded={aberta}
        aria-describedby={aberta ? id : undefined}
        onFocus={() => setAberta(true)}
        onBlur={() => setAberta(false)}
        onClick={() => setAberta((valor) => !valor)}
        onKeyDown={(evento) => {
          if (evento.key === "Escape") setAberta(false);
        }}
      >
        <span aria-hidden="true">?</span>
      </button>
      {/* Só existe no documento quando está aberta: fechada, ela empurraria a largura da página. */}
      {aberta && (
        <span role="tooltip" id={id} className="ajuda-bolha" data-alinhamento={alinhamento}>
          {texto}
        </span>
      )}
    </span>
  );
}
