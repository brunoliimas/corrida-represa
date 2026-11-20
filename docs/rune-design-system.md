# rune.

## Every race, in sync.

# Design system

**Diretrizes visuais e orientações para implementação**

------------------------------------------------------------------------

## Sobre este documento

Reuni aqui as decisões visuais que quero seguir no Rune. A ideia é usar
o mesmo padrão em todas as telas, sem transformar a interface em algo
carregado ou difícil de usar. O produto será usado para organizar
inscrições, pagamentos, retirada de kits e comunicação com
participantes; por isso, a informação precisa vir antes da decoração.

A referência principal é o próprio logo: fundo escuro azulado, letras
brancas e o ponto violeta. A interface parte dessa combinação, mas
também precisa funcionar bem no tema claro.

### O que quero preservar

Uma interface limpa, com poucos elementos competindo pela atenção. O
violeta deve aparecer nos lugares importantes --- ações principais,
seleção e navegação ativa. O restante fica em tons neutros. As cores de
status entram apenas quando ajudam a entender uma situação.

------------------------------------------------------------------------

# 1. Cores

Estas são as cores que devem orientar a interface. Os valores abaixo são
a referência para os componentes e os estilos globais.

  -----------------------------------------------------------------------
  Cor                     HEX                     Onde usar
  ----------------------- ----------------------- -----------------------
  Rune Ink                `#080A18`               Fundo escuro e áreas
                                                  principais

  Rune Violet             `#503BF3`               Botões principais,
                                                  seleção e links de ação

  Electric Violet         `#7969FF`               Destaques e estados de
                                                  hover no tema escuro

  Lavender                `#F0EDFF`               Fundo de itens
                                                  selecionados no tema
                                                  claro

  Rune White              `#FEFEFF`               Texto sobre fundo
                                                  escuro e superfícies
                                                  claras

  Slate                   `#272B42`               Bordas e divisórias no
                                                  tema escuro
  -----------------------------------------------------------------------

### Cores para estados

Além das cores da marca, vou usar quatro cores funcionais. Elas precisam
manter o mesmo significado em todo o sistema:

  Estado       HEX         Exemplo
  ------------ ----------- -----------------------------------------------
  Sucesso      `#16845B`   Pagamento confirmado ou conciliação concluída
  Atenção      `#A96512`   Pendência que precisa ser verificada
  Erro         `#D92D45`   Dado inválido ou divergência
  Informação   `#2563A6`   Avisos e orientações gerais

Não quero usar cores só para enfeitar. Verde, amarelo e vermelho devem
indicar situações reais. Sempre que possível, o status também deve
aparecer escrito, e não depender apenas da cor.

------------------------------------------------------------------------

# 2. Tema claro e tema escuro

O tema escuro conversa melhor com o logo e funciona como referência
principal da marca. Mesmo assim, o tema claro precisa ser tratado como
uma opção completa, não como uma versão improvisada. Os dois temas devem
usar os mesmos componentes e a mesma hierarquia.

  Token                Tema claro   Tema escuro
  -------------------- ------------ -------------
  `background`         `#F7F8FC`    `#080A18`
  `foreground`         `#101326`    `#F4F5FB`
  `card`               `#FFFFFF`    `#101326`
  `popover`            `#FFFFFF`    `#14182D`
  `primary`            `#503BF3`    `#7969FF`
  `secondary`          `#EEF0F7`    `#1A1E35`
  `muted`              `#F0F1F6`    `#171B30`
  `muted-foreground`   `#70758B`    `#A0A5BB`
  `accent`             `#F0EDFF`    `#211B4B`
  `border`             `#E4E6EF`    `#272B42`
  `input`              `#D9DCE8`    `#30354F`

Na implementação, usar variáveis CSS semânticas compatíveis com
shadcn/ui. Assim, os componentes recebem nomes como `background`,
`foreground`, `primary` e `muted`, em vez de valores hexadecimais
espalhados pelo código.

------------------------------------------------------------------------

# 3. Tipografia

Quero usar Inter na interface. É neutra, tem boa leitura em tamanhos
pequenos e funciona bem em tabelas. O logo mantém o lettering próprio;
não precisa ser reproduzido com a fonte do sistema.

  Uso                        Tamanho   Peso
  ------------------------ --------- ------
  Título da página              28px    700
  Título de seção               20px    600
  Título de card                16px    600
  Texto padrão                  14px    400
  Texto auxiliar                12px    400
  Números de indicadores        28px    700

Para valores, quantidades e colunas numéricas, usar números tabulares.
Isso ajuda a comparar os dados sem que os algarismos mudem de largura.

------------------------------------------------------------------------

# 4. Componentes e layout

