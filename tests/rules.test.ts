import { describe, expect, it } from "vitest"
import { parseCsv } from "../src/lib/parse.ts"
import {
  ALERTAS,
  CONFIG_PADRAO,
  listarKit,
  precoEsperado,
  processarInscricoes,
} from "../src/lib/rules.ts"
import { inscricao } from "./inscricao.ts"

const CABECALHO =
  "id,origem,nome,cpf,nascimento,sexo,distancia,camiseta,valor_pago,data_pagamento,status,email,telefone,obs"

function processarCsv(linhas: string[], config = CONFIG_PADRAO) {
  const resultado = parseCsv([CABECALHO, ...linhas].join("\n"))
  if (!resultado.ok) throw new Error(resultado.erro)
  return processarInscricoes(resultado.linhas, config)
}

describe("lotes e preço", () => {
  it("cobra 89 até 31/10 e 99 a partir de 01/11", () => {
    expect(precoEsperado("2025-10-31", 35)).toBe(89)
    expect(precoEsperado("2025-11-01", 35)).toBe(99)

    const resultado = processarInscricoes([
      inscricao({ id: "1", cpf: "11111111111", dataPagamento: "2025-10-31", valorPago: 89 }),
      inscricao({ id: "2", cpf: "22222222222", dataPagamento: "2025-11-01", valorPago: 99 }),
    ])

    expect(resultado.reembolsos).toHaveLength(0)
    expect(resultado.ativos.every((pessoa) => !pessoa.alertas.includes(ALERTAS.pagamento))).toBe(true)
  })

  it("alerta pagamento divergente de quem não tem 60+ sem gerar reembolso", () => {
    const resultado = processarInscricoes([
      inscricao({ id: "1", cpf: "11111111111", dataPagamento: "2025-11-01", valorPago: 89 }),
      inscricao({ id: "2", cpf: "22222222222", dataPagamento: "2025-10-31", valorPago: 99 }),
    ])
    expect(resultado.reembolsos).toHaveLength(0)
    expect(resultado.ativos.every((pessoa) => pessoa.alertas.includes(ALERTAS.pagamento))).toBe(true)
  })
})

describe("idade na data da prova", () => {
  it("completa 60 anos na véspera, no dia e só no dia seguinte", () => {
    expect(precoEsperado("2025-10-01", 60)).toBe(44.5)
    expect(precoEsperado("2025-11-01", 60)).toBe(49.5)
    expect(precoEsperado("2025-10-01", 59)).toBe(89)

    const resultado = processarInscricoes([
      inscricao({
        id: "1",
        cpf: "11111111111",
        nome: "Véspera",
        nascimento: "1965-12-06",
        sexo: "Masculino",
        valorPago: 44.5,
      }),
      inscricao({
        id: "2",
        cpf: "22222222222",
        nome: "No dia",
        nascimento: "1965-12-07",
        sexo: "Feminino",
        valorPago: 44.5,
      }),
      inscricao({
        id: "3",
        cpf: "33333333333",
        nome: "Dia seguinte",
        nascimento: "1965-12-08",
        sexo: "Masculino",
        valorPago: 89,
      }),
    ])

    expect(resultado.reembolsos).toHaveLength(0)
    expect(resultado.ativos.map((pessoa) => pessoa.idade)).toEqual([60, 60, 59])
    expect(resultado.ativos.map((pessoa) => pessoa.categoria)).toEqual([
      "10 km · Masculino · 60 a 64",
      "10 km · Feminino · 60 a 64",
      "10 km · Masculino · 55 a 59",
    ])
  })

  it("devolve a diferença quando o desconto de 60+ não foi aplicado e só alerta se pagou menos", () => {
    const resultado = processarInscricoes([
      inscricao({
        id: "1",
        cpf: "11111111111",
        nascimento: "1965-12-06",
        dataPagamento: "2025-09-01",
        valorPago: 89,
      }),
      inscricao({
        id: "2",
        cpf: "22222222222",
        nascimento: "1965-12-07",
        dataPagamento: "2025-11-03",
        valorPago: 99,
      }),
      inscricao({
        id: "3",
        cpf: "33333333333",
        nascimento: "1965-12-06",
        dataPagamento: "2025-09-01",
        valorPago: 40,
      }),
    ])

    expect(resultado.ativos).toHaveLength(3)
    expect(resultado.reembolsos.map((item) => item.devolver)).toEqual([44.5, 49.5])
    expect(resultado.reembolsos.every((item) => item.motivo === "desconto_60")).toBe(true)
    expect(resultado.ativos[2]?.idade).toBe(60)
    expect(resultado.ativos[2]?.alertas).toContain(ALERTAS.pagamento)
    expect(resultado.reembolsos.some((item) => item.id === "3")).toBe(false)
  })

  it("marca menor de 18 e monta a categoria de quem faz 30 anos", () => {
    const resultado = processarInscricoes([
      inscricao({
        id: "1",
        cpf: "11111111111",
        nascimento: "2007-12-08",
        valorPago: 99,
        dataPagamento: "2025-11-02",
      }),
      inscricao({
        id: "2",
        cpf: "22222222222",
        nascimento: "2007-12-07",
        valorPago: 99,
        dataPagamento: "2025-11-02",
      }),
      inscricao({
        id: "3",
        cpf: "33333333333",
        nascimento: "1995-06-15",
        sexo: "Feminino",
        percurso: 10,
        valorPago: 89,
      }),
      inscricao({ id: "4", cpf: "44444444444", nascimento: null, sexo: null }),
    ])

    expect(resultado.ativos[0]?.menor).toBe(true)
    expect(resultado.ativos[0]?.alertas).toContain(ALERTAS.menor)
    expect(resultado.ativos[0]?.observacaoKit).toContain(ALERTAS.menor)
    expect(resultado.ativos[1]?.menor).toBe(false)
    expect(resultado.ativos[1]?.idade).toBe(18)
    expect(resultado.ativos[2]?.categoria).toBe("10 km · Feminino · 30 a 34")
    expect(resultado.ativos[3]?.categoria).toBe("Sem categoria")
    expect(resultado.ativos[3]?.alertas).toContain(ALERTAS.nascimento)
    expect(listarKit(resultado.ativos).map((item) => item.nome)).toEqual([
      "Ana Silva",
      "Ana Silva",
      "Ana Silva",
      "Ana Silva",
    ])
  })
})

