// Purpose: the reviewer's desk — the waiting queue on the left, the open case on the right.
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import "../components/atendimento/atendimento.css";
import { AjudaBolha } from "../components/atendimento/ajuda-bolha";
import { CartaoFila } from "../components/atendimento/cartao-fila";
import { PainelResposta } from "../components/atendimento/painel-resposta";
import { textoFoiAlterado } from "../lib/atendimento-format";
import {
  enviarDecisao,
  montarPedido,
  proximoItemApos,
  type EscolhaDecisao,
} from "../lib/atendimento-decisao";
import type { PendentePublico } from "../lib/pendentes-contract";

export const Route = createFileRoute("/atendimento")({ component: MesaDeAtendimento });

async function buscarFila(): Promise<PendentePublico[]> {
  const resposta = await fetch("/api/pendentes");
  if (!resposta.ok) throw new Error("fila-indisponivel");
  return (await resposta.json()) as PendentePublico[];
}

function MesaDeAtendimento() {
  // A fila se refaz sozinha a cada 10s: o tempo de redigir uma resposta é de poucos segundos,
  // e esperar até 10s é imperceptível para quem atende — sem precisar de conexão permanente.
  const fila = useQuery({
    queryKey: ["fila-pendentes"],
    queryFn: buscarFila,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const [idAberto, setIdAberto] = useState<string | null>(null);
  const [modoAjuste, setModoAjuste] = useState(false);
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [erroDecisao, setErroDecisao] = useState<string | null>(null);
  const [confirmacao, setConfirmacao] = useState<string | null>(null);
  // Itens já resolvidos somem da tela na hora, sem esperar a próxima consulta à fila.
  const [resolvidos, setResolvidos] = useState<string[]>([]);

  const itens = useMemo(
    () => (fila.data ?? []).filter((item) => !resolvidos.includes(item.id)),
    [fila.data, resolvidos],
  );

  // Quando a fila muda (item novo, item que saiu), mantém aberto o mesmo caso se ele ainda existe.
  useEffect(() => {
    if (itens.length === 0) {
      setIdAberto(null);
      return;
    }
    setIdAberto((atual) => (atual && itens.some((item) => item.id === atual) ? atual : itens[0]!.id));
  }, [itens]);

  // Depois de decidir, o botão clicado desaparece com o caso. Sem isto o foco do teclado
  // voltaria para o começo da página: ele vai para o aviso de que a decisão passou.
  const refConfirmacao = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (confirmacao) refConfirmacao.current?.focus();
  }, [confirmacao]);

  const aberto = itens.find((item) => item.id === idAberto) ?? null;
  const textoAberto = aberto ? (textos[aberto.id] ?? aberto.rascunho) : "";

  function abrirItem(id: string) {
    setIdAberto(id);
    setErroDecisao(null);
  }

  // O único caminho entre os três botões e o servidor. O navegador manda o número da
  // mensagem; o endereço de retomada fica do lado de lá e nunca passa por aqui.
  async function decidir(decisao: EscolhaDecisao, campos?: { texto?: string; motivo?: string }) {
    if (!aberto || enviando) return;
    const idDecidido = aberto.id;

    setEnviando(true);
    setErroDecisao(null);
    setConfirmacao(null);

    const resposta = await enviarDecisao(montarPedido(aberto, decisao, campos));
    setEnviando(false);

    if (!resposta.ok) {
      // A mensagem vem pronta do servidor; a tela só a mostra e mantém o caso aberto.
      setErroDecisao(resposta.mensagem);
      return;
    }

    setConfirmacao(resposta.mensagem);
    setModoAjuste(false);
    setIdAberto(proximoItemApos(itens, idDecidido));
    setResolvidos((atual) => [...atual, idDecidido]);
    void fila.refetch();
  }

  return (
    <main className="mesa" data-ajuste={modoAjuste ? "true" : "false"}>
      <header className="mesa-cabecalho">
        <div>
          <div className="eyebrow">
            <span aria-hidden="true">●</span> Central de atendimento
          </div>
          <h1>Mensagens esperando resposta</h1>
        </div>
        <p className="mesa-nota">
          Cada resposta passa por você antes de chegar à cliente.
          <AjudaBolha
            alinhamento="direita"
            sobre="Cada resposta passa por você"
            texto="A lista mostra só as mensagens que ainda não foram respondidas. Assim que uma pessoa escreve pela página de contato, ela aparece aqui em poucos segundos."
          />
        </p>
      </header>

      {confirmacao && (
        <p className="mesa-confirmacao" role="status" tabIndex={-1} ref={refConfirmacao}>
          <span className="aviso-marca" aria-hidden="true">
            ✓
          </span>
          {confirmacao}
          <button
            type="button"
            className="botao-texto botao-fechar-aviso"
            onClick={() => setConfirmacao(null)}
          >
            Fechar aviso
          </button>
        </p>
      )}

      <div className="mesa-conteudo">
        <section className="fila" aria-labelledby="fila-titulo">
          <div className="fila-cabecalho">
            <h2 id="fila-titulo">
              Na fila
              {itens.length > 0 && <span className="fila-contagem">{itens.length}</span>}
            </h2>
            {fila.isFetching && !fila.isPending && (
              <span className="fila-atualizando" role="status">
                atualizando…
              </span>
            )}
          </div>

          {fila.isPending && (
            <p className="estado-fila" role="status">
              Buscando as mensagens que estão esperando…
            </p>
          )}

          {fila.isError && (
            <div className="estado-fila estado-erro" role="alert">
              <p>Não conseguimos carregar as mensagens agora.</p>
              <p className="estado-detalhe">
                Verifique sua conexão. Vamos tentar de novo sozinhos em instantes.
              </p>
              <button type="button" className="botao-secundario" onClick={() => void fila.refetch()}>
                Tentar agora
              </button>
            </div>
          )}

          {!fila.isPending && !fila.isError && itens.length === 0 && (
            <p className="estado-fila" role="status">
              Nenhuma mensagem esperando. Assim que alguém escrever, ela aparece aqui.
            </p>
          )}

          {itens.length > 0 && (
            <ul className="fila-lista">
              {itens.map((item) => (
                <CartaoFila
                  key={item.id}
                  item={item}
                  aberto={item.id === idAberto}
                  editado={textoFoiAlterado(item.rascunho, textos[item.id] ?? item.rascunho)}
                  onAbrir={abrirItem}
                />
              ))}
            </ul>
          )}
        </section>

        {aberto ? (
          <PainelResposta
            key={aberto.id}
            item={aberto}
            texto={textoAberto}
            modoAjuste={modoAjuste}
            enviando={enviando}
            erro={erroDecisao}
            onTextoChange={(valor) => setTextos((atual) => ({ ...atual, [aberto.id]: valor }))}
            onAlternarAjuste={() => setModoAjuste((valor) => !valor)}
            onRestaurar={() =>
              setTextos((atual) => ({ ...atual, [aberto.id]: aberto.rascunho }))
            }
            onDecidir={(decisao, campos) => void decidir(decisao, campos)}
          />
        ) : (
          <section className="painel painel-vazio">
            {fila.isPending ? (
              <>
                <h2>Abrindo a primeira mensagem</h2>
                <p>Só um instante enquanto buscamos quem está esperando.</p>
              </>
            ) : fila.isError ? (
              <>
                <h2>Sem conexão com as mensagens</h2>
                <p>
                  Assim que a conexão voltar, a mensagem mais urgente abre aqui com a resposta
                  sugerida pronta para você conferir.
                </p>
              </>
            ) : (
              <>
                <h2>Tudo respondido por aqui</h2>
                <p>
                  Quando chegar uma mensagem nova, ela abre nesta área com a resposta sugerida
                  pronta para você conferir.
                </p>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
