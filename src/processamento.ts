import { parseCsv } from "./lib/parse.ts"
import { processarInscricoes } from "./lib/rules.ts"
import type { ConfigProva, InscricaoNormalizada, ResultadoProcessamento } from "./lib/types.ts"
import type { PedidoWorker, RespostaArquivo, RespostaWorker } from "./worker/tipos.ts"

let worker: Worker | null = null
let sequencia = 0
const aguardando = new Map<number, (resposta: RespostaWorker) => void>()

function obterWorker(): Worker | null {
  if (typeof Worker === "undefined") return null
  if (worker) return worker
  worker = new Worker(new URL("./worker/processar.ts", import.meta.url), { type: "module" })
  worker.onmessage = (evento: MessageEvent<RespostaWorker>) => {
    const resolver = aguardando.get(evento.data.id)
    aguardando.delete(evento.data.id)
    resolver?.(evento.data)
  }
  worker.onerror = () => {
    for (const resolver of aguardando.values()) resolver({ id: -1, tipo: "falha" })
    aguardando.clear()
    worker?.terminate()
    worker = null
  }
  return worker
}

type PedidoSemId = PedidoWorker extends infer Pedido
  ? Pedido extends PedidoWorker
    ? Omit<Pedido, "id">
    : never
  : never

function pedirMensagem(pedido: PedidoSemId): Promise<RespostaWorker> {
  const ativo = obterWorker()
  if (!ativo) return Promise.resolve({ id: -1, tipo: "falha" })
  const id = ++sequencia
  return new Promise((resolve) => {
    aguardando.set(id, resolve)
    ativo.postMessage({ ...pedido, id })
  })
}

function arquivoLocal(texto: string, config: ConfigProva): RespostaArquivo {
  const lido = parseCsv(texto)
  if (!lido.ok) return { ok: false, erro: lido.erro, faltando: lido.faltando }
  return {
    ok: true,
    linhas: lido.linhas,
    avisos: lido.avisos,
    resultado: processarInscricoes(lido.linhas, config),
  }
}

export async function processarArquivo(texto: string, config: ConfigProva): Promise<RespostaArquivo> {
  const resposta = await pedirMensagem({ tipo: "arquivo", texto, config })
  if (resposta.tipo !== "arquivo") return arquivoLocal(texto, config)
  return resposta.resposta
}

export async function recalcular(
  linhas: readonly InscricaoNormalizada[],
  config: ConfigProva,
): Promise<ResultadoProcessamento> {
  const resposta = await pedirMensagem({ tipo: "recalcular", linhas: [...linhas], config })
  if (resposta.tipo !== "recalcular") return processarInscricoes(linhas, config)
  return resposta.resultado
}
