# Contexto

Construa o app "Rune · Every race, in sync".

A organizadora (Sônia, leiga em tecnologia) tem um CSV consolidado de 3 plataformas de inscrição (CorreJá, InscriçãoFácil, site do evento) com dados sujos. Ela precisa de 4 saidas: (1) lista limpa de inscritos com categoria, (2) quem reembolsar e quanto, (3) lista de retirada de kit com contagem de camisetas por tamanho, (4) SMS para todos. O app deve funcionar com 100 ou 10 mil linhas, hoje e nos próximos meses, sem ninguém refazer nada na mão. Ela sobe o CSV e baixa as listas.

# Stack

- Vite + React 19 + TypeScript (strict). Sem backend: todo o processamento roda no navegador e nenhum dado sai dele.
- Tailwind CSS v4 + shadcn/ui (Button, Card, Tabs, Table, Badge, Input, Label, Collapsible, Alert).
- papaparse para ler CSV (detectar `,` ou `;`, remover BOM, aceitar aspas).
- Vitest para testes. Sem date-fns: tratar datas em UTC com funções próprias.
- Interface 100% em português do Brasil, com suporte a tema claro/escuro. Usar “ ” e ’ nos textos visíveis.

# Arquitetura (importante)

Toda regra de negócio fica em `src/lib/` como funções puras, sem React, testáveis:

- `parse.ts`: CSV, normalização de datas, valores, CPF, telefone, percurso, camiseta.
- `rules.ts`: `processarInscricoes(linhas, config)` devolve `{ ativos, pendentes, reembolsos, duplicadas, camisetas, stats }`.
- `sms.ts`: monta a mensagem de cada pessoa.
- `export.ts`: gera CSV (separador `;`, BOM UTF-8, aspas escapadas) e dispara download via Blob.
- A UI só chama essas funções. Pasta `src/components/` para a UI.

# Formato do CSV (colunas)

`id, origem, nome, cpf, nascimento, sexo, distancia, camiseta, valor_pago, data_pagamento, status, email, telefone, obs`

Os cabeçalhos devem ser normalizados (minúsculas, sem acento, espaços viram `_`).

Sujeiras que existem nos dados reais (tratar todas):
- Datas em `AAAA-MM-DD`, `DD/MM/AAAA`, `DD-MM-AAAA` e `DD/MM/AA` (ano de 2 dígitos: >26 é 19xx, senão 20xx). Data de nascimento vazia ou `01/01/1900` = sem data válida.
- Valor pago em vários formatos: `R$ 99,00`, `99.00`, `99,00`, `99` e `R$ 44,50`, `44.50`, `44,50`, `49.50`, `R$ 0,00` (pendente). Mesmo valor, escritas diferentes: com ou sem "R$", ponto ou vírgula decimal, ou inteiro sem decimais. Converter tudo para número. Quando houver vírgula e o ponto (se houver), ela é o separador decimal.
- CPF com e sem pontuação. CPF é a chave de identidade (homônimos com CPF diferente NÃO são duplicados).
- Nomes em CAIXA ALTA ou minúscula (exibir em Title Case).
- Percurso: variações de 5 km, 10 km e meia maratona (`5k`, `5 km`, `10K`, `Meia`, `21,1 km`, `21097m`) viram 5, 10 ou 21.
- Camiseta: `P/M/G/GG`, `S/L/XL` e `Pequena/Média/Grande/Extra Grande`. Mapear: S→P, L→G, XL→GG, Pequena→P, Média→M, Grande→G, Extra Grande→GG. Qualquer outro valor vira "?" e gera alerta.
- Telefone com máscara variada e prefixo 55 opcional. Válido = 11 dígitos após remover o 55. Formatar `(11) 99999-9999`.
- `status` pode ser "Pendente" (não pagou). `obs` pode conter pedido de reembolso em texto livre com data (`pediu dia 03/12`; sem ano = ano da prova).

# Regras de negócio (todas configuráveis em um painel de parâmetros, com estes valores padrão)

