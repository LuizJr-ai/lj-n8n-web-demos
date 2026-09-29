// Purpose: show one waiting message in the queue, compact enough to scan in a second.
import type { PendentePublico } from "../../lib/pendentes-contract";
import { etiquetaUrgencia, formatarEspera, resumoDeUmaLinha } from "../../lib/atendimento-format";

type Props = {
  item: PendentePublico;
  aberto: boolean;
  editado: boolean;
  onAbrir: (id: string) => void;
};

export function CartaoFila({ item, aberto, editado, onAbrir }: Props) {
  const etiqueta = etiquetaUrgencia(item.urgencia);

  // Nome lido em voz alta: na ordem em que a pessoa lê o cartão, sem os "!!!" decorativos.
  const nomeAcessivel = [
    item.cliente_nome,
    etiqueta.texto,
    `esperando ${formatarEspera(item.esperando_ha_min)}`,
    resumoDeUmaLinha(item.resumo),
    editado ? "você já mexeu nesta resposta" : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <li>
      <button
        type="button"
        className="cartao-fila"
        data-aberto={aberto}
        aria-label={nomeAcessivel}
        aria-current={aberto ? "true" : undefined}
        onClick={() => onAbrir(item.id)}
      >
        <span className="cartao-topo">
          <span className="cartao-nome">{item.cliente_nome}</span>
          <span className={`etiqueta ${etiqueta.classe}`}>
            <span className="etiqueta-marcas" aria-hidden="true">
              {etiqueta.marcas}
            </span>
            {etiqueta.texto}
          </span>
        </span>
        <span className="cartao-espera">Esperando {formatarEspera(item.esperando_ha_min)}</span>
        <span className="cartao-resumo">{resumoDeUmaLinha(item.resumo)}</span>
        {editado && <span className="cartao-marca-editado">Você já mexeu nesta resposta</span>}
      </button>
    </li>
  );
}
