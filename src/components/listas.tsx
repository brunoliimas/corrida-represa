import { useMemo } from "react"
import { formatarReais } from "../lib/export.ts"
import { ALERTAS, listarAlertas, listarKit } from "../lib/rules.ts"
import { listarSms, montarTextoBase } from "../lib/sms.ts"
import type { Inscrito, ResultadoProcessamento } from "../lib/types.ts"
import { combinaPessoa, nomePlataforma, textoOuTraco } from "./consulta.ts"
import { TabelaPaginada } from "./tabela-paginada.tsx"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

const NUMERO = "text-right tabular-nums"

const ALERTAS_DE_ERRO = new Set<string>([
  ALERTAS.nascimento,
  ALERTAS.camiseta,
  ALERTAS.telefone,
  ALERTAS.pagamento,
  ALERTAS.cpf,
  ALERTAS.percursoDesconhecido,
])

function tomDoAlerta(alerta: string): "destructive" | "warning" {
  if (ALERTAS_DE_ERRO.has(alerta)) return "destructive"
  return "warning"
}

export function AbaInscritos({ pessoas }: { pessoas: readonly Inscrito[] }) {
  return (
    <TabelaPaginada
      itens={pessoas}
      nomeArquivo="inscritos.csv"
      vazio="Nenhum inscrito confirmado."
      busca={(pessoa, termo) => combinaPessoa(pessoa.nome, pessoa.cpfFormatado ?? pessoa.cpf, termo)}
      colunas={[
        { id: "id", titulo: "Id", className: NUMERO, csv: (pessoa) => pessoa.id, celula: (pessoa) => pessoa.id },
        { id: "nome", titulo: "Nome", csv: (pessoa) => pessoa.nome, celula: (pessoa) => pessoa.nome },
        {
          id: "cpf",
          titulo: "CPF",
          csv: (pessoa) => pessoa.cpfFormatado,
          celula: (pessoa) => textoOuTraco(pessoa.cpfFormatado),
        },
        { id: "sexo", titulo: "Sexo", csv: (pessoa) => pessoa.sexo, celula: (pessoa) => textoOuTraco(pessoa.sexo) },
        {
          id: "nascimento",
          titulo: "Nascimento",
          csv: (pessoa) => pessoa.nascimentoFormatado,
          celula: (pessoa) => textoOuTraco(pessoa.nascimentoFormatado),
        },
        {
          id: "idade",
          titulo: "Idade",
          className: NUMERO,
          csv: (pessoa) => pessoa.idade,
          celula: (pessoa) => textoOuTraco(pessoa.idade),
        },
        {
          id: "percurso",
          titulo: "Percurso",
          csv: (pessoa) => pessoa.percursoTexto,
          celula: (pessoa) => textoOuTraco(pessoa.percursoTexto),
        },
        { id: "categoria", titulo: "Categoria", csv: (pessoa) => pessoa.categoria, celula: (pessoa) => pessoa.categoria },
        { id: "camiseta", titulo: "Camiseta", csv: (pessoa) => pessoa.camiseta, celula: (pessoa) => pessoa.camiseta },
        {
          id: "plataforma",
          titulo: "Plataforma",
          csv: (pessoa) => nomePlataforma(pessoa.plataforma),
          celula: (pessoa) => nomePlataforma(pessoa.plataforma),
        },
        {
          id: "valor",
          titulo: "Valor pago",
          className: NUMERO,
          csv: (pessoa) => formatarReais(pessoa.valorPago),
          celula: (pessoa) => formatarReais(pessoa.valorPago),
        },
        {
          id: "alertas",
          titulo: "Alertas",
          className: "min-w-48 whitespace-normal",
          csv: (pessoa) => pessoa.alertas.join(" | "),
          celula: (pessoa) =>
            pessoa.alertas.length === 0 ? (
              "—"
            ) : (
              <span className="flex flex-wrap gap-1">
                {pessoa.alertas.map((alerta) => (
                  <Badge key={alerta} variant={tomDoAlerta(alerta)}>
                    {alerta}
                  </Badge>
                ))}
              </span>
            ),
        },
      ]}
    />
  )
}

export function AbaReembolsos({ resultado }: { resultado: ResultadoProcessamento }) {
  const total = formatarReais(resultado.stats.totalReembolsar)
  return (
    <TabelaPaginada
      itens={resultado.reembolsos}
      nomeArquivo="reembolsos.csv"
      vazio="Nenhum reembolso."
      busca={(item, termo) => combinaPessoa(item.nome, item.cpfFormatado ?? item.cpf, termo)}
      rodape={
        <p className="text-base font-semibold tabular-nums">
          Total a devolver: {total} em {resultado.reembolsos.length} reembolsos.
        </p>
      }
      colunas={[
        { id: "nome", titulo: "Nome", csv: (item) => item.nome, celula: (item) => item.nome },
        {
          id: "cpf",
          titulo: "CPF",
          csv: (item) => item.cpfFormatado,
          celula: (item) => textoOuTraco(item.cpfFormatado),
        },
        {
          id: "plataforma",
          titulo: "Plataforma",
          csv: (item) => nomePlataforma(item.plataforma),
          celula: (item) => nomePlataforma(item.plataforma),
        },
        { id: "motivo", titulo: "Motivo", csv: (item) => item.motivoTexto, celula: (item) => item.motivoTexto },
        {
          id: "pago",
          titulo: "Pago",
          className: NUMERO,
          csv: (item) => formatarReais(item.pago),
          celula: (item) => formatarReais(item.pago),
        },
        {
          id: "devolver",
          titulo: "Devolver",
          className: NUMERO,
          csv: (item) => formatarReais(item.devolver),
          celula: (item) => formatarReais(item.devolver),
        },
      ]}
    />
  )
}

export function AbaKit({ pessoas }: { pessoas: readonly Inscrito[] }) {
  const itens = useMemo(() => listarKit(pessoas), [pessoas])
  return (
    <TabelaPaginada
      itens={itens}
      nomeArquivo="kit.csv"
      vazio="Ninguém para retirar kit."
      busca={(item, termo) => combinaPessoa(item.nome, item.cpf, termo)}
      colunas={[
        { id: "nome", titulo: "Nome", csv: (item) => item.nome, celula: (item) => item.nome },
        { id: "cpf", titulo: "CPF", csv: (item) => item.cpf, celula: (item) => textoOuTraco(item.cpf) },
        { id: "percurso", titulo: "Percurso", csv: (item) => item.percurso, celula: (item) => textoOuTraco(item.percurso) },
        { id: "camiseta", titulo: "Camiseta", csv: (item) => item.camiseta, celula: (item) => item.camiseta },
        {
          id: "observacao",
          titulo: "Observação",
          className: "min-w-48 whitespace-normal",
          csv: (item) => item.observacao,
          celula: (item) => textoOuTraco(item.observacao),
        },
      ]}
    />
  )
}

type SmsProps = {
  pessoas: readonly Inscrito[]
  largada: string
  retirada: string
  onLargada: (valor: string) => void
  onRetirada: (valor: string) => void
}

export function AbaSms({ pessoas, largada, retirada, onLargada, onRetirada }: SmsProps) {
  const texto = montarTextoBase(largada, retirada)
  const mensagens = useMemo(() => listarSms(pessoas, texto), [pessoas, texto])
  const fora = pessoas.length - mensagens.length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="largada">Largada</Label>
          <Input id="largada" value={largada} onChange={(evento) => onLargada(evento.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="retirada">Retirada do kit</Label>
          <Input id="retirada" value={retirada} onChange={(evento) => onRetirada(evento.target.value)} />
        </div>
      </div>
      <p className="text-sm text-pretty">{texto}</p>
      <p className="text-xs text-muted-foreground">Texto-base: {texto.length} caracteres. Nenhuma mensagem é enviada daqui.</p>
      <p className="text-xs text-muted-foreground">
        Sem data de nascimento, a pessoa recebe “Responda com a sua data de nascimento.” Percurso a confirmar pede a
        resposta do percurso. Menor de idade recebe o lembrete da autorização.
      </p>
      {fora > 0 ? (
        <p className="text-sm">
          {fora === 1 ? "1 pessoa ficou de fora" : `${fora} pessoas ficaram de fora`} por telefone inválido.
        </p>
      ) : null}
      <TabelaPaginada
        itens={mensagens}
        nomeArquivo="sms.csv"
        vazio="Nenhuma mensagem com telefone válido."
        busca={(item, termo) => combinaPessoa(item.nome, item.telefone, termo)}
        colunas={[
          { id: "nome", titulo: "Nome", csv: (item) => item.nome, celula: (item) => item.nome },
          { id: "telefone", titulo: "Telefone", csv: (item) => item.telefone, celula: (item) => item.telefone },
          {
            id: "mensagem",
            titulo: "Mensagem",
            className: "min-w-72 whitespace-normal",
            csv: (item) => item.mensagem,
            celula: (item) => item.mensagem,
          },
          {
            id: "caracteres",
            titulo: "Caracteres",
            className: NUMERO,
            csv: (item) => item.caracteres,
            celula: (item) => item.caracteres,
          },
        ]}
      />
    </div>
  )
}

export function AbaAlertas({ resultado }: { resultado: ResultadoProcessamento }) {
  const itens = useMemo(() => listarAlertas(resultado), [resultado])
  return (
    <TabelaPaginada
      itens={itens}
      nomeArquivo="alertas.csv"
      vazio="Nenhum alerta."
      busca={(item, termo) => combinaPessoa(item.nome, item.cpf, termo)}
      colunas={[
        { id: "nome", titulo: "Nome", csv: (item) => item.nome, celula: (item) => item.nome },
        { id: "cpf", titulo: "CPF", csv: (item) => item.cpf, celula: (item) => textoOuTraco(item.cpf) },
        {
          id: "alerta",
          titulo: "Alerta",
          className: "whitespace-normal",
          csv: (item) => item.alerta,
          celula: (item) => item.alerta,
        },
        {
          id: "situacao",
          titulo: "Situação",
          csv: (item) => (item.situacao === "pendente" ? "Pendente" : "Confirmado"),
          celula: (item) => (
            <Badge variant={item.situacao === "pendente" ? "warning" : "success"}>
              {item.situacao === "pendente" ? "Pendente" : "Confirmado"}
            </Badge>
          ),
        },
      ]}
    />
  )
}
