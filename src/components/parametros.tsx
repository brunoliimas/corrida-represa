import type { ReactNode } from "react"
import { cn } from "cn"
import { buttonVariants } from "./ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import type { ConfigProva } from "../lib/types.ts"

type Propriedades = {
  config: ConfigProva
  onChange: (config: ConfigProva) => void
}

export function Parametros({ config, onChange }: Propriedades) {
  function atualizar<Chave extends keyof ConfigProva>(chave: Chave, valor: ConfigProva[Chave]) {
    onChange({ ...config, [chave]: valor })
  }

  function aoNumero(chave: keyof ConfigProva, texto: string) {
    if (texto.trim() === "") return
    const valor = Number(texto)
    if (Number.isFinite(valor)) atualizar(chave, valor)
  }

  return (
    <Collapsible defaultOpen className="rounded-xl ring-1 ring-foreground/10">
      <CollapsibleTrigger
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-auto min-h-10 w-full flex-wrap justify-between gap-x-3 rounded-xl px-4 py-2 text-left whitespace-normal",
        )}
      >
        <span>Parâmetros da prova</span>
        <span className="text-sm font-normal text-muted-foreground">Qualquer mudança recalcula as listas</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-4 px-4 pt-1 pb-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo id="data-prova" rotulo="Data da prova">
          <Input
            id="data-prova"
            type="date"
            value={config.dataProva}
            onChange={(evento) => {
              if (evento.target.value) atualizar("dataProva", evento.target.value)
            }}
          />
        </Campo>
        <Campo id="limite-lote" rotulo="Limite do lote 1">
          <Input
            id="limite-lote"
            type="date"
            value={config.dataLimiteLote1}
            onChange={(evento) => {
              if (evento.target.value) atualizar("dataLimiteLote1", evento.target.value)
            }}
          />
        </Campo>
        <Campo id="preco-lote-1" rotulo="Preço do lote 1">
          <Input
            id="preco-lote-1"
            type="number"
            min={0}
            step="0.01"
            value={config.precoLote1}
            onChange={(evento) => aoNumero("precoLote1", evento.target.value)}
          />
        </Campo>
        <Campo id="preco-lote-2" rotulo="Preço do lote 2">
          <Input
            id="preco-lote-2"
            type="number"
            min={0}
            step="0.01"
            value={config.precoLote2}
            onChange={(evento) => aoNumero("precoLote2", evento.target.value)}
          />
        </Campo>
        <Campo id="idade-desconto" rotulo="Idade da meia-entrada">
          <Input
            id="idade-desconto"
            type="number"
            min={0}
            step="1"
            value={config.idadeDesconto}
            onChange={(evento) => aoNumero("idadeDesconto", evento.target.value)}
          />
        </Campo>
        <Campo id="dias-reembolso" rotulo="Dias de reembolso integral">
          <Input
            id="dias-reembolso"
            type="number"
            min={0}
            step="1"
            value={config.diasReembolsoIntegral}
            onChange={(evento) => aoNumero("diasReembolsoIntegral", evento.target.value)}
          />
        </Campo>
        <Campo id="taxa" rotulo="Taxa da plataforma (%)">
          <Input
            id="taxa"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={config.taxaPlataforma}
            onChange={(evento) => aoNumero("taxaPlataforma", evento.target.value)}
          />
        </Campo>
        <Campo id="idade-menor" rotulo="Idade para autorização">
          <Input
            id="idade-menor"
            type="number"
            min={0}
            step="1"
            value={config.idadeMenor}
            onChange={(evento) => aoNumero("idadeMenor", evento.target.value)}
          />
        </Campo>
      </CollapsibleContent>
    </Collapsible>
  )
}

function Campo({ id, rotulo, children }: { id: string; rotulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
    </div>
  )
}