describe("desistência", () => {
  it("devolve 100% em 30/11 e 50% em 01/12", () => {
    const resultado = processarInscricoes([
      inscricao({ id: "1", cpf: "11111111111", obs: "pediu reembolso 30/11", valorPago: 89 }),
      inscricao({ id: "2", cpf: "22222222222", obs: "pediu reembolso em 01/12", valorPago: 99 }),
    ])

    expect(resultado.ativos).toHaveLength(0)
    expect(resultado.stats.desistencias).toBe(2)
    expect(resultado.stats.conciliacaoFecha).toBe(true)
    const porData = Object.fromEntries(
      resultado.reembolsos.map((item) => [item.dataPedido, item]),
    )
    expect(porData["2025-11-30"]?.percentual).toBe(100)
    expect(porData["2025-11-30"]?.devolver).toBe(89)
    expect(porData["2025-12-01"]?.percentual).toBe(50)
    expect(porData["2025-12-01"]?.devolver).toBe(49.5)
  })

  it("recalcula o prazo quando o parâmetro muda para 5 dias", () => {
    const linha = inscricao({
      id: "1",
      cpf: "11111111111",
      obs: "quer cancelar, pediu dia 01/12",
      valorPago: 89,
    })
    const seteDias = processarInscricoes([linha])
    const cincoDias = processarInscricoes([linha], { ...CONFIG_PADRAO, diasReembolsoIntegral: 5 })

    expect(seteDias.reembolsos[0]?.percentual).toBe(50)
    expect(seteDias.reembolsos[0]?.devolver).toBe(44.5)
    expect(cincoDias.reembolsos[0]?.percentual).toBe(100)
    expect(cincoDias.reembolsos[0]?.devolver).toBe(89)
  })

  it("não reembolsa pedido sem data legível e mantém a pessoa inscrita", () => {
    const resultado = processarInscricoes([
      inscricao({ id: "1", cpf: "11111111111", obs: "quero cancelar a inscrição" }),
    ])
    expect(resultado.reembolsos).toHaveLength(0)
    expect(resultado.ativos).toHaveLength(1)
    expect(resultado.ativos[0]?.alertas).toContain(ALERTAS.pedidoSemData)
  })
})