- Data da prova: 2025-12-07. Idade para categoria e desconto = idade completada NESSA data.
- Lote 1: R$ 89 se `data_pagamento` ≤ 2025-10-31; lote 2: R$ 99 depois. Quem tem 60+ paga metade (R$ 44,50 / R$ 49,50).
- Categoria = percurso (5/10/21 km) + sexo + faixa de 5 anos. Ex.: "10 km · Feminino · 30 a 34". Sem data de nascimento ou sem sexo = "Sem categoria".
- Duplicados: agrupar por CPF. Vale a inscrição não pendente com pagamento mais antigo; as demais vão para Reembolsos com devolução integral do valor pago. Se as inscrições duplicadas tiverem percursos diferentes, NÃO decidir: marcar "confirmar percurso com a pessoa" e a categoria fica "(percurso a confirmar)". Camiseta duplicada conta uma vez.
- Reembolso por desistência (via `obs` com palavras como reembolso, cancel, desist, devol): se o pedido foi até 7 dias antes da prova (inclusive o 7º dia) devolve 100% do valor pago, depois disso 50%. Quem desistiu sai das listas de kit, camisetas e SMS. Pedido sem data legível = alerta, sem reembolso automático.
- Desconto 60+ não aplicado: se pagou mais que o esperado, entra em Reembolsos com a diferença. Se pagou menos, só alerta.
- Reembolso sobre o valor pago, sem descontar taxa de plataforma (parâmetro "taxa de plataforma %" começando em 0).
- Pendentes: ficam fora dos inscritos, aparecem numa lista própria e contam à parte nas camisetas ("se pagarem").
- Menores de 18: alerta "conferir autorização dos pais" (aparece na lista de kit).
- Telefone inválido: fica fora do SMS, com alerta.

# Saídas e telas

Tela única com upload (arrastar e soltar ou botão) e abas:

1. **Resumo**: cards (linhas lidas, pessoas únicas, duplicadas, confirmados, pendentes, desistências, total a reembolsar, inscritos com alerta). Mostrar a conciliação em destaque: `linhas = confirmados + pendentes + desistências + duplicadas`, em verde se fechar e em vermelho se não. Tabela de camisetas por tamanho (P, M, G, GG) com confirmados e pendentes.
2. **Inscritos**: id, nome, CPF, sexo, nascimento, idade, percurso, categoria, camiseta, plataforma, valor pago, alertas.
3. **Reembolsos**: nome, CPF, plataforma, motivo, pago, devolver, com o total ao final.
4. **Kit e camisetas**: lista de retirada ordenada por nome (nome, CPF, percurso, camiseta, observação).
5. **SMS**: nome, telefone, mensagem. Texto-base editável com campos "largada" e "retirada do kit". Padrão: "Corrida da Represa: sua largada é domingo 07/12 às 6h30, na entrada da Represa. Retire seu kit no sábado 06/12, das 9h às 17h, no ginásio municipal. Boa prova!". Acrescentar frases extras: sem data de nascimento → pedir que responda com a data; percurso duplicado → pedir que responda qual percurso quer; menor → lembrar da autorização. Mostrar contador de caracteres. NÃO enviar SMS de verdade, só gerar a lista.
6. **Alertas**: tudo que exige ação humana (percurso a confirmar, sem nascimento, menor, pendente, camiseta ou telefone inválido, pagamento divergente).

Cada aba tem "Baixar CSV". As tabelas devem ser paginadas (50 por página) com busca por nome ou CPF, para aguentar 10 mil linhas. Se o arquivo for grande, processar em Web Worker para não travar a tela. Mostrar mensagem clara em português se o arquivo não tiver as colunas esperadas, listando quais faltam.

# Testes (obrigatórios)

Copiar o CSV real para `tests/fixtures/inscritos_corrida.csv`. Teste de snapshot com estes números (devem bater exatamente):
- 373 linhas, 362 CPFs únicos, 11 duplicadas.
- 358 confirmados, 1 pendente, 3 desistências (uma integral em 30/11, uma integral em 15/11 e uma de 50% em 03/12).
- Total a devolver: R$ 1.410,00 em 18 reembolsos (11 duplicadas + 4 de desconto 60+ + 3 desistências).
- Camisetas confirmadas: P 69, M 157, G 99, GG 33. Pendentes: 1 GG.
- 3 inscritos com percurso a confirmar (5/10 km, 10/21 km, 5/10 km), 3 menores de 18, 9 sem data de nascimento válida.

Testes unitários das bordas: pagamento em 31/10 (89) e 01/11 (99); aniversário de 60 anos na véspera, no dia e no dia seguinte da prova; pedido de reembolso em 30/11 (integral) e em 01/12 (50%); CPF com e sem máscara; homônimos com CPF diferente não são mesclados; valor `R$ 44,50`; os 4 formatos de data.

# Critérios de aceite

- `pnpm dev` abre o app; `pnpm test` passa; `pnpm build` gera um site estático.
- Mudar um parâmetro (ex.: prazo de reembolso para 5 dias) recalcula tudo na hora.
- Rodar com um CSV de 10 mil linhas gerado por script sem travar a interface.
- README curto em português: como usar, as regras e as premissas assumidas.

# Fora do escopo (não fazer)

Envio real de SMS, login, banco de dados, integração direta com as plataformas, pagamento de reembolsos.