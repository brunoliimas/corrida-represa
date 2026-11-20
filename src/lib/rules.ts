import { formatarDataBr, montarData, semAcento } from "./parse.ts"
import type {
  AlertaItem,
  ConfigProva,
  ContagemCamisetas,
  InscricaoDuplicada,
  InscricaoNormalizada,
  Inscrito,
  ItemKit,
  Percurso,
  Reembolso,
  ResultadoProcessamento,
} from "./types.ts"

export const CONFIG_PADRAO: ConfigProva = {
  dataProva: "2025-12-07",
  dataLimiteLote1: "2025-10-31",
  precoLote1: 89,
  precoLote2: 99,
  idadeDesconto: 60,
  diasReembolsoIntegral: 7,
  taxaPlataforma: 0,
  idadeMenor: 18,
}

export const ALERTAS = {
  percurso: "Confirmar percurso com a pessoa",
  nascimento: "Sem data de nascimento válida",
  menor: "Conferir autorização dos pais",
  pendente: "Pagamento pendente",
  camiseta: "Camiseta inválida",
  telefone: "Telefone inválido",
  pagamento: "Pagamento divergente",
  pedidoSemData: "Pedido de reembolso sem data legível",
  dataPagamento: "Data de pagamento ausente",
  cpf: "CPF inválido",
  percursoDesconhecido: "Percurso não reconhecido",
  sexo: "Sexo não informado",
  camisetaDiferente: "Camiseta diferente nas inscrições",
} as const

const ALERTAS_DE_KIT = new Set<string>([
  ALERTAS.percurso,
  ALERTAS.percursoDesconhecido,
  ALERTAS.nascimento,
  ALERTAS.menor,
  ALERTAS.camiseta,
  ALERTAS.camisetaDiferente,
])

const PALAVRAS_DESISTENCIA = ["reembolso", "cancel", "desist", "devol"]

const DATA_NO_TEXTO = /(\d{1,2})\s*[/-]\s*(\d{1,2})(?:\s*[/-]\s*(\d{2}|\d{4}))?/

function centavos(reais: number): number {
  return Math.round(reais * 100)
}

function reais(valorCentavos: number): number {
  return valorCentavos / 100
}

function aplicarTaxa(valorCentavos: number, taxaPercent: number): number {
  return Math.round((valorCentavos * (100 - taxaPercent)) / 100)
}

function contagemVazia(): ContagemCamisetas {
  return { P: 0, M: 0, G: 0, GG: 0, "?": 0 }
}

function partesIso(iso: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

export function somarDias(iso: string, dias: number): string {
  const partes = partesIso(iso)
  if (!partes) return iso
  const [ano, mes, dia] = partes
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  data.setUTCDate(data.getUTCDate() + dias)
  const resultado = montarData(data.getUTCFullYear(), data.getUTCMonth() + 1, data.getUTCDate())
  return resultado ?? iso
}

export function idadeCompleta(nascimento: string | null, referencia: string): number | null {
  if (!nascimento) return null
  const nasc = partesIso(nascimento)
  const ref = partesIso(referencia)
  if (!nasc || !ref) return null
  const [anoNasc, mesNasc, diaNasc] = nasc
  const [anoRef, mesRef, diaRef] = ref
  let idade = anoRef - anoNasc
  if (mesRef < mesNasc || (mesRef === mesNasc && diaRef < diaNasc)) idade -= 1
  return idade
}

export function precoEsperado(
  dataPagamento: string | null,
  idade: number | null,
  config: ConfigProva = CONFIG_PADRAO,
): number {
  const lote =
    dataPagamento !== null && dataPagamento <= config.dataLimiteLote1
      ? config.precoLote1
      : config.precoLote2
  const cheio = centavos(lote)
  if (idade !== null && idade >= config.idadeDesconto) return reais(Math.round(cheio / 2))
  return reais(cheio)
}

export function extrairPedidoReembolso(
  obs: string,
  anoProva: number,
): { temPedido: boolean; data: string | null } {
  const texto = semAcento(obs).toLowerCase()
  const temPedido = PALAVRAS_DESISTENCIA.some((palavra) => texto.includes(palavra))
  if (!temPedido) return { temPedido: false, data: null }

  const match = DATA_NO_TEXTO.exec(obs)
  if (!match) return { temPedido: true, data: null }

  const dia = Number(match[1])
  const mes = Number(match[2])
  let ano = anoProva
  if (match[3]) {
    ano = Number(match[3])
    if (match[3].length === 2) ano = ano > 26 ? 1900 + ano : 2000 + ano
  }
  return { temPedido: true, data: montarData(ano, mes, dia) }
}

function chaveCpf(linha: InscricaoNormalizada): string {
  return linha.cpf ?? `sem-cpf:${linha.id}`
}

function compararInscricao(a: InscricaoNormalizada, b: InscricaoNormalizada): number {
  const dataA = a.dataPagamento ?? "9999-12-31"
  const dataB = b.dataPagamento ?? "9999-12-31"
  if (dataA < dataB) return -1
  if (dataA > dataB) return 1
  const idA = Number(a.id)
  const idB = Number(b.id)
  if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) return idA - idB
  return a.id.localeCompare(b.id, "pt-BR")
}

