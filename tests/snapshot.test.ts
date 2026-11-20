import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { parseCsv } from "../src/lib/parse.ts"
import { processarInscricoes } from "../src/lib/rules.ts"

const csv = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "fixtures/inscritos_corrida.csv"),
  "utf8",
)

describe("CSV real da corrida", () => {
  const lido = parseCsv(csv)
  if (!lido.ok) throw new Error(lido.erro)
  const resultado = processarInscricoes(lido.linhas)

  it("bate os números de linhas, pessoas e conciliação", () => {
    expect(resultado.stats.linhas).toBe(373)
    expect(resultado.stats.pessoasUnicas).toBe(362)
    expect(resultado.stats.duplicadas).toBe(11)
    expect(resultado.stats.confirmados).toBe(358)
    expect(resultado.stats.pendentes).toBe(1)
    expect(resultado.stats.desistencias).toBe(3)
    expect(resultado.stats.conciliacaoFecha).toBe(true)
    expect(
      resultado.stats.confirmados +
        resultado.stats.pendentes +
        resultado.stats.desistencias +
        resultado.stats.duplicadas,
    ).toBe(resultado.stats.linhas)
  })

  it("fecha o total a devolver em 18 reembolsos", () => {
    expect(resultado.reembolsos).toHaveLength(18)
    expect(resultado.stats.quantidadeReembolsos).toBe(18)
    expect(resultado.stats.totalReembolsar).toBe(1410)
    expect(resultado.reembolsos.filter((item) => item.motivo === "duplicada")).toHaveLength(11)
    expect(resultado.reembolsos.filter((item) => item.motivo === "desconto_60")).toHaveLength(4)
    expect(resultado.reembolsos.filter((item) => item.motivo === "desistencia")).toHaveLength(3)

    const desistencias = Object.fromEntries(
      resultado.reembolsos
        .filter((item) => item.motivo === "desistencia")
        .map((item) => [item.dataPedido, item.percentual]),
    )
    expect(desistencias["2025-11-30"]).toBe(100)
    expect(desistencias["2025-11-15"]).toBe(100)
    expect(desistencias["2025-12-03"]).toBe(50)
  })

  it("conta camisetas, percursos a confirmar, menores e nascimentos", () => {
    expect(resultado.camisetas.confirmados).toMatchObject({ P: 69, M: 157, G: 99, GG: 33, "?": 0 })
    expect(resultado.camisetas.pendentes).toMatchObject({ P: 0, M: 0, G: 0, GG: 1, "?": 0 })
    expect(resultado.ativos.filter((pessoa) => pessoa.percursoAConfirmar).map((pessoa) => pessoa.percursoTexto).sort()).toEqual([
      "10/21 km",
      "5/10 km",
      "5/10 km",
    ])
    expect(resultado.ativos.filter((pessoa) => pessoa.menor)).toHaveLength(3)
    expect(resultado.ativos.filter((pessoa) => pessoa.semNascimento)).toHaveLength(9)
    expect(resultado.stats.inscritosComAlerta).toBe(19)
  })
})
