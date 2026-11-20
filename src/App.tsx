import { useEffect, useRef, useState } from "react"
import { AbaAlertas, AbaInscritos, AbaKit, AbaReembolsos, AbaSms } from "./components/listas.tsx"
import { Parametros } from "./components/parametros.tsx"
import { Resumo } from "./components/resumo.tsx"
import { UploadCsv } from "./components/upload-csv.tsx"
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert.tsx"
import { Button } from "./components/ui/button.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs.tsx"
import { CONFIG_PADRAO } from "./lib/rules.ts"
import { LARGADA_PADRAO, RETIRADA_PADRAO } from "./lib/sms.ts"
import type { ConfigProva, InscricaoNormalizada, ResultadoProcessamento } from "./lib/types.ts"
import { processarArquivo, recalcular } from "./processamento.ts"

function ehCsv(arquivo: File): boolean {
  return arquivo.name.toLowerCase().endsWith(".csv") || arquivo.type.includes("csv")
}

export default function App() {
  const [config, setConfig] = useState<ConfigProva>(CONFIG_PADRAO)
  const [largada, setLargada] = useState(LARGADA_PADRAO)
  const [retirada, setRetirada] = useState(RETIRADA_PADRAO)
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null)
  const [linhas, setLinhas] = useState<InscricaoNormalizada[] | null>(null)
  const [resultado, setResultado] = useState<ResultadoProcessamento | null>(null)
  const [avisos, setAvisos] = useState<string[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [escuro, setEscuro] = useState(() => document.documentElement.classList.contains("dark"))

  const configRef = useRef(config)
  const linhasRef = useRef(linhas)
  const versao = useRef(0)
  const carregandoArquivo = useRef(false)

  useEffect(() => {
    const evitar = (evento: DragEvent) => evento.preventDefault()
    window.addEventListener("dragover", evitar)
    window.addEventListener("drop", evitar)
    return () => {
      window.removeEventListener("dragover", evitar)
      window.removeEventListener("drop", evitar)
    }
  }, [])

  function alternarTema() {
    const ativo = document.documentElement.classList.toggle("dark")
    localStorage.setItem("rune-tema", ativo ? "escuro" : "claro")
    setEscuro(ativo)
  }

  function aplicarConfig(proxima: ConfigProva) {
    configRef.current = proxima
    setConfig(proxima)
    const atuais = linhasRef.current
    if (!atuais || carregandoArquivo.current) return
    const id = ++versao.current
    setProcessando(true)
    void recalcular(atuais, proxima).then((proximo) => {
      if (id !== versao.current) return
      setResultado(proximo)
      setProcessando(false)
    })
  }

  async function aoArquivo(arquivo: File) {
    const id = ++versao.current
    setErro(null)
    setAvisos([])
    if (!ehCsv(arquivo)) {
      setErro("Envie um arquivo CSV.")
      setResultado(null)
      setLinhas(null)
      linhasRef.current = null
      setNomeArquivo(arquivo.name)
      return
    }

    carregandoArquivo.current = true
    setProcessando(true)
    setNomeArquivo(arquivo.name)
    let texto: string
    try {
      texto = await arquivo.text()
    } catch {
      if (id !== versao.current) return
      carregandoArquivo.current = false
      setProcessando(false)
      setErro("Não foi possível ler o arquivo.")
      return
    }

    const configInicial = configRef.current
    const resposta = await processarArquivo(texto, configInicial)
    if (id !== versao.current) return
    carregandoArquivo.current = false

    if (!resposta.ok) {
      setErro(resposta.erro)
      setResultado(null)
      setLinhas(null)
      linhasRef.current = null
      setAvisos([])
      setProcessando(false)
      return
    }

    linhasRef.current = resposta.linhas
    setLinhas(resposta.linhas)
    setAvisos(resposta.avisos)
    setErro(null)

    if (configRef.current === configInicial) {
      setResultado(resposta.resultado)
      setProcessando(false)
      return
    }

    const proximo = await recalcular(resposta.linhas, configRef.current)
    if (id !== versao.current) return
    setResultado(proximo)
    setProcessando(false)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-ink px-2.5 text-base leading-none font-semibold tracking-tight text-rune-white"
          >
            rune<span className="text-primary">.</span>
          </span>
          <div className="min-w-0">
            <h1 className="text-[1.75rem] leading-none font-bold tracking-tight">Rune</h1>
            <p className="mt-1 text-xs text-muted-foreground">Every race, in sync</p>
          </div>
        </div>
        <Button type="button" variant="outline" className="shrink-0" onClick={alternarTema}>
          {escuro ? "Tema claro" : "Tema escuro"}
        </Button>
      </header>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Suba o CSV das inscrições e baixe as listas de inscritos, reembolsos, kit e SMS.
      </p>

      <Parametros config={config} onChange={aplicarConfig} />
      <UploadCsv nomeArquivo={nomeArquivo} processando={processando} onArquivo={(arquivo) => void aoArquivo(arquivo)} />

      {erro ? (
        <Alert variant="destructive">
          <AlertTitle>Não deu para usar este arquivo</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      ) : null}

      {avisos.length > 0 ? (
        <Alert variant="warning">
          <AlertTitle>Atenção na leitura</AlertTitle>
          <AlertDescription>
            {avisos.map((aviso) => (
              <span key={aviso} className="block">
                {aviso}
              </span>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}

      {resultado && linhas && linhas.length === 0 ? (
        <Alert variant="info">
          <AlertTitle>Arquivo sem inscrições</AlertTitle>
          <AlertDescription>O cabeçalho foi reconhecido, mas não há linhas para processar.</AlertDescription>
        </Alert>
      ) : null}

      {resultado ? (
        <Tabs key={nomeArquivo ?? "sem-arquivo"} defaultValue="resumo" className="gap-4">
          <TabsList>
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="inscritos">Inscritos</TabsTrigger>
            <TabsTrigger value="reembolsos">Reembolsos</TabsTrigger>
            <TabsTrigger value="kit">Kit e camisetas</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
          </TabsList>
          <TabsContent value="resumo">
            <Resumo resultado={resultado} />
          </TabsContent>
          <TabsContent value="inscritos">
            <AbaInscritos pessoas={resultado.ativos} />
          </TabsContent>
          <TabsContent value="reembolsos">
            <AbaReembolsos resultado={resultado} />
          </TabsContent>
          <TabsContent value="kit">
            <AbaKit pessoas={resultado.ativos} />
          </TabsContent>
          <TabsContent value="sms">
            <AbaSms
              pessoas={resultado.ativos}
              largada={largada}
              retirada={retirada}
              onLargada={setLargada}
              onRetirada={setRetirada}
            />
          </TabsContent>
          <TabsContent value="alertas">
            <AbaAlertas resultado={resultado} />
          </TabsContent>
        </Tabs>
      ) : (
        <p className="text-sm text-muted-foreground">
          Quando o arquivo entrar, as abas mostram o resumo, os inscritos, os reembolsos, a retirada de kit, os SMS e os
          alertas.
        </p>
      )}
    </main>
  )
}
