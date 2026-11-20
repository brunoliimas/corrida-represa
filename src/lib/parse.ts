import { parse as analisarCsv, type ParseError } from "papaparse"
import type {
  Camiseta,
  InscricaoNormalizada,
  Percurso,
  ResultadoCsv,
  Sexo,
} from "./types.ts"

export const COLUNAS_ESPERADAS = [
  "id",
  "origem",
  "nome",
  "cpf",
  "nascimento",
  "sexo",
  "distancia",
  "camiseta",
  "valor_pago",
  "data_pagamento",
  "status",
  "email",
  "telefone",
  "obs",
] as const

const CAMISETAS: Record<string, Exclude<Camiseta, "?">> = {
  p: "P",
  pequena: "P",
  s: "P",
  m: "M",
  media: "M",
  g: "G",
  grande: "G",
  l: "G",
  gg: "GG",
  "extra grande": "GG",
  xl: "GG",
}

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/
const DATA_ISO_COM_HORA = /^(\d{4})-(\d{2})-(\d{2})T/
const DATA_BR = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/

export function semAcento(valor: string): string {
  return valor.normalize("NFD").replace(/\p{M}/gu, "")
}

export function normalizarCabecalho(valor: string): string {
  return semAcento(valor)
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
}

export function montarData(ano: number, mes: number, dia: number): string | null {
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null
  }
  const mesTexto = String(mes).padStart(2, "0")
  const diaTexto = String(dia).padStart(2, "0")
  return `${ano}-${mesTexto}-${diaTexto}`
}

export function parseData(valor: string | null | undefined): string | null {
  const texto = (valor ?? "").trim()
  if (!texto) return null

  const comHora = DATA_ISO_COM_HORA.exec(texto)
  if (comHora) {
    return montarData(Number(comHora[1]), Number(comHora[2]), Number(comHora[3]))
  }

  const iso = DATA_ISO.exec(texto)
  if (iso) {
    return montarData(Number(iso[1]), Number(iso[2]), Number(iso[3]))
  }

  const br = DATA_BR.exec(texto)
  if (!br) return null

  const dia = Number(br[1])
  const mes = Number(br[2])
  let ano = Number(br[3])
  if (br[3].length === 2) {
    ano = ano > 26 ? 1900 + ano : 2000 + ano
  }
  return montarData(ano, mes, dia)
}

export function parseNascimento(valor: string | null | undefined): string | null {
  const data = parseData(valor)
  if (data === "1900-01-01") return null
  return data
}

export function parseValor(valor: string | null | undefined): number | null {
  let texto = (valor ?? "").trim().replace(/r\$/gi, "").replace(/\s/g, "")
  if (!texto) return null

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".")
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".")
  }

  if (!/^-?\d+(\.\d+)?$/.test(texto)) return null
  const numero = Number(texto)
  if (!Number.isFinite(numero)) return null
  return Math.round(numero * 100) / 100
}

export function normalizarCpf(valor: string | null | undefined): string | null {
  const digitos = (valor ?? "").replace(/\D/g, "")
  if (digitos.length !== 11) return null
  return digitos
}

