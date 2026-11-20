export type Sexo = "Feminino" | "Masculino"

export type Percurso = 5 | 10 | 21

export type Camiseta = "P" | "M" | "G" | "GG" | "?"

export type ContagemCamisetas = Record<Camiseta, number>

export type ConfigProva = {
  dataProva: string
  dataLimiteLote1: string
  precoLote1: number
  precoLote2: number
  idadeDesconto: number
  diasReembolsoIntegral: number
  taxaPlataforma: number
  idadeMenor: number
}

export type InscricaoNormalizada = {
  id: string
  origem: string
  nome: string
  cpf: string | null
  cpfFormatado: string | null
  nascimento: string | null
  sexo: Sexo | null
  percurso: Percurso | null
  camiseta: Camiseta
  valorPago: number
  dataPagamento: string | null
  status: string
  pendente: boolean
  email: string
  telefone: string | null
  obs: string
}

export type ResultadoCsv =
  | { ok: true; linhas: InscricaoNormalizada[]; avisos: string[] }
  | { ok: false; erro: string; faltando: string[] }

export type Inscrito = {
  id: string
  nome: string
  cpf: string | null
  cpfFormatado: string | null
  sexo: Sexo | null
  nascimento: string | null
  nascimentoFormatado: string
  idade: number | null
  percurso: Percurso | null
  percursoTexto: string
  categoria: string
  camiseta: Camiseta
  plataforma: string
  valorPago: number
  alertas: string[]
  telefone: string | null
  email: string
  percursoAConfirmar: boolean
  menor: boolean
  semNascimento: boolean
  observacaoKit: string
}

export type MotivoReembolso = "duplicada" | "desconto_60" | "desistencia"

export type Reembolso = {
  id: string
  nome: string
  cpf: string | null
  cpfFormatado: string | null
  plataforma: string
  motivo: MotivoReembolso
  motivoTexto: string
  pago: number
  devolver: number
  dataPedido: string | null
  percentual: number | null
}

export type InscricaoDuplicada = {
  id: string
  nome: string
  cpf: string | null
  cpfFormatado: string | null
  plataforma: string
  percurso: Percurso | null
  camiseta: Camiseta
  valorPago: number
  dataPagamento: string | null
  idMantida: string
}

export type Stats = {
  linhas: number
  pessoasUnicas: number
  duplicadas: number
  confirmados: number
  pendentes: number
  desistencias: number
  totalReembolsar: number
  quantidadeReembolsos: number
  inscritosComAlerta: number
  conciliacaoFecha: boolean
}

export type ResultadoProcessamento = {
  ativos: Inscrito[]
  pendentes: Inscrito[]
  reembolsos: Reembolso[]
  duplicadas: InscricaoDuplicada[]
  camisetas: {
    confirmados: ContagemCamisetas
    pendentes: ContagemCamisetas
  }
  stats: Stats
}

export type ItemKit = {
  id: string
  nome: string
  cpf: string | null
  percurso: string
  camiseta: Camiseta
  observacao: string
}

export type AlertaItem = {
  id: string
  nome: string
  cpf: string | null
  alerta: string
  situacao: "confirmado" | "pendente"
}

export type MensagemSms = {
  nome: string
  telefone: string
  mensagem: string
  caracteres: number
}
