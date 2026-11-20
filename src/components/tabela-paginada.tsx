import { useId, useState, type ReactNode } from "react"
import { baixarCsv, gerarCsv } from "../lib/export.ts"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

const POR_PAGINA = 50

type Coluna<T> = {
  id: string
  titulo: string
  className?: string
  celula: (item: T) => ReactNode
  csv: (item: T) => string | number | null | undefined
}

type Propriedades<T> = {
  itens: readonly T[]
  colunas: readonly Coluna<T>[]
  nomeArquivo: string
  busca: (item: T, termo: string) => boolean
  vazio: string
  rodape?: ReactNode
}

export function TabelaPaginada<T>({ itens, colunas, nomeArquivo, busca, vazio, rodape }: Propriedades<T>) {
  const campoId = useId()
  const [termo, setTermo] = useState("")
  const [pagina, setPagina] = useState(0)
  const filtrados = termo.trim() ? itens.filter((item) => busca(item, termo)) : itens
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas - 1)
  const inicio = paginaAtual * POR_PAGINA
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA)
  const fim = inicio + visiveis.length

  function baixar() {
    baixarCsv(
      nomeArquivo,
      gerarCsv(
        colunas.map((coluna) => coluna.titulo),
        itens.map((item) => colunas.map((coluna) => coluna.csv(item))),
      ),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid w-full gap-1.5 sm:max-w-sm">
          <Label htmlFor={campoId}>Buscar por nome ou CPF</Label>
          <Input
            id={campoId}
            value={termo}
            placeholder="Nome ou CPF"
            onChange={(evento) => {
              setTermo(evento.target.value)
              setPagina(0)
            }}
          />
        </div>
        <Button type="button" variant="outline" onClick={baixar}>
          Baixar CSV
        </Button>
      </div>

      {visiveis.length === 0 ? (
        <p className="text-sm text-muted-foreground">{itens.length === 0 ? vazio : "Nenhuma pessoa encontrada para esta busca."}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {colunas.map((coluna) => (
                <TableHead key={coluna.id} className={coluna.className}>
                  {coluna.titulo}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((item, indice) => (
              <TableRow key={`${inicio + indice}`}>
                {colunas.map((coluna) => (
                  <TableCell key={coluna.id} className={coluna.className}>
                    {coluna.celula(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filtrados.length === 0
            ? "0 pessoas"
            : `Mostrando ${inicio + 1}–${fim} de ${filtrados.length}`}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" disabled={paginaAtual === 0} onClick={() => setPagina(paginaAtual - 1)}>
            Anterior
          </Button>
          <span className="text-sm tabular-nums">
            Página {paginaAtual + 1} de {totalPaginas}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={paginaAtual >= totalPaginas - 1}
            onClick={() => setPagina(paginaAtual + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
      {rodape}
    </div>
  )
}
