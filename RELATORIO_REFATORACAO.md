# Revisão e refatoração do OndeFica

Revisão realizada em 7 de outubro de 2026 sobre o frontend, backend, configuração, dados manuais, estilos e dependências fornecidos. O código completo refatorado foi aplicado diretamente nas pastas `FrontEnd` e `BackEnd`. A cópia anterior foi preservada em `.review/original`. Documentos e comentários do projeto foram tratados como material de referência; o escopo foi definido pelo pedido do usuário.

## Problemas encontrados e mudanças aplicadas

| Problema original                                                               | Mudança aplicada                                                                                                                                                       |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend em JS/JSX, modelos e navegação sem contrato verificado                 | Migração para TypeScript estrito, sem `any` explícito no código do app; modelos de API derivados do OpenAPI, navegação tipada e acesso a índices verificado.           |
| Expo SDK 53 e bibliotecas fora do alinhamento atual                             | Atualização para SDK 57, React 19.2.3 e React Native 0.86.3; versões nativas alinhadas pelo Expo.                                                                      |
| JWT em AsyncStorage                                                             | SecureStore em dispositivos; token somente em memória no navegador; remoção do token legado em texto simples.                                                          |
| Chave Google do servidor em URLs de fotos                                       | Proxy de foto com token assinado e expirável, host de redirecionamento validado, formatos e tamanho de imagem limitados.                                               |
| Segredo JWT padrão e configuração frágil                                        | pydantic-settings, chave obrigatória validada, arquivos `.env` ignorados e produção exigindo banco externo, HTTPS e migração explícita.                                |
| Login Google sem audiência explícita e IDs embutidos                            | Audiências configuradas apenas no servidor; email verificado e usuário ativo obrigatórios; transporte com timeout e erro seguro. Login email/senha mantido no Expo Go. |
| Tela inicial fazia consultas manuais e carregava hotéis antecipadamente         | TanStack Query para cache, cancelamento, retry limitado e atualização ao retomar conexão/app. Hotéis carregados somente nos detalhes.                                  |
| Listas renderizadas integralmente em ScrollView                                 | FlatList e SectionList; cartões memoizados e callbacks estáveis onde afetam listas. ScrollView permanece apenas em conteúdo de formulário/modal.                       |
| Listener de aparência sem ciclo de vida adequado, dimensões e estilos inválidos | useColorScheme, SafeAreaProvider/SafeAreaView, dimensões responsivas, StyleSheet memoizado e tema centralizado.                                                        |
| Programação local sem proprietário e favoritos voláteis                         | Endpoints persistentes autenticados, validação por usuário e restrição única de favorito. Importação explícita, atômica e idempotente dos dados antigos.               |
| Endpoints ausentes para CRUD de programação/favoritos                           | Rotas completas com schemas de entrada, resposta, paginação, códigos de erro e isolamento entre contas.                                                                |
| Datas inconsistentes, zero em coordenadas descartado e cálculos frágeis         | Datas ISO na API, apresentação local sem conversão UTC incorreta, coordenadas zero preservadas e cálculo de distância limitado numericamente.                          |
| Duas hospedagens podiam ocupar o mesmo período                                  | Validação de sobreposição em criação, edição e importação; períodos adjacentes permitidos; bloqueio por usuário em PostgreSQL.                                         |
| HTML do PDF interpolava textos externos diretamente                             | Escape de todo texto dinâmico, erros apresentados na UI e limpeza do arquivo temporário após compartilhamento.                                                         |
| I/O síncrono em rotas async e chamadas Google repetidas sem limite              | Rotas de banco síncronas adequadas ao thread pool, cliente HTTP assíncrono reutilizado no lifespan, semáforo de concorrência e caches TTL limitados.                   |
| Limpeza de cache acessível a qualquer usuário                                   | Allowlist explícita de administradores; vazio por padrão.                                                                                                              |
| CORS amplo, payloads sem limites e falhas com detalhes internos                 | Origens/métodos/headers explícitos, limite de corpo e parâmetros, rate limit por IP e exceções globais com ID de correlação sem mensagem sensível.                     |
| Ausência de migrações, requisitos Python e checagem de integração               | Alembic, requirements/locks com hashes, Ruff, mypy, Vitest, pytest e script que detecta divergência entre Pydantic/OpenAPI/TypeScript.                                 |
| Confirmações e cadastro dependiam de Alert na web                               | Diálogos compatíveis com navegador; diálogos nativos preservados em Android/iOS.                                                                                       |
| `.gitignore` do backend com conflito de merge                                   | Arquivos corrigidos; segredos, bancos locais, caches, builds e backup de revisão ignorados.                                                                            |

