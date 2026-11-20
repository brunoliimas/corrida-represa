import { useRef, useState } from "react"
import { Button } from "./ui/button"

type Propriedades = {
  nomeArquivo: string | null
  processando: boolean
  onArquivo: (arquivo: File) => void
}

export function UploadCsv({ nomeArquivo, processando, onArquivo }: Propriedades) {
  const entrada = useRef<HTMLInputElement>(null)
  const [sobre, setSobre] = useState(false)

  return (
    <div
      className={
        sobre
          ? "rounded-xl border border-dashed border-primary bg-muted px-6 py-8 text-center"
          : "rounded-xl border border-dashed px-6 py-8 text-center"
      }
      onDragOver={(evento) => {
        evento.preventDefault()
        setSobre(true)
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(evento) => {
        evento.preventDefault()
        setSobre(false)
        const arquivo = evento.dataTransfer.files[0]
        if (arquivo) onArquivo(arquivo)
      }}
    >
      <input
        ref={entrada}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(evento) => {
          const arquivo = evento.target.files?.[0]
          if (arquivo) onArquivo(arquivo)
          evento.target.value = ""
        }}
      />
      <p className="text-base font-medium">Arraste o CSV para cá</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Ou escolha o arquivo no computador. Os dados não saem deste navegador.
      </p>
      <Button type="button" className="mt-4" onClick={() => entrada.current?.click()} disabled={processando}>
        Escolher arquivo
      </Button>
      {nomeArquivo ? <p className="mt-3 text-sm">Arquivo: {nomeArquivo}</p> : null}
      {processando ? (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          Lendo e organizando as inscrições…
        </p>
      ) : null}
    </div>
  )
}
