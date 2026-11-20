import type { ConfigProva, InscricaoNormalizada, ResultadoProcessamento } from "../lib/types.ts"

export type RespostaArquivo =
  | { ok: false; erro: string; faltando: string[] }
  | {
      ok: true
      linhas: InscricaoNormalizada[]
      avisos: string[]
      resultado: ResultadoProcessamento
    }

export type PedidoWorker =
  | { id: number; tipo: "arquivo"; texto: string; config: ConfigProva }
  | { id: number; tipo: "recalcular"; linhas: InscricaoNormalizada[]; config: ConfigProva }

export type RespostaWorker =
  | { id: number; tipo: "arquivo"; resposta: RespostaArquivo }
  | { id: number; tipo: "recalcular"; resultado: ResultadoProcessamento }
  | { id: number; tipo: "falha" }