A proteção de entrada usa limites, tipos estritos, validação de datas/URLs, rejeição de campos extras e consultas SQLAlchemy parametrizadas. Texto legítimo é preservado no armazenamento; ao gerar HTML, é escapado. Remover palavras ou caracteres indiscriminadamente não substitui a proteção contra SQL injection/XSS.

## Bibliotecas e decisões

| Caso                   | Biblioteca/decisão final                                                     | Motivo                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Execução mobile        | Expo SDK 57 + dependências nativas recomendadas                              | Compatibilidade validada com Expo Doctor e export das plataformas.                                                                  |
| Estado remoto          | `@tanstack/react-query` v5                                                   | Cache, sincronização, loading/error/refetch, cancelamento e mutações.                                                               |
| Cliente API            | `openapi-fetch`                                                              | Checagem de caminhos, payloads e respostas diretamente pelo contrato. Evita duplicar um cliente Axios manual.                       |
| Credenciais mobile     | `expo-secure-store`                                                          | Armazenamento seguro suportado no Expo Go.                                                                                          |
| Preferências locais    | `@react-native-async-storage/async-storage`                                  | Adequado para tema/unidade de distância; não recebe tokens.                                                                         |
| Listas                 | FlatList / SectionList                                                       | Virtualização nativa suficiente para o catálogo atual, sem dependência adicional de FlashList.                                      |
| Navegação              | React Navigation 7                                                           | Pilha/tabs tipadas com estrutura já conhecida do projeto; migração para Expo Router não era necessária.                             |
| Safe area / telas      | `react-native-safe-area-context`, `react-native-screens`                     | Bibliotecas nativas alinhadas ao SDK, sem build customizado.                                                                        |
| Mapas                  | `react-native-maps`                                                          | Uso nativo no Expo Go; a versão web oferece abertura externa do mapa.                                                               |
| Datas                  | `@react-native-community/datetimepicker`                                     | Picker incluído no Expo Go, com entrada ISO na web.                                                                                 |
| PDF / compartilhamento | `expo-print`, `expo-sharing`, `expo-file-system`                             | APIs oficiais Expo; arquivo temporário limpo após uso no mobile.                                                                    |
| Lifecycle / rede       | `AppState` e `expo-network`                                                  | Refetch conectado ao estado do aplicativo e conectividade, com unsubscribe.                                                         |
| Filtros                | FlatList horizontal / Pressable                                              | Substitui dropdown-picker, que não era necessário para poucas categorias.                                                           |
| Auth Google no app     | Removido o fluxo anterior; email/senha                                       | O requisito de Expo Go impede usar o módulo nativo recomendado do Google. Não foi mantido um botão que não funciona nesse ambiente. |
| Dependências de build  | Removidos `expo-dev-client`, `eas-cli`, plugin Gradle direto e `expo-random` | Não eram necessários à execução no Expo Go nem ao app final.                                                                        |
| Validação Python       | Pydantic v2, `pydantic-settings`                                             | Schemas atuais, configuração tipada e contrato OpenAPI.                                                                             |
| Banco                  | SQLAlchemy 2 + Alembic + psycopg 3                                           | Tipos modernos, sessões delimitadas e migrações explícitas. SQLite somente local.                                                   |
| Senhas                 | `pwdlib` com Argon2 e bcrypt para compatibilidade                            | Hash atual para novas senhas; contas antigas têm hash atualizado ao entrar. Substitui Passlib antigo.                               |
| JWT                    | PyJWT                                                                        | Claims obrigatórias, algoritmo fixo, audiência/emissor e expiração validados.                                                       |
| Google HTTP / cache    | `httpx` + `cachetools`                                                       | Conexões reutilizadas, timeout, concorrência e TTL com tamanho máximo.                                                              |
| Qualidade              | TypeScript, ESLint Expo, Prettier, Vitest; Ruff, mypy, pytest                | Verificações de integração e comportamento, além de análise estática.                                                               |
| Geração de tipos       | `openapi-typescript` isolado em `tools/api-types`                            | Evita conflito entre o TypeScript 6 do app e o peer dependency TypeScript 5 do gerador.                                             |

