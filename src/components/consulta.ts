import { semAcento } from "../lib/parse.ts"

export function combinaPessoa(nome: string, cpf: string | null, termo: string): boolean {
  const consulta = semAcento(termo).toLocaleLowerCase("pt-BR").trim()
  if (!consulta) return true
  if (semAcento(nome).toLocaleLowerCase("pt-BR").includes(consulta)) return true
  const digitos = consulta.replace(/\D/g, "")
  if (!digitos) return false
  return (cpf ?? "").replace(/\D/g, "").includes(digitos)
}

export function nomePlataforma(origem: string): string {
  if (origem === "correja") return "CorreJá"
  if (origem === "inscricaofacil") return "InscriçãoFácil"
  if (origem === "site") return "Site"
  return origem
}

export function textoOuTraco(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—"
  return String(valor)
}
