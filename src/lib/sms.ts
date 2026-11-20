import type { Inscrito, MensagemSms } from "./types.ts"

export const LARGADA_PADRAO = "domingo 07/12 às 6h30, na entrada da Represa"
export const RETIRADA_PADRAO = "sábado 06/12, das 9h às 17h, no ginásio municipal"

export const FRASE_NASCIMENTO = "Responda com a sua data de nascimento."
export const FRASE_PERCURSO = "Responda qual percurso você quer correr."
export const FRASE_MENOR = "Menor de idade: leve a autorização dos pais."

export function montarTextoBase(
  largada = LARGADA_PADRAO,
  retiradaKit = RETIRADA_PADRAO,
): string {
  return `Corrida da Represa: sua largada é ${largada}. Retire seu kit no ${retiradaKit}. Boa prova!`
}

export const TEXTO_BASE_PADRAO = montarTextoBase()

type PessoaSms = Pick<
  Inscrito,
  "nome" | "telefone" | "semNascimento" | "percursoAConfirmar" | "menor"
>

export function montarMensagem(pessoa: PessoaSms, textoBase = TEXTO_BASE_PADRAO): string {
  const extras: string[] = []
  if (pessoa.semNascimento) extras.push(FRASE_NASCIMENTO)
  if (pessoa.percursoAConfirmar) extras.push(FRASE_PERCURSO)
  if (pessoa.menor) extras.push(FRASE_MENOR)
  if (extras.length === 0) return textoBase
  return `${textoBase.trimEnd()} ${extras.join(" ")}`
}

export function listarSms(pessoas: readonly PessoaSms[], textoBase = TEXTO_BASE_PADRAO): MensagemSms[] {
  const mensagens: MensagemSms[] = []
  for (const pessoa of pessoas) {
    if (!pessoa.telefone) continue
    const mensagem = montarMensagem(pessoa, textoBase)
    mensagens.push({
      nome: pessoa.nome,
      telefone: pessoa.telefone,
      mensagem,
      caracteres: mensagem.length,
    })
  }
  return mensagens
}
