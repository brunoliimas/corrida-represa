import { baixarCsv, formatarReais, gerarCsv } from "../lib/export.ts"
import type { Camiseta, ResultadoProcessamento } from "../lib/types.ts"
import { Button } from "./ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

const TAMANHOS: Camiseta[] = ["P", "M", "G", "GG"]

type Propriedades = {
  resultado: ResultadoProcessamento
}

export function Resumo({ resultado }: Propriedades) {
  const { stats, camisetas } = resultado
  const tamanhos = camisetas.confirmados["?"] > 0 || camisetas.pendentes["?"] > 0 ? [...TAMANHOS, "?" as const] : TAMANHOS

  function baixar() {
    const indicadores: (string | number)[][] = [
      ["Linhas lidas", stats.linhas],
      ["Pessoas únicas", stats.pessoasUnicas],
      ["Duplicadas", stats.duplicadas],
      ["Confirmados", stats.confirmados],
      ["Pendentes", stats.pendentes],
      ["Desistências", stats.desistencias],
      ["Total a reembolsar", formatarReais(stats.totalReembolsar)],
      ["Inscritos com alerta", stats.inscritosComAlerta],
      ["Conciliação fecha", stats.conciliacaoFecha ? "sim" : "não"],
    ]
    const camisas = tamanhos.map((tamanho) => [
      tamanho,
      camisetas.confirmados[tamanho],
      camisetas.pendentes[tamanho],
    ])
    baixarCsv(
      "resumo.csv",
      `${gerarCsv(["Indicador", "Valor"], indicadores)}\r\n${gerarCsv(["Tamanho", "Confirmados", "Se pagarem"], camisas).replace(/^\uFEFF/, "")}`,
    )
  }

  const cartoes = [
    ["Linhas lidas", String(stats.linhas)],
    ["Pessoas únicas", String(stats.pessoasUnicas)],
    ["Duplicadas", String(stats.duplicadas)],
    ["Confirmados", String(stats.confirmados)],
    ["Pendentes", String(stats.pendentes)],
    ["Desistências", String(stats.desistencias)],
    ["Total a reembolsar", formatarReais(stats.totalReembolsar)],
    ["Inscritos com alerta", String(stats.inscritosComAlerta)],
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={baixar}>
          Baixar CSV
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cartoes.map(([rotulo, valor]) => (
          <Card key={rotulo} size="sm">
            <CardHeader>
              <CardDescription>{rotulo}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{valor}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div
        className={
          stats.conciliacaoFecha
            ? "rounded-xl bg-green-50 px-4 py-3 text-green-800 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-200 dark:ring-green-900"
            : "rounded-xl bg-red-50 px-4 py-3 text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
        }
      >
        <p className="text-sm">linhas = confirmados + pendentes + desistências + duplicadas</p>
        <p className="mt-1 text-lg font-medium tabular-nums">
          {stats.linhas} = {stats.confirmados} + {stats.pendentes} + {stats.desistencias} + {stats.duplicadas}
        </p>
        <p className="mt-1 text-sm">{stats.conciliacaoFecha ? "A conta fecha." : "A conta não fecha."}</p>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Camisetas</CardTitle>
          <CardDescription>Confirmados e, à parte, quem ainda pode pagar.</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tamanho</TableHead>
              <TableHead>Confirmados</TableHead>
              <TableHead>Se pagarem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tamanhos.map((tamanho) => (
              <TableRow key={tamanho}>
                <TableCell>{tamanho}</TableCell>
                <TableCell className="tabular-nums">{camisetas.confirmados[tamanho]}</TableCell>
                <TableCell className="tabular-nums">{camisetas.pendentes[tamanho]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
