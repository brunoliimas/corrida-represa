import { describe, expect, it } from "vitest"
import {
  normalizarCabecalho,
  normalizarCamiseta,
  normalizarCpf,
  normalizarNome,
  normalizarPercurso,
  normalizarTelefone,
  parseCsv,
  parseData,
  parseNascimento,
  parseValor,
} from "../src/lib/parse.ts"

const CABECALHO =
  "id,origem,nome,cpf,nascimento,sexo,distancia,camiseta,valor_pago,data_pagamento,status,email,telefone,obs"

describe("datas", () => {
  it("aceita os quatro formatos", () => {
    expect(parseData("2025-12-07")).toBe("2025-12-07")
    expect(parseData("07/12/2025")).toBe("2025-12-07")
    expect(parseData("07-12-2025")).toBe("2025-12-07")
    expect(parseData("07/12/25")).toBe("2025-12-07")
  })

  it("interpreta ano de dois dígitos: acima de 26 é século 19", () => {
    expect(parseData("22/01/86")).toBe("1986-01-22")
    expect(parseData("15/01/26")).toBe("2026-01-15")
    expect(parseData("15/01/27")).toBe("1927-01-15")
  })

  it("rejeita data impossível", () => {
    expect(parseData("31/02/2025")).toBeNull()
    expect(parseData("")).toBeNull()
  })

  it("trata nascimento vazio ou 01/01/1900 como sem data", () => {
    expect(parseNascimento("")).toBeNull()
    expect(parseNascimento("01/01/1900")).toBeNull()
    expect(parseNascimento("1900-01-01")).toBeNull()
    expect(parseNascimento("22/01/86")).toBe("1986-01-22")
  })
})

describe("valores", () => {
  it.each([
    ["R$ 44,50", 44.5],
    ["44.50", 44.5],
    ["44,50", 44.5],
    ["49.50", 49.5],
    ["R$ 99,00", 99],
    ["99.00", 99],
    ["99,00", 99],
    ["99", 99],
    ["R$ 0,00", 0],
    ["R$ 1.234,56", 1234.56],
  ])("converte %s", (texto, esperado) => {
    expect(parseValor(texto)).toBe(esperado)
  })
})

describe("identidade e contato", () => {
  it("unifica CPF com e sem máscara", () => {
    expect(normalizarCpf("042.748.758-73")).toBe("04274875873")
    expect(normalizarCpf("04274875873")).toBe("04274875873")
  })

  it("formata telefone válido e rejeita o curto", () => {
    expect(normalizarTelefone("(11) 99999-9999")).toBe("(11) 99999-9999")
    expect(normalizarTelefone("+55 11 95525-5273")).toBe("(11) 95525-5273")
    expect(normalizarTelefone("1199797-9367")).toBe("(11) 99797-9367")
    expect(normalizarTelefone("55999999999")).toBe("(55) 99999-9999")
    expect(normalizarTelefone("1234")).toBeNull()
  })

  it("exibe o nome em title case", () => {
    expect(normalizarNome("ricardo almeida")).toBe("Ricardo Almeida")
    expect(normalizarNome("BEATRIZ LOPES COSTA")).toBe("Beatriz Lopes Costa")
    expect(normalizarNome("  ANTÔNIO  SILVA ")).toBe("Antônio Silva")
  })
})

describe("percurso e camiseta", () => {
  it.each([
    ["5k", 5],
    ["5 km", 5],
    ["5K", 5],
    ["5000m", 5],
    ["10K", 10],
    ["10 km", 10],
    ["10000m", 10],
    ["Meia", 21],
    ["Meia Maratona", 21],
    ["21,1 km", 21],
    ["21097m", 21],
  ])("normaliza %s", (texto, esperado) => {
    expect(normalizarPercurso(texto)).toBe(esperado)
  })

  it.each([
    ["P", "P"],
    ["S", "P"],
    ["Pequena", "P"],
    ["M", "M"],
    ["Média", "M"],
    ["G", "G"],
    ["L", "G"],
    ["Grande", "G"],
    ["GG", "GG"],
    ["XL", "GG"],
    ["Extra Grande", "GG"],
    ["XXL", "?"],
  ])("mapeia camiseta %s", (texto, esperado) => {
    expect(normalizarCamiseta(texto)).toBe(esperado)
  })
})

describe("parseCsv", () => {
  it("normaliza cabeçalhos com acento, espaço e BOM", () => {
    expect(normalizarCabecalho("Distância")).toBe("distancia")
    expect(normalizarCabecalho("Valor Pago")).toBe("valor_pago")
    const texto = `\uFEFFid,origem,nome,cpf,nascimento,sexo,distância,camiseta,valor pago,data pagamento,status,email,telefone,obs
1,site,"Ana, Lima",123.456.789-09,07/12/25,f,5 km,Pequena,"R$ 44,50",31/10/2025,pago,ana@example.com,(11) 99999-9999,`
    const resultado = parseCsv(texto)
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.linhas).toHaveLength(1)
    const linha = resultado.linhas[0]
    expect(linha?.nome).toBe("Ana, Lima")
    expect(linha?.cpf).toBe("12345678909")
    expect(linha?.nascimento).toBe("2025-12-07")
    expect(linha?.sexo).toBe("Feminino")
    expect(linha?.percurso).toBe(5)
    expect(linha?.camiseta).toBe("P")
    expect(linha?.valorPago).toBe(44.5)
    expect(linha?.dataPagamento).toBe("2025-10-31")
    expect(linha?.telefone).toBe("(11) 99999-9999")
  })

  it("aceita separador ponto e vírgula", () => {
    const texto = [
      CABECALHO.replaceAll(",", ";"),
      "1;site;Bia;12345678909;1990-01-01;F;10k;M;89;2025-08-01;pago;bia@example.com;11988887777;",
    ].join("\n")
    const resultado = parseCsv(texto)
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.linhas[0]?.nome).toBe("Bia")
    expect(resultado.linhas[0]?.valorPago).toBe(89)
  })

  it("lista as colunas que faltam", () => {
    const resultado = parseCsv("id,nome\n1,Ana\n")
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.faltando).toContain("telefone")
    expect(resultado.faltando).toContain("cpf")
    expect(resultado.erro).toContain("telefone")
    expect(resultado.erro).toContain("cpf")
  })
})