Referências consultadas: [SDK Expo atual](https://docs.expo.dev/versions/latest/), [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [autenticação Google no Expo](https://docs.expo.dev/guides/google-authentication/), [segurança JWT no FastAPI](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) e [CORS no FastAPI](https://fastapi.tiangolo.com/tutorial/cors/).

## Layout, interface e experiência de uso

A direção solicitada foi **escura e minimalista**. A paleta usa fundos neutros, superfícies discretas, texto claro e ações principais em branco; cores de sucesso e erro aparecem somente nos estados correspondentes. O tema escuro é o padrão para uma instalação sem preferência salva. A seleção anterior válida é preservada, e temas claro/sistema permanecem disponíveis.

- Login e cadastro: hierarquia visual consistente, rótulos persistentes, navegação entre campos, mostrar/ocultar senha e mensagem de confirmação de senha.
- Explorar: uma lista vertical virtualizada com busca e filtros no cabeçalho, categorias traduzidas, marcador de favoritos, imagem alternativa neutra e botões que cabem na largura do cartão.
- Programação: visitas e hospedagens agrupadas cronologicamente por data, edição/remoção com rótulos específicos e resumo de custos/distâncias explicitamente estimados.
- Detalhes: título completo, informações do local, endereço sem repetição na web, hotéis carregados sob demanda e ação de adicionar fixa no rodapé.
- Modais: altura limitada à janela/área segura, conteúdo rolável e ação principal fixa. A recuperação de dados antigos também foi verificada em 320 × 568.
- Datas: seletor nativo do Expo Go e controle de calendário HTML na web. A atualização da data web foi corrigida e verificada pelo valor persistido. O check-out acompanha uma alteração de check-in que invalidaria o intervalo anterior.
- Configurações: linhas com título, descrição e valor atual, perfil separado e ação de saída com confirmação.
- Acessibilidade: áreas de toque de pelo menos 44 px nos botões de ícone, 48 px nas ações principais, rótulos de navegação, ícones decorativos ocultos dos leitores de tela e barra inferior com espaço para os textos e insets.

Os testes de contraste verificam 16 combinações de texto/fundo dos dois temas com razão mínima de 4,5:1, conforme a [referência WCAG para contraste de texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Isso não equivale a uma auditoria completa de acessibilidade; TalkBack/VoiceOver e fontes ampliadas ainda precisam de avaliação em aparelho.

Não foram acrescentadas bibliotecas nativas para o redesign. StyleSheet, tokens de tema e ícones Feather atendem à interface atual. O marcador de favoritos usa especificamente o par `bookmark`/`bookmark-o` de FontAwesome, disponível na dependência Expo já instalada: Feather oferece somente contorno. O estado salvo também recebe fundo contrastante. A conferência verificou as duas formas e o retorno ao estado salvo após remover/adicionar pela API. Evidência em `.review/favorite-saved.png`.

As imagens gerais da conferência estão em `.review/ui-login.png` e `.review/ui-settings.png`, com provedor e conta simulados para teste.

## Auditoria de dependências

O frontend inicialmente apresentava 42 alertas npm. Após atualização e remoção das bibliotecas dispensáveis, restam **17 alertas high, zero critical e zero moderate**, propagados por duas dependências transitivas da cadeia Expo/Metro/CLI:

- `braces` 3.0.3: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- `node-forge` 1.4.0: [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv).

As duas fontes não indicavam versão corrigida na data da revisão. A sugestão `fixAvailable` da auditoria rebaixa o Expo para 44.0.6; esse rebaixamento comprometeria a compatibilidade atual e não foi aplicado. Esses alertas afetam a cadeia de ferramentas e exigem atenção ao processar entradas não confiáveis e aos processos de desenvolvimento/build. Não equivalem a 17 falhas distintas implementadas no app, e tampouco foram considerados irrelevantes.

O alerta de `uuid` no pacote `xcode` foi corrigido com um override restrito a esse consumidor para `uuid` 11.1.1; esse consumidor usa a API `v4`, que permanece compatível. Vitest também foi atualizado para a versão atual, removendo o alerta crítico anterior. Os lockfiles registram as resoluções usadas.

Na instalação Python final, `pip-audit` reportou **nenhuma vulnerabilidade conhecida**, após também atualizar pip/setuptools antigos do ambiente virtual. Isso é o resultado do banco de advisories consultado, não uma garantia de ausência de qualquer falha futura. `pip check` verificou a consistência da instalação.

As saídas JSON estão em `.review/npm-audit-final.json` e `.review/python-audit-final.json`. Reexecute as auditorias após atualizar dependências ou antes de distribuir uma versão.

## Validação e limites

- TypeScript e ESLint passaram; Ruff e mypy passaram, com análise de 22 arquivos Python da aplicação.
- Expo Doctor: 21/21 verificações aprovadas.
- Testes de frontend: **28 aprovados**, cobrindo datas/geometria/escape de PDF, cliente HTTP, persistência segura, importação legada, agrupamento cronológico e contraste de texto.
- Testes de backend: **39 aprovados**, cobrindo autenticação, normalização, compatibilidade bcrypt, JWT inválido/expirado, isolamento de proprietário, validação de payloads, conflitos de hospedagem, favoritos idempotentes, importação atômica, CORS, limites, erros seguros, provedor/fotos e migração do banco legado.
- Export de produção Android, iOS e web aprovado. A padronização inicial dos ícones reduziu os assets exportados de 75 para 37; após adicionar o par de marcadores FontAwesome, o export contém 39 assets. Bundles aproximadamente 3,1 MB mobile e 1,6 MB web, sem compressão adicional de transporte.
- O contrato Pydantic/OpenAPI/TypeScript foi verificado automaticamente.
- Fluxos web de login, favorito, inclusão de visita/hotel, edição, modal de confirmação/cancelamento e logout foram exercitados com a API real e um provedor Google simulado em banco separado (`.review/smoke.db`). Após o redesign, foram repetidos login/logout, busca vazia/recuperação, filtro de favoritos, detalhe/hospedagem, escolha e persistência de data, ajuste automático do check-out e cancelamento de remoção. O console do navegador não apresentou erros no fluxo final.
- Layout conferido em 320 × 568, 390 × 844 e largura de desktop. O navegador de automação apresentou inconsistência de coordenadas após redimensionamentos; os fluxos finais foram conferidos com ativação dos controles por teclado. As capturas representam a versão web; não são screenshots de Expo Go.

Os testes não usaram credenciais Google reais, nem dispositivo físico com Expo Go, nem um PostgreSQL de produção. O export verifica resolução e empacotamento; não substitui o teste em dispositivo. Preços e textos manuais originais foram preservados, e os resumos indicam que são estimativas. Distâncias são em linha reta.

O JWT atual expira e não usa refresh token ou lista de revogação; logout apaga a credencial local. O rate limit e o cache são por processo, e devem ser complementados por um gateway compartilhado para múltiplos workers. O banco legado pode conter dados inválidos anteriores à validação nova; se existirem, revise-os antes da operação em produção. Veja o README para configuração, migração, atualização do contrato e execução das verificações.

## Quatro mudanças de funcionamento

- Exploração pública: o catálogo é a tela inicial. Favoritos e programação solicitam login; a navegação permanece tipada e o conteúdo privado continua restrito pelo backend.
- Viagens independentes: CRUD com nome e período opcional, seleção nos formulários, programação/resumo/PDF por viagem. A migração preserva IDs, datas e marcadores da importação legada e cria a viagem inicial por usuário.
- Horário, duração e ordem: visita com campos opcionais em par, validação de término no mesmo dia, aviso de sobreposição, ordenação manual diária persistida e rejeição de reordenação com lista incompleta/desatualizada. Hotel é agrupado pelo check-in.
- Consulta offline: `expo-crypto` AES-GCM, arquivo no diretório de documentos, chave e ponteiro no `expo-secure-store`, validação Zod 4, vínculo de conta/token/origem, gravações serializadas e limpeza no logout. A chave é criada novamente a cada gravação. O ponteiro é confirmado após o arquivo para preservar a cópia anterior em caso de falha. O navegador usa memória e não persiste credenciais. Nenhuma edição offline é enfileirada.

A interface web foi exercitada sem login, com login, criação de viagem com período, seleção, duas visitas com horário, aviso de conflito, edição, ordem manual e queda/reconexão da API. Os roteiros continuaram visíveis e as ações de edição ficaram bloqueadas na queda. Usou-se o banco separado `.review/smoke.db` e um provedor simulado. A evidência da consulta está em `.review/trips-offline.png`.

Os 28 testes frontend incluem restauração em nova instância do cache, isolamento entre credenciais/origens/contas, gravações concorrentes, logout durante gravação e falhas de armazenamento. O adaptador nativo foi testado com AES-GCM real via WebCrypto e substitutos para File/SecureStore: ciphertext sem texto pessoal, detecção de adulteração, confirmação atômica, Unicode e limpeza. Isso não executa o SecureStore nem o módulo Crypto em aparelho real. Os 39 testes backend incluem isolamento de viagens, período, conflitos de hotel por viagem, horários, reordenação atômica e migração de itens legados com marcadores preservados.

Referência da biblioteca acrescentada: [Expo Crypto no SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/). A consulta offline depende de download prévio e de o projeto já estar carregado no Expo Go. Não inclui fotos, mapas ou catálogo completo. A conta local de teste foi preservada. O teste físico em Expo Go, Google real e PostgreSQL continua pendente.

A exportação final das quatro mudanças passou em Android, iOS e web (39 assets). Expo Doctor passou em 21/21 verificações. TypeScript, ESLint, Prettier, Ruff, mypy e a checagem do contrato também passaram.

## Liquid Glass clear com Expo Go — revisão de 08/10/2026

- Mantido Expo Go conforme solicitação do usuário, que informou iOS 27. Usado `expo-glass-effect ~57.0.4`, a implementação nativa incluída no SDK 57; `@callstack/liquid-glass` exige build próprio e não foi instalado.
- `TabBarBackground.ios.tsx` renderiza `GlassView` no modo `clear`, sem tint, preenchimento opaco ou animação de opacidade. Verifica disponibilidade da API e do efeito. Android/web não importam esse módulo; usam `BlurTabBarBackground`, também utilizado no iOS sem suporte.
- Destaque da aba ativa com menor preenchimento translúcido, texto/ícones e material acompanhando o tema. Preservados swipe/pager, pílula animada, borda sutil, safe area, insets de listas, retorno por gesto dos modais e engrenagem azul do Expo Go.
- O iOS controla a aparência conforme suas preferências de acessibilidade. O efeito real precisa ser conferido no iPhone; exports não executam UIKit.
- Validação desta revisão: TypeScript, ESLint e Prettier aprovados; Expo Doctor 21/21; export de iOS/Android/web aprovado, com 39 assets. Mantidos os 20 avisos altos transitivos já registrados pelo npm audit; nenhuma atualização incompatível aplicada. A validação visual do novo material no iPhone continua pendente.

Referências: [Expo GlassEffect SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/), [Callstack Liquid Glass](https://github.com/callstack/liquid-glass#installation).

## Navegação com blur e gestos — revisão anterior de 08/10/2026

- Substituído o fundo `GlassView`/opaco por `expo-blur ~57.0.3`, intensidade 80 e tint dark, com borda branca de opacidade 0,1. O efeito atual é blur fosco, sem depender do Liquid Glass do iOS 26. No Android 12+, cada tela fornece um `BlurTargetView` fora da barra; versões anteriores usam a alternativa translúcida de menor custo.
- `createMaterialTopTabNavigator` na parte inferior, com `react-native-pager-view 8.0.2`, swipe e transições habilitados. A pílula acompanha a posição contínua do pager. Os rótulos permanecem abaixo dos ícones, com alvos de toque de pelo menos 48 pontos e estado selecionado acessível.
- A área segura inferior fica fora da cápsula, em `paddingBottom: insets.bottom`. A altura reservada pelas listas usa o mesmo cálculo da barra, incluindo fontes maiores, espaçamento e indicador de início. A barra se esconde com o teclado aberto.
- Modais e detalhes recebem `SafeAreaProvider` próprio. Novo `ModalHeader` com Voltar visível e alvo mínimo de 48 pontos. `SwipeDismiss` usa Gesture Handler/Reanimated/Worklets nas versões do SDK para arrastar da borda esquerda e fechar com animação; arrastos curtos retornam e salvamentos bloqueiam o gesto.
- A engrenagem azul do Expo Go foi preservada por solicitação do usuário. Removidas dependências substituídas `expo-glass-effect` e `@react-navigation/bottom-tabs`.
- Validação: TypeScript, ESLint, Prettier, 32 testes do frontend e Expo Doctor 21/21 aprovados. Bundles Hermes iOS/Android e web compilados. O sandbox bloqueou a execução do Hermes e Vitest; as execuções fora da restrição passaram.
- Teste visual web com API e banco isolados: larguras de 320 e 390 pontos, troca de abas por toque/swipe, fechamento de aparência e detalhes por gesto, retorno por Voltar/Fechar e cancelamento de arrasto curto. Capturas em `.review/navigation-tabs.jpg` e `.review/navigation-details.jpg`. O blur, a área segura e os gestos nativos no iPhone ainda exigem validação no aparelho.
- O `npm audit` registra 20 entradas altas: as novas entradas de Reanimated/Worklets/metro-transform-worker propagam os avisos já existentes de React Native/Metro. Mantidas as versões compatíveis com Expo Go; não aplicado downgrade sugerido pelo audit.

Referências: [Expo BlurView SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/), [Material Top Tabs](https://reactnavigation.org/docs/material-top-tab-navigator/).

## Barra Liquid Glass no iOS (implementação anterior, substituída)

- Adicionado `expo-glass-effect ~57.0.4`, compatível com o Expo Go do SDK 57. A implementação específica de iOS usa `GlassView` regular, tema explícito e checagem das duas APIs de disponibilidade.
- Cápsula flutuante com cantos arredondados, destaque na aba ativa e afastamento do indicador de início. Insets de conteúdo usam a altura real da barra, inclusive quando a escala de fonte muda. A programação de visitante permite rolar o conteúdo estático.
- A preferência **Reduzir Transparência** é lida e observada, com cleanup e proteção contra resultado inicial atrasado. Usa fundo sólido até a leitura, em caso de falha, em iOS antigo ou sem API disponível. Android e web mantêm a barra anterior e não importam o componente nativo de vidro.
- O efeito exige iOS 26 ou superior. A avaliação visual no iPhone continua pendente. Referência: [Expo GlassEffect — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/).

Validação desta alteração: TypeScript, ESLint e Prettier aprovados; 28 testes frontend aprovados; Expo Doctor 21/21; export de Android, iOS e web aprovado (39 assets). O módulo nativo de vidro foi identificado somente no bundle iOS. Os testes e exports não executam o efeito visual nem as preferências de acessibilidade em um iPhone.

## Migração para Places API (New) e Maps Demo Key

A integração Legacy foi substituída por `places.googleapis.com/v1`: Text Search e Nearby Search por POST JSON, detalhes por GET e fotos por recurso `/media`. Modelos internos Pydantic traduzem `displayName`, `location`, `regularOpeningHours` e os demais campos para o contrato público anterior, sem alteração das interfaces do aplicativo.

`GOOGLE_PLACES_MODE=demo` é o padrão e não solicita fotos, notas ou contagens de avaliações. A chave demo oficial permite testes sem faturamento, tem cotas diárias e não fornece fotos/reviews de usuários. O modo `standard` habilita esses campos para uma chave regular e preserva o proxy de imagens com token assinado, validação de recurso/host/tamanho e ausência de chave na resposta ou no download do host redirecionado.

O catálogo agora exige uma busca por carga em vez de busca + N detalhes. Os detalhes retornados também alimentam o cache para a consulta de hotéis. Erros de permissão e cota recebem mensagens úteis sem copiar a resposta Google. A configuração existente da chave é preservada. Referências: [Maps Demo Key](https://developers.google.com/maps/demo-key), [Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search), [Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search) e [Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos).

Validação: 55 testes backend aprovados, Ruff/mypy/formatação aprovados e contrato Pydantic/OpenAPI/TypeScript alinhado. Foi realizada uma consulta real de catálogo com a chave demo configurada, retornando um local no modo `demo`, sem imagem. A chave e respostas brutas não foram exibidas. O modo padrão com fotos foi verificado por transporte simulado; não foi usado faturamento real. O teste físico no Expo Go continua pendente.

A API local foi reiniciada com essa integração e conferida por HTTP: `/health` 200, catálogo com 10 locais e nenhuma foto, e consulta de hotéis com um resultado (200). A chave configurada foi preservada.

## Correção de carregamento após falha de conexão

As consultas públicas de locais/hotéis herdavam tentativas automáticas no modo de rede `online`. O cliente HTTP marcava o gerenciador offline ao falhar, fazendo a próxima tentativa ficar pausada com status `pending`; a tela continuava mostrando carregamento. Essas consultas agora usam `networkMode: "always"` e não repetem automaticamente: terminam com erro após a falha/timeout e permitem nova tentativa manual, inclusive se o gerenciador estiver offline. A tela de catálogo usa `isLoading`, que considera uma consulta efetivamente em execução.

Validação: 32 testes frontend aprovados, incluindo timeout de 20 segundos, transição para erro/idle, nova tentativa offline e consulta de hotéis. TypeScript e ESLint aprovados. A API respondeu no computador em `192.168.0.3:8000`; `192.168.0.166` foi identificado pelo usuário como endereço do celular. A URL pública do app permanece apontando para o computador. A conectividade a partir do celular precisa do teste `/health` no navegador do próprio aparelho.
