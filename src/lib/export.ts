export function escaparCampoCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return ""
  const texto = String(valor)
  if (/[;"\r\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

export function gerarCsv(
  cabecalhos: readonly string[],
  linhas: readonly (readonly (string | number | null | undefined)[])[],
): string {
  const corpo = [
    cabecalhos.map(escaparCampoCsv).join(";"),
    ...linhas.map((linha) => linha.map(escaparCampoCsv).join(";")),
  ]
  return `\uFEFF${corpo.join("\r\n")}`
}

export function formatarReais(valor: number): string {
  const negativo = valor < 0
  const centavos = Math.round(Math.abs(valor) * 100)
  const inteiro = Math.floor(centavos / 100)
  const fracao = String(centavos % 100).padStart(2, "0")
  const inteiroFormatado = String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${negativo ? "-" : ""}R$ ${inteiroFormatado},${fracao}`
}

export function baixarCsv(nomeArquivo: string, conteudo: string): void {
  if (typeof document === "undefined") {
    throw new Error("O download do CSV só está disponível no navegador.")
  }

  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
