import { describe, expect, it } from "vitest"
import { listarSms, montarMensagem, montarTextoBase, TEXTO_BASE_PADRAO } from "../src/lib/sms.ts"
import { processarInscricoes } from "../src/lib/rules.ts"
import { inscricao } from "./inscricao.ts"

const TEXTO =
  "Corrida da Represa: sua largada é domingo 07/12 às 6h30, na entrada da Represa. Retire seu kit no sábado 06/12, das 9h às 17h, no ginásio municipal. Boa prova!"

describe("SMS", () => {
  it("monta o texto padrão de largada e retirada", () => {
    expect(TEXTO_BASE_PADRAO).toBe(TEXTO)
    expect(montarTextoBase("sábado às 7h", "sexta, das 10h às 16h")).toBe(
      "Corrida da Represa: sua largada é sábado às 7h. Retire seu kit no sexta, das 10h às 16h. Boa prova!",
    )
  })

  it("acrescenta as frases extras e conta os caracteres", () => {
    const mensagem = montarMensagem({
      nome: "Ana",
      telefone: "(11) 99999-9999",
      semNascimento: true,
      percursoAConfirmar: true,
      menor: true,
    })
    expect(mensagem).toBe(
      `${TEXTO} Responda com a sua data de nascimento. Responda qual percurso você quer correr. Menor de idade: leve a autorização dos pais.`,
    )
    const lista = listarSms([
      {
        nome: "Ana",
        telefone: "(11) 99999-9999",
        semNascimento: false,
        percursoAConfirmar: false,
        menor: false,
      },
      {
        nome: "Bia",
        telefone: null,
        semNascimento: true,
        percursoAConfirmar: false,
        menor: false,
      },
    ])
    expect(lista).toHaveLength(1)
    expect(lista[0]?.caracteres).toBe(lista[0]?.mensagem.length)
    expect(lista[0]?.mensagem).toBe(TEXTO)
  })

  it("deixa desistência e telefone inválido fora da lista", () => {
    const resultado = processarInscricoes([
      inscricao({ id: "1", cpf: "11111111111", telefone: "(11) 99999-9999" }),
      inscricao({ id: "2", cpf: "22222222222", telefone: null, obs: "pediu reembolso 15/11" }),
      inscricao({ id: "3", cpf: "33333333333", telefone: null }),
    ])
    const lista = listarSms(resultado.ativos)
    expect(lista.map((item) => item.nome)).toEqual(["Ana Silva"])
  })
})
