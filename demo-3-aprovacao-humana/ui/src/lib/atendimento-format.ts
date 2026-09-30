/** Purpose: turn queue data into the words and marks the reviewer screen shows. */

export type NivelUrgencia = 1 | 2 | 3;

export type EtiquetaUrgencia = {
  texto: string;
  /** Marca visual que não depende de cor, para quem não distingue os tons. */
  marcas: string;
  classe: string;
};

const ETIQUETAS: Record<NivelUrgencia, EtiquetaUrgencia> = {
  3: { texto: "Urgente", marcas: "!!!", classe: "urgencia-alta" },
  2: { texto: "Atenção", marcas: "!!", classe: "urgencia-media" },
  1: { texto: "Pode esperar", marcas: "!", classe: "urgencia-baixa" },
};

export function etiquetaUrgencia(nivel: NivelUrgencia): EtiquetaUrgencia {
  return ETIQUETAS[nivel] ?? ETIQUETAS[1];
}

/**
 * O assunto chega classificado por código ("exchange"). Na tela do atendimento ele vira
 * palavra de gente — os mesmos rótulos que a cliente vê na página de acompanhamento.
 */
const ASSUNTO_LEGIVEL: Record<string, string> = {
  exchange: "Troca de produto",
  billing: "Cobrança",
  delivery: "Entrega",
  other: "Outro assunto",
};

export function assuntoLegivel(assunto: string): string {
  return ASSUNTO_LEGIVEL[assunto.trim().toLowerCase()] ?? "Outro assunto";
}

/** "há 8 minutos", "há 1 hora e 20 minutos", "há 2 dias". */
export function formatarEspera(minutos: number): string {
  const total = Math.max(0, Math.floor(minutos));
  if (total < 1) return "chegou agora";
  if (total < 60) return `há ${total} ${total === 1 ? "minuto" : "minutos"}`;

  const horas = Math.floor(total / 60);
  if (horas < 24) {
    const resto = total % 60;
    const base = `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
    return resto === 0 ? base : `${base} e ${resto} ${resto === 1 ? "minuto" : "minutos"}`;
  }

  const dias = Math.floor(horas / 24);
  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

/** Corta o resumo para caber numa linha do cartão, sem cortar palavra no meio. */
export function resumoDeUmaLinha(texto: string, limite = 88): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  const ultimoEspaco = corte.lastIndexOf(" ");
  return `${(ultimoEspaco > limite * 0.6 ? corte.slice(0, ultimoEspaco) : corte).trimEnd()}…`;
}

/** Verdadeiro quando a pessoa realmente mexeu no texto sugerido. */
export function textoFoiAlterado(sugerido: string, atual: string): boolean {
  return sugerido.trim() !== atual.trim();
}

export function contarCaracteres(texto: string): number {
  return Array.from(texto).length;
}