describe("duplicidade", () => {
  it("não mescla homônimos com CPF diferente", () => {
    const resultado = processarInscricoes([
      inscricao({ id: "1", cpf: "11111111111", nome: "Ricardo Silva" }),
      inscricao({ id: "2", cpf: "22222222222", nome: "Ricardo Silva" }),
    ])
    expect(resultado.stats.pessoasUnicas).toBe(2)
    expect(resultado.stats.duplicadas).toBe(0)
    expect(resultado.ativos).toHaveLength(2)
  })

  it("mescla o mesmo CPF com e sem máscara e fica com o pagamento mais antigo", () => {
    const resultado = processarCsv([
      "2,site,Ana Lima,123.456.789-09,1990-01-01,F,10k,M,99,01/11/2025,pago,ana@example.com,11999999999,",
      "1,correja,ANA LIMA,12345678909,01/01/1990,f,10 km,G,89,31/10/2025,pago,ana@example.com,(11) 98888-7777,",
    ])
    expect(resultado.stats.pessoasUnicas).toBe(1)
    expect(resultado.stats.duplicadas).toBe(1)
    expect(resultado.ativos[0]?.id).toBe("1")
    expect(resultado.ativos[0]?.camiseta).toBe("G")
    expect(resultado.camisetas.confirmados.G).toBe(1)
    expect(resultado.camisetas.confirmados.M).toBe(0)
    expect(resultado.reembolsos[0]?.motivo).toBe("duplicada")
    expect(resultado.reembolsos[0]?.devolver).toBe(99)
    expect(resultado.duplicadas[0]?.idMantida).toBe("1")
  })

  it("não decide o percurso quando as inscrições divergem e conta a camiseta uma vez", () => {
    const resultado = processarInscricoes([
      inscricao({
        id: "1",
        cpf: "11111111111",
        percurso: 5,
        camiseta: "P",
        dataPagamento: "2025-08-01",
        valorPago: 89,
      }),
      inscricao({
        id: "2",
        cpf: "11111111111",
        percurso: 10,
        camiseta: "G",
        dataPagamento: "2025-11-02",
        valorPago: 99,
      }),
    ])
    expect(resultado.ativos[0]?.percursoAConfirmar).toBe(true)
    expect(resultado.ativos[0]?.percurso).toBeNull()
    expect(resultado.ativos[0]?.percursoTexto).toBe("5/10 km")
    expect(resultado.ativos[0]?.categoria).toBe("(percurso a confirmar)")
    expect(resultado.ativos[0]?.alertas).toContain(ALERTAS.percurso)
    expect(resultado.ativos[0]?.camiseta).toBe("P")
    expect(resultado.camisetas.confirmados).toMatchObject({ P: 1, G: 0 })
  })

  it("trata pendência e duplicata como categorias exclusivas", () => {
    const resultado = processarInscricoes([
      inscricao({
        id: "1",
        cpf: "11111111111",
        pendente: true,
        status: "Pendente",
        valorPago: 0,
        dataPagamento: "2025-08-01",
        camiseta: "GG",
      }),
      inscricao({
        id: "2",
        cpf: "11111111111",
        dataPagamento: "2025-11-01",
        valorPago: 99,
        camiseta: "M",
      }),
      inscricao({
        id: "3",
        cpf: "33333333333",
        pendente: true,
        status: "Pendente",
        valorPago: 0,
        camiseta: "GG",
      }),
    ])

    expect(resultado.pendentes.map((pessoa) => pessoa.id)).toEqual(["3"])
    expect(resultado.ativos.map((pessoa) => pessoa.id)).toEqual(["2"])
    expect(resultado.duplicadas.map((pessoa) => pessoa.id)).toEqual(["1"])
    expect(resultado.camisetas.pendentes.GG).toBe(1)
    expect(resultado.camisetas.confirmados.M).toBe(1)
    expect(resultado.stats.conciliacaoFecha).toBe(true)
  })

  it("desconta a taxa de plataforma do valor devolvido", () => {
    const resultado = processarInscricoes(
      [
        inscricao({ id: "1", cpf: "11111111111", dataPagamento: "2025-08-01", valorPago: 89 }),
        inscricao({ id: "2", cpf: "11111111111", dataPagamento: "2025-11-01", valorPago: 100 }),
      ],
      { ...CONFIG_PADRAO, taxaPlataforma: 10 },
    )
    expect(resultado.reembolsos[0]?.devolver).toBe(90)
  })
})
