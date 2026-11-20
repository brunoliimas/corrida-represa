import type { InscricaoNormalizada } from "../src/lib/types.ts"

export function inscricao(
  parcial: Partial<InscricaoNormalizada> & Pick<InscricaoNormalizada, "cpf" | "id">,
): InscricaoNormalizada {
  return {
    origem: "site",
    nome: "Ana Silva",
    cpfFormatado: null,
    nascimento: "1990-01-01",
    sexo: "Feminino",
    percurso: 10,
    camiseta: "M",
    valorPago: 89,
    dataPagamento: "2025-10-01",
    status: "pago",
    pendente: false,
    email: "ana@example.com",
    telefone: "(11) 99999-9999",
    obs: "",
    ...parcial,
  }
}