export function formatarCpf(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function formatarDataBr(iso: string | null): string {
  if (!iso) return ""
  const partes = DATA_ISO.exec(iso)
  if (!partes) return ""
  return `${partes[3]}/${partes[2]}/${partes[1]}`
}

export function normalizarTelefone(valor: string | null | undefined): string | null {
  let digitos = (valor ?? "").replace(/\D/g, "")
  if (digitos.startsWith("55") && digitos.length > 11) {
    digitos = digitos.slice(2)
  }
  if (digitos.length !== 11) return null
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}

const PARTICULAS_DO_NOME = new Set(["de", "da", "do", "dos", "das", "e"])

export function normalizarNome(valor: string | null | undefined): string {
  return (valor ?? "")
    .trim()
    .split(/\s+/)
    .filter((parte) => parte.length > 0)
    .map((parte, indice) => {
      const minusculo = parte.toLocaleLowerCase("pt-BR")
      if (indice > 0 && PARTICULAS_DO_NOME.has(minusculo)) return minusculo
      return minusculo.charAt(0).toLocaleUpperCase("pt-BR") + minusculo.slice(1)
    })
    .join(" ")
}

export function normalizarSexo(valor: string | null | undefined): Sexo | null {
  const texto = semAcento(valor ?? "").toLowerCase().trim()
  if (texto === "f" || texto === "feminino") return "Feminino"
  if (texto === "m" || texto === "masculino") return "Masculino"
  return null
}

export function normalizarPercurso(valor: string | null | undefined): Percurso | null {
  const texto = semAcento(valor ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
  if (!texto) return null
  if (texto.includes("meia")) return 21

  const numero = /(\d+(?:[.,]\d+)?)/.exec(texto)
  if (!numero) return null

  let km = Number(numero[1].replace(",", "."))
  const emMetros = texto.endsWith("m") && !texto.includes("km") && km >= 1000
  if (emMetros) km /= 1000

  if (km >= 20 && km < 30) return 21
  if (km >= 7.5 && km < 15) return 10
  if (km >= 4 && km < 7.5) return 5
  return null
}

export function normalizarCamiseta(valor: string | null | undefined): Camiseta {
  const texto = semAcento(valor ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
  return CAMISETAS[texto] ?? "?"
}

function campo(linha: Record<string, string>, nome: string): string {
  return (linha[nome] ?? "").trim()
}

function normalizarLinha(linha: Record<string, string>): InscricaoNormalizada {
  const cpf = normalizarCpf(campo(linha, "cpf"))
  const status = campo(linha, "status")
  const valor = parseValor(campo(linha, "valor_pago"))

  return {
    id: campo(linha, "id"),
    origem: campo(linha, "origem"),
    nome: normalizarNome(campo(linha, "nome")),
    cpf,
    cpfFormatado: cpf ? formatarCpf(cpf) : null,
    nascimento: parseNascimento(campo(linha, "nascimento")),
    sexo: normalizarSexo(campo(linha, "sexo")),
    percurso: normalizarPercurso(campo(linha, "distancia")),
    camiseta: normalizarCamiseta(campo(linha, "camiseta")),
    valorPago: valor ?? 0,
    dataPagamento: parseData(campo(linha, "data_pagamento")),
    status,
    pendente: semAcento(status).toLowerCase() === "pendente",
    email: campo(linha, "email"),
    telefone: normalizarTelefone(campo(linha, "telefone")),
    obs: campo(linha, "obs"),
  }
}

export function parseCsv(texto: string): ResultadoCsv {
  const semBom = texto.replace(/^\uFEFF/, "")
  const resultado = analisarCsv<Record<string, string>>(semBom, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizarCabecalho,
  })

  const campos = (resultado.meta.fields ?? []).map(normalizarCabecalho)
  const faltando = COLUNAS_ESPERADAS.filter((coluna) => !campos.includes(coluna))
  if (faltando.length > 0) {
    return {
      ok: false,
      faltando: [...faltando],
      erro: `O arquivo não tem as colunas esperadas. Faltam: ${faltando.join(", ")}.`,
    }
  }

  return {
    ok: true,
    linhas: resultado.data.map(normalizarLinha),
    avisos: avisosDeLeitura(resultado.errors),
  }
}

function avisosDeLeitura(erros: ParseError[]): string[] {
  if (erros.length === 0) return []

  const linhas = [
    ...new Set(
      erros.flatMap((erro) => (erro.row === undefined ? [] : [erro.row + 2])),
    ),
  ].sort((a, b) => a - b)

  if (linhas.length === 0) return ["Há problemas de leitura no arquivo."]
  if (linhas.length === 1) return [`Há problemas de leitura na linha ${linhas[0]}.`]
  return [`Há problemas de leitura nas linhas ${linhas.join(", ")}.`]
}
