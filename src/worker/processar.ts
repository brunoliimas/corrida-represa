import { parseCsv } from "../lib/parse.ts"
import { processarInscricoes } from "../lib/rules.ts"
import type { PedidoWorker } from "./tipos.ts"

interface EscopoWorker {
  postMessage(mensagem: unknown): void
  addEventListener(tipo: "message", ouvinte: (evento: MessageEvent<PedidoWorker>) => void): void
}

const escopo = self as unknown as EscopoWorker

escopo.addEventListener("message", (evento) => {
  const pedido = evento.data
  try {
    if (pedido.tipo === "arquivo") {
      const lido = parseCsv(pedido.texto)
      if (!lido.ok) {
        escopo.postMessage({
          id: pedido.id,
          tipo: "arquivo",
          resposta: { ok: false, erro: lido.erro, faltando: lido.faltando },
        })
        return
      }
      escopo.postMessage({
        id: pedido.id,
        tipo: "arquivo",
        resposta: {
          ok: true,
          linhas: lido.linhas,
          avisos: lido.avisos,
          resultado: processarInscricoes(lido.linhas, pedido.config),
        },
      })
      return
    }

    escopo.postMessage({
      id: pedido.id,
      tipo: "recalcular",
      resultado: processarInscricoes(pedido.linhas, pedido.config),
    })
  } catch {
    escopo.postMessage({ id: pedido.id, tipo: "falha" })
  }
})
