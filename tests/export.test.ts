import { describe, expect, it } from "vitest"
import { baixarCsv, gerarCsv, formatarReais } from "../src/lib/export.ts"

describe("exportação", () => {
  it("gera CSV com BOM, separador ; e aspas escapadas", () => {
    const csv = gerarCsv(
      ["nome", "obs"],
      [
        ["Ana", 'disse "oi"; tchau'],
        ["Bia", "ok"],
      ],
    )
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.startsWith("\uFEFFnome;obs\r\n")).toBe(true)
    expect(csv).toContain('"disse ""oi""; tchau"')
    expect(csv).toContain("\r\nBia;ok")
  })

  it("formata reais no padrão brasileiro", () => {
    expect(formatarReais(1410)).toBe("R$ 1.410,00")
    expect(formatarReais(44.5)).toBe("R$ 44,50")
    expect(formatarReais(0)).toBe("R$ 0,00")
  })

  it("não dispara download fora do navegador", () => {
    expect(() => baixarCsv("reembolsos.csv", "a;b")).toThrow(/navegador/)
  })
})