A intenção é manter os componentes previsíveis. A pessoa que usa o
sistema não deve precisar reaprender a interface a cada aba.

  -----------------------------------------------------------------------
  Componente                          Padrão que quero seguir
  ----------------------------------- -----------------------------------
  Botão principal                     Violeta com texto branco. Reservado
                                      para a ação mais importante da
                                      tela.

  Botão secundário                    Fundo neutro. Para ações de apoio,
                                      como cancelar ou voltar.

  Botão outline                       Usar em ações menos frequentes,
                                      como exportar ou visualizar.

  Cards                               Fundo de superfície, borda
                                      discreta, raio de 12px e
                                      espaçamento consistente.

  Badges                              Pequenos e objetivos. Usar cores de
                                      status apenas quando houver
                                      significado.

  Inputs                              Label sempre visível, altura
                                      aproximada de 40px e mensagem de
                                      validação próxima ao campo.

  Tabelas                             Cabeçalho discreto, linhas
                                      legíveis, divisórias leves e
                                      números alinhados à direita.

  Alertas                             Explicar o que aconteceu e qual
                                      ação precisa ser tomada. Não
                                      depender só de ícone.
  -----------------------------------------------------------------------

### Medidas de referência

-   Sidebar: `248px`.
-   Header: `64px`.
-   Padding principal: `32px`.
-   Espaço entre cards: `16px`.
-   Cards com raio de `12px`.
-   Botões e campos com raio de `8px`.
-   Inputs com cerca de `40px` de altura.
-   Linhas de tabela com cerca de `48px`.

Essas medidas são uma base para desktop. Em telas menores, a navegação
deve se adaptar, os cards devem empilhar e as tabelas precisam continuar
utilizáveis. Não esconder informações importantes só para fazer tudo
caber.

------------------------------------------------------------------------

# 5. Aplicação nas telas do Rune

  -----------------------------------------------------------------------
  Tela                                Como deve funcionar visualmente
  ----------------------------------- -----------------------------------
  Resumo                              Dar destaque aos números principais
                                      e à conciliação das inscrições. A
                                      pessoa precisa perceber rapidamente
                                      se os totais fecham.

  Inscritos                           Priorizar a leitura da tabela, a
                                      busca por nome ou CPF e a
                                      identificação de alertas.

  Reembolsos                          Deixar os valores fáceis de
                                      conferir e mostrar o total a
                                      devolver ao final.

  Kit e camisetas                     Facilitar a conferência dos nomes,
                                      percursos e tamanhos na retirada.

  SMS                                 Deixar o texto editável, mostrar a
                                      contagem de caracteres e permitir
                                      conferir a mensagem antes de
                                      exportar.

  Alertas                             Reunir os casos que precisam de
                                      revisão humana e explicar o que
                                      deve ser conferido.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 6. Orientação para implementação no Cursor

O texto abaixo pode ser usado como instrução inicial no Cursor. A ideia
é aplicar o padrão visual ao projeto que já existe, sem mexer no
processamento dos dados.

> Leia este documento e use-o como referência visual do Rune.
>
> Antes de alterar qualquer coisa, percorra o projeto e entenda como as
> telas e os componentes estão organizados. Quero que você aplique a
> identidade visual descrita aqui, aproveitando o que já existe sempre
> que fizer sentido.
>
> O Rune deve ter uma interface limpa e fácil de entender. O logo usa
> fundo escuro, letras brancas e um ponto violeta. Traga essa combinação
> para o produto sem deixar todas as telas escuras ou exagerar no uso do
> violeta. O tema escuro é a referência principal, mas o tema claro
> também precisa ficar bem resolvido.
>
> Use Inter na interface. Centralize as cores em variáveis CSS
> semânticas compatíveis com Tailwind CSS v4 e shadcn/ui. Evite colocar
> códigos hex diretamente em cada componente. Use os tokens de tema
> claro e escuro deste documento.
>
> O violeta (`#503BF3`) deve aparecer principalmente em ações primárias,
> seleção e navegação ativa. No tema escuro, use o violeta mais claro
> (`#7969FF`) quando necessário para manter contraste. Use verde,
> amarelo, vermelho e azul apenas para indicar sucesso, atenção, erro e
> informação.
>
> Mantenha os componentes simples: - botões com hierarquia clara; -
> cards com bordas discretas; - campos com labels visíveis; - badges
> pequenos e objetivos; - tabelas fáceis de ler; - alertas que expliquem
> o problema e a ação necessária.
>
> Aplique o padrão nas telas Resumo, Inscritos, Reembolsos, Kit e
> camisetas, SMS e Alertas. Preste atenção especial à leitura das
> tabelas, aos valores monetários e aos indicadores do resumo.
>
> Não altere as regras de negócio, o processamento do CSV, os cálculos,
> os testes ou a arquitetura para fazer mudanças visuais. Não invente
> dados para preencher a interface e não remova funcionalidades
> existentes.
>
> Faça as alterações por partes. Ao terminar, confira o tema claro e o
> escuro, a responsividade e os estados de foco. Execute `pnpm test` e
> `pnpm build`. Depois, me diga quais arquivos foram modificados e se
> ficou alguma pendência.

### Antes de considerar pronto

-   Conferir as seis telas nos dois temas.
-   Verificar contraste e foco por teclado.
-   Confirmar que os componentes usam tokens compartilhados.
-   Testar a navegação em tela menor.
-   Garantir que nenhuma regra de negócio foi alterada.
-   Rodar os testes e o build.

Este documento define a direção visual. Ajustes pequenos podem ser
feitos durante a implementação, desde que mantenham a mesma lógica:
clareza, consistência e uso moderado das cores da marca.