function faixaEtaria(idade: number): string {
  const inicio = Math.floor(idade / 5) * 5
  return `${inicio} a ${inicio + 4}`
}

function percursosDoGrupo(grupo: readonly InscricaoNormalizada[]): Percurso[] {
  const vistos = new Set<Percurso>()
  for (const linha of grupo) {
    if (linha.percurso !== null) vistos.add(linha.percurso)
  }
  return [...vistos].sort((a, b) => a - b)
}

type ContextoPessoa = {
  linha: InscricaoNormalizada
  idade: number | null
  conflito: boolean
  percursos: Percurso[]
  camisetasDiferentes: boolean
}

function camisetasDiferentes(grupo: readonly InscricaoNormalizada[]): boolean {
  if (grupo.length < 2) return false
  const tamanhos = new Set(grupo.map((linha) => linha.camiseta))
  return tamanhos.size > 1
}

function pedidoDoGrupo(
  grupo: readonly InscricaoNormalizada[],
  anoProva: number,
): { temPedido: boolean; data: string | null } {
  for (const linha of grupo) {
    const pedido = extrairPedidoReembolso(linha.obs, anoProva)
    if (pedido.temPedido) return pedido
  }
  return { temPedido: false, data: null }
}

function montarAlertas(contexto: ContextoPessoa, config: ConfigProva, pendente: boolean): string[] {
  const { linha, idade, conflito, camisetasDiferentes: camisetasDistintas } = contexto
  const alertas: string[] = []
  if (!linha.cpf) alertas.push(ALERTAS.cpf)
  if (conflito) alertas.push(ALERTAS.percurso)
  if (linha.percurso === null) alertas.push(ALERTAS.percursoDesconhecido)
  if (!linha.sexo) alertas.push(ALERTAS.sexo)
  if (!linha.nascimento) alertas.push(ALERTAS.nascimento)
  if (idade !== null && idade < config.idadeMenor) alertas.push(ALERTAS.menor)
  if (linha.camiseta === "?") alertas.push(ALERTAS.camiseta)
  if (camisetasDistintas) alertas.push(ALERTAS.camisetaDiferente)
  if (!linha.telefone) alertas.push(ALERTAS.telefone)
  if (pendente) alertas.push(ALERTAS.pendente)
  return alertas
}

function criarInscrito(contexto: ContextoPessoa, alertas: string[]): Inscrito {
  const { linha, idade, conflito, percursos } = contexto
  const percursoTexto = conflito
    ? `${percursos.join("/")} km`
    : linha.percurso
      ? `${linha.percurso} km`
      : ""
  const categoria = conflito
    ? "(percurso a confirmar)"
    : !linha.nascimento || !linha.sexo || !linha.percurso || idade === null
      ? "Sem categoria"
      : `${linha.percurso} km · ${linha.sexo} · ${faixaEtaria(idade)}`

  return {
    id: linha.id,
    nome: linha.nome,
    cpf: linha.cpf,
    cpfFormatado: linha.cpfFormatado,
    sexo: linha.sexo,
    nascimento: linha.nascimento,
    nascimentoFormatado: formatarDataBr(linha.nascimento),
    idade,
    percurso: conflito ? null : linha.percurso,
    percursoTexto,
    categoria,
    camiseta: linha.camiseta,
    plataforma: linha.origem,
    valorPago: linha.valorPago,
    alertas,
    telefone: linha.telefone,
    email: linha.email,
    percursoAConfirmar: conflito,
    menor: idade !== null && alertas.includes(ALERTAS.menor),
    semNascimento: !linha.nascimento,
    observacaoKit: alertas.filter((alerta) => ALERTAS_DE_KIT.has(alerta)).join("; "),
  }
}

function reembolsoDe(
  linha: InscricaoNormalizada,
  motivo: Reembolso["motivo"],
  motivoTexto: string,
  pagoCentavos: number,
  devolverCentavos: number,
  dataPedido: string | null,
  percentual: number | null,
): Reembolso {
  return {
    id: linha.id,
    nome: linha.nome,
    cpf: linha.cpf,
    cpfFormatado: linha.cpfFormatado,
    plataforma: linha.origem,
    motivo,
    motivoTexto,
    pago: reais(pagoCentavos),
    devolver: reais(devolverCentavos),
    dataPedido,
    percentual,
  }
}

export function processarInscricoes(
  linhas: readonly InscricaoNormalizada[],
  config: ConfigProva = CONFIG_PADRAO,
): ResultadoProcessamento {
  const grupos = new Map<string, InscricaoNormalizada[]>()
  for (const linha of linhas) {
    const chave = chaveCpf(linha)
    const grupo = grupos.get(chave)
    if (grupo) grupo.push(linha)
    else grupos.set(chave, [linha])
  }

  const ativos: Inscrito[] = []
  const pendentes: Inscrito[] = []
  const reembolsos: Reembolso[] = []
  const duplicadas: InscricaoDuplicada[] = []
  const camisetasConfirmadas = contagemVazia()
  const camisetasPendentes = contagemVazia()
  let desistencias = 0
  let totalCentavos = 0
  const anoProva = Number(config.dataProva.slice(0, 4))
  const prazoIntegral = somarDias(config.dataProva, -config.diasReembolsoIntegral)

  for (const grupo of grupos.values()) {
    const ordenadas = [...grupo].sort(compararInscricao)
    const naoPendentes = ordenadas.filter((linha) => !linha.pendente)
    const keeper = naoPendentes[0] ?? ordenadas[0]
    if (!keeper) continue

    const percursos = percursosDoGrupo(grupo)
    const conflito = percursos.length > 1
    const idade = idadeCompleta(keeper.nascimento, config.dataProva)
    const contexto: ContextoPessoa = {
      linha: keeper,
      idade,
      conflito,
      percursos,
      camisetasDiferentes: camisetasDiferentes(grupo),
    }

    for (const extra of grupo) {
      if (extra === keeper) continue
      duplicadas.push({
        id: extra.id,
        nome: extra.nome,
        cpf: extra.cpf,
        cpfFormatado: extra.cpfFormatado,
        plataforma: extra.origem,
        percurso: extra.percurso,
        camiseta: extra.camiseta,
        valorPago: extra.valorPago,
        dataPagamento: extra.dataPagamento,
        idMantida: keeper.id,
      })
      if (extra.valorPago <= 0) continue
      const pago = centavos(extra.valorPago)
      const devolver = aplicarTaxa(pago, config.taxaPlataforma)
      totalCentavos += devolver
      reembolsos.push(
        reembolsoDe(extra, "duplicada", "Inscrição duplicada", pago, devolver, null, 100),
      )
    }

    if (keeper.pendente) {
      const alertas = montarAlertas(contexto, config, true)
      pendentes.push(criarInscrito(contexto, alertas))
      camisetasPendentes[keeper.camiseta] += 1
      continue
    }

    const pedido = pedidoDoGrupo(grupo, anoProva)
    if (pedido.temPedido && pedido.data) {
      const integral = pedido.data <= prazoIntegral
      const percentual = integral ? 100 : 50
      const pago = centavos(keeper.valorPago)
      const base = integral ? pago : Math.round(pago / 2)
      const devolver = aplicarTaxa(base, config.taxaPlataforma)
      totalCentavos += devolver
      desistencias += 1
      reembolsos.push(
        reembolsoDe(
          keeper,
          "desistencia",
          integral ? "Desistência com reembolso integral" : `Desistência com reembolso de ${percentual}%`,
          pago,
          devolver,
          pedido.data,
          percentual,
        ),
      )
      continue
    }

    const alertas = montarAlertas(contexto, config, false)
    if (!keeper.dataPagamento) alertas.push(ALERTAS.dataPagamento)

    const esperado = centavos(precoEsperado(keeper.dataPagamento, idade, config))
    const pago = centavos(keeper.valorPago)
    if (keeper.dataPagamento && pago !== esperado) alertas.push(ALERTAS.pagamento)
    if (pedido.temPedido && !pedido.data) alertas.push(ALERTAS.pedidoSemData)

    if (keeper.dataPagamento && idade !== null && idade >= config.idadeDesconto && pago > esperado) {
      const diferenca = aplicarTaxa(pago - esperado, config.taxaPlataforma)
      totalCentavos += diferenca
      reembolsos.push(
        reembolsoDe(
          keeper,
          "desconto_60",
          `Desconto de ${config.idadeDesconto}+ não aplicado`,
          pago,
          diferenca,
          null,
          null,
        ),
      )
    }

    ativos.push(criarInscrito(contexto, alertas))
    camisetasConfirmadas[keeper.camiseta] += 1
  }

  const stats = {
    linhas: linhas.length,
    pessoasUnicas: grupos.size,
    duplicadas: duplicadas.length,
    confirmados: ativos.length,
    pendentes: pendentes.length,
    desistencias,
    totalReembolsar: reais(totalCentavos),
    quantidadeReembolsos: reembolsos.length,
    inscritosComAlerta: ativos.filter((pessoa) => pessoa.alertas.length > 0).length,
    conciliacaoFecha:
      linhas.length === ativos.length + pendentes.length + desistencias + duplicadas.length,
  }

  return {
    ativos,
    pendentes,
    reembolsos,
    duplicadas,
    camisetas: {
      confirmados: camisetasConfirmadas,
      pendentes: camisetasPendentes,
    },
    stats,
  }
}

export function listarKit(ativos: readonly Inscrito[]): ItemKit[] {
  return [...ativos]
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((pessoa) => ({
      id: pessoa.id,
      nome: pessoa.nome,
      cpf: pessoa.cpfFormatado,
      percurso: pessoa.percursoTexto,
      camiseta: pessoa.camiseta,
      observacao: pessoa.observacaoKit,
    }))
}

export function listarAlertas(resultado: ResultadoProcessamento): AlertaItem[] {
  const itens: AlertaItem[] = []
  for (const pessoa of resultado.ativos) {
    for (const alerta of pessoa.alertas) {
      itens.push({
        id: pessoa.id,
        nome: pessoa.nome,
        cpf: pessoa.cpfFormatado,
        alerta,
        situacao: "confirmado",
      })
    }
  }
  for (const pessoa of resultado.pendentes) {
    for (const alerta of pessoa.alertas) {
      itens.push({
        id: pessoa.id,
        nome: pessoa.nome,
        cpf: pessoa.cpfFormatado,
        alerta,
        situacao: "pendente",
      })
    }
  }
  return itens
}
