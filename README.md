# OndeFica

Aplicativo de turismo em Brasília com Expo Go, React Native e TypeScript. Backend FastAPI com Pydantic v2 e SQLAlchemy 2. A refatoração e as decisões sobre bibliotecas estão descritas em [RELATORIO_REFATORACAO.md](RELATORIO_REFATORACAO.md).

A interface foi revisada com aparência escura e minimalista por padrão: catálogo com busca/filtros, cartões legíveis, programação organizada por data, formulários com rótulos persistentes e ações fixas nos modais. Tema claro e aparência do sistema continuam disponíveis em Configurações → Aparência; a escolha é salva neste aparelho.

## Ambiente de desenvolvimento

Use Python 3.11 ou superior, Node.js 22.13 ou superior e um Expo Go que suporte o SDK 57. Os comandos abaixo usam PowerShell e partem da raiz deste projeto. Abra dois terminais para executar a API e o aplicativo.

### Instalação

```powershell
python -m venv .venv
.venv/Scripts/python -m pip install --require-hashes -r BackEnd/requirements-dev.lock.txt
npm --prefix tools/api-types ci
npm --prefix FrontEnd ci
.venv/Scripts/python scripts/setup_dev.py
```

O script de configuração cria os arquivos `.env` somente se ainda não existirem. A chave JWT é gerada aleatoriamente; arquivos existentes não são sobrescritos. As dependências Python de produção estão em `BackEnd/requirements.lock.txt`; o lock de desenvolvimento inclui testes e ferramentas de revisão.

### Configuração

Edite `BackEnd/.env`:

| Variável                | Uso                                                                        |
| ----------------------- | -------------------------------------------------------------------------- |
| `JWT_SECRET_KEY`        | Chave privada aleatória. Nunca copiar para o frontend.                     |
| `DATABASE_URL`          | SQLite local ou URL SQLAlchemy de PostgreSQL (`postgresql+psycopg://...`). |
| `GOOGLE_PLACES_API_KEY` | Chave do servidor para consultas ao Google Places e fotos.                 |
| `GOOGLE_PLACES_MODE`    | `demo` (padrão), sem fotos/avaliações, ou `standard`, para chave regular.  |
| `CORS_ORIGINS`          | JSON com origens web exatas, por exemplo `["http://localhost:8081"]`.      |
| `ADMIN_EMAILS`          | JSON com emails autorizados a limpar o cache. Vazio por padrão.            |
| `GOOGLE_CLIENT_IDS`     | Audiências aceitas pelo endpoint Google. Vazio desabilita esse login.      |
| `AUTO_CREATE_TABLES`    | Conveniência local. Use `false` em produção e aplique migrações.           |

A integração usa **Places API (New)** para busca, detalhes, hotéis e fotos. A **Maps Demo Key oficial** permite prototipar sem informar faturamento, com cotas diárias e sem fotos/reviews de usuários. O modo `demo` omite fotos, notas e contagens de avaliações das consultas; os cartões usam a imagem alternativa já disponível. Configure em `BackEnd/.env`:

```dotenv
GOOGLE_PLACES_API_KEY=sua_chave_demo
GOOGLE_PLACES_MODE=demo
```

Reinicie o backend depois de editar o `.env`. Com uma chave regular, configure `GOOGLE_PLACES_MODE=standard` para incluir fotos/notas; esse modo pode gerar cobrança conforme os campos e as cotas do projeto Google. O modo não altera o tipo da chave nem habilita faturamento automaticamente. As chamadas usam máscaras de campos explícitas e chave somente em cabeçalhos do backend. A lista retorna os detalhes em uma busca, sem uma chamada adicional por cartão.

Sem chave válida, consultas retornam um erro claro; cadastro, login e programação continuam independentes do provedor. Restrinja a chave do servidor às APIs necessárias e, em produção, aos IPs de saída do backend. Referências: [Maps Demo Key](https://developers.google.com/maps/demo-key) e [Places API (New)](https://developers.google.com/maps/documentation/places/web-service).

Edite `FrontEnd/.env` com a URL pública da API:

```dotenv
# Navegador no mesmo computador:
EXPO_PUBLIC_API_URL=http://localhost:8000
# Emulador Android: http://10.0.2.2:8000
# Celular físico: http://IP_DO_COMPUTADOR_NA_REDE:8000
```

No celular, `localhost` aponta para o próprio celular. Use a mesma rede do computador e permita a porta da API na configuração local de rede. Em produção, use HTTPS. Variáveis `EXPO_PUBLIC_*` são incluídas no bundle: apenas a URL pública deve estar ali.

### Backend

```powershell
.venv/Scripts/python -m alembic -c BackEnd/alembic.ini upgrade head
.venv/Scripts/python -m uvicorn BackEnd.main:app --host 0.0.0.0 --port 8000 --reload
```

Swagger local: `http://localhost:8000/docs`. Health check: `http://localhost:8000/health`. Execute os comandos a partir da raiz para que o banco SQLite local tenha sempre o mesmo caminho.

Para um banco existente, faça um backup antes de aplicar a migração. A baseline adota as tabelas antigas, cria as tabelas novas e índices, e interrompe a execução se encontrar favoritos duplicados ou emails duplicados que diferem apenas em maiúsculas. Revise esses registros manualmente antes de tentar novamente. O downgrade destrutivo está desabilitado.

### Frontend / Expo Go

```powershell
Set-Location FrontEnd
npm start
```

Abra o QR code com Expo Go. `npm run android` e `npm run ios` também usam Expo Go; `npm run web` inicia a versão de navegador.

O login disponível no Expo Go é email/senha. A biblioteca nativa de autenticação Google requer um development build, incompatível com o requisito de executar este projeto integralmente no Expo Go. O endpoint de validação de ID token permanece no servidor, com audiências explícitas, para futuras integrações autorizadas.

### Conta para teste local

Para criar outra conta de teste após aplicar as migrações, execute na raiz:

```powershell
.venv/Scripts/python scripts/create_test_user.py
# Se o email padrão já existir:
.venv/Scripts/python scripts/create_test_user.py --email outro-teste@example.com
```

O comando cria a conta no mesmo banco SQLite usado pela API local, gera uma senha aleatória e exibe a senha somente nessa execução. O hash é armazenado no banco; nenhuma senha existente é alterada. O script recusa bancos externos e ambientes de produção. As contas de `.review/smoke.db` pertencem apenas ao teste simulado e não servem para entrar na API normal.

Na preparação do teste em celular, `FrontEnd/.env` foi ajustado para `http://192.168.0.3:8000`, o IP Wi-Fi observado neste computador. Se a rede/IP mudar, atualize esse arquivo e reinicie o Expo. Com computador e celular na mesma rede, abra `http://192.168.0.3:8000/health` no navegador do celular para conferir o acesso à API antes de testar o login. Se a conexão falhar, confira a rede e o acesso às portas 8000/8081 no firewall; não é necessário tornar o backend público na internet.

Se uma VPN fizer o Expo anunciar outro IP, use no terminal do frontend:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME='192.168.0.3'
npm start -- --lan
```

## Exploração, viagens e consulta offline

O app abre no catálogo sem login. Salvar favoritos ou organizar uma viagem solicita autenticação. Em **Programação**, use **Nova viagem** para dar um nome ao roteiro e, opcionalmente, definir seu período. Selecione a viagem antes de adicionar visitas ou hospedagens; cada viagem tem seus próprios itens, resumo e PDF.

Visitas aceitam horário no formato `HH:mm` e duração em minutos. Preencha ambos ou deixe ambos vazios para horário livre. Uma visita precisa terminar até meia-noite. A interface avisa sobre horários sobrepostos, e as setas nos cartões salvam a ordem manual dentro de cada dia. Os dias continuam em ordem cronológica. Hospedagens sobrepostas são rejeitadas dentro da mesma viagem; viagens alternativas podem ter o mesmo período.

A migração `0002_trips_schedule` preserva os itens existentes e os associa a **Minha viagem** por proprietário. A atualização foi aplicada ao banco local; o backup anterior está em `.review/before-trips/ondefica_dev.db`. Em outro ambiente, faça backup e execute Alembic antes de iniciar esta versão. Excluir uma viagem exige confirmação e remove também seus itens; favoritos permanecem disponíveis.

Para preparar a consulta offline no Android/iOS, entre conectado e abra a programação. Aguarde **Viagens disponíveis offline neste aparelho**. As viagens e os itens são gravados em arquivo AES-256-GCM com chave no SecureStore. A cópia é vinculada à credencial, ao usuário e à origem da API; não contém fotos nem o JWT. Após reabrir o aplicativo sem conexão, a sessão local pode restaurar a cópia para consulta. Criar, editar, excluir, importar e reordenar exigem conexão. Use **Reconectar** para validar a sessão e voltar a editar. Um 401 apaga a sessão e a cópia, e sair da conta também as apaga. Sem download prévio não há roteiro offline. Os dados são uma cópia da última atualização concluída e podem estar desatualizados.

Na web, a cópia e o token ficam apenas na memória da sessão aberta: recarregar a página exige login e conexão novamente. A consulta offline não baixa o catálogo completo, as fotos nem os mapas. O Expo Go precisa já ter carregado o projeto; o cache de dados não substitui o carregamento do bundle pelo ambiente de desenvolvimento.

Para testar no celular: entre, crie duas viagens, adicione visitas no mesmo dia, defina horários, altere a ordem e atualize o roteiro. Desative a conexão, confira a consulta e os botões de edição bloqueados, e reabra o projeto previamente carregado. Depois volte a conectar e use **Reconectar**. O teste físico do Expo Go ainda precisa ser realizado; a interface web e o armazenamento foram verificados com testes automatizados e dados simulados.

## Navegação inferior com Liquid Glass e gestos

No iOS 26+, a navegação inferior usa o vidro nativo de `expo-glass-effect ~57.0.4`, incluído no Expo Go do SDK 57. O `GlassView` usa `glassEffectStyle="clear"`, sem tint adicional ou fundo opaco, com borda branca translúcida. O destaque da aba ativa é discreto, e as cores acompanham o tema do app. As duas APIs de disponibilidade são verificadas antes de renderizar o vidro; o iOS respeita suas configurações de acessibilidade de transparência. Android, web e iOS sem suporte usam `expo-blur` com intensidade 80 e tint conforme o tema (dark por padrão). No Android 12+ a tela ativa fornece um `BlurTargetView`; versões anteriores usam a alternativa translúcida para evitar o custo do blur antigo. O módulo de vidro é importado somente no iOS. `@callstack/liquid-glass` não é utilizado porque exige um build nativo próprio, incompatível com a escolha de manter o Expo Go.

O `createMaterialTopTabNavigator` fica na parte inferior e permite trocar de aba com swipe horizontal. A pílula segue a posição contínua do pager durante o gesto. O `paddingBottom` da barra recebe `insets.bottom`, separado da altura dos ícones e rótulos. As listas reservam a altura total da barra para deixar o último item acessível; a barra se esconde com o teclado aberto.

Os modais têm `SafeAreaProvider` próprio, cabeçalho com controles de pelo menos 48 pontos e gesto de fechar arrastando a borda esquerda para a direita. Um gesto curto retorna à posição inicial; o fechamento fica bloqueado durante salvamentos. A engrenagem azul pertence às ferramentas do Expo Go e permanece habilitada.

Após a atualização, reinicie o Metro dentro de `FrontEnd` com `npx expo start --go --clear` e reabra o projeto no Expo Go. No iPhone, confira o vidro ao rolar conteúdo sob a barra, toque e swipe entre as três abas, rótulos acima do indicador de início, último item da lista, busca com teclado aberto e fechamento dos detalhes e modais por botão e gesto. A renderização nativa ainda precisa de teste no aparelho. Referências: [Expo GlassEffect — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/), [Expo BlurView — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/), [Material Top Tabs](https://reactnavigation.org/docs/material-top-tab-navigator/), [Callstack Liquid Glass](https://github.com/callstack/liquid-glass#installation).

## Persistência e dados antigos

- JWT: `expo-secure-store` no Android/iOS. No navegador, fica somente em memória e é necessário entrar novamente após recarregar a página.
- Tema e preferências: AsyncStorage, sem credenciais.
- Viagens, programação e favoritos: API autenticada, consultas limitadas ao proprietário e cache em memória por usuário. Viagens e programação têm também cópia criptografada offline no Android/iOS.
- O token antigo em AsyncStorage é removido; entre novamente após atualizar.
- Em **Configurações → Importar programação antiga**, revise os itens e a conta de destino antes de importar. O armazenamento antigo não identificava o proprietário; por isso a importação exige essa escolha explícita. O original local é preservado. O servidor importa o lote de forma atômica e ignora IDs já importados na mesma conta. URLs antigas de fotos com chaves do Google são descartadas.

Os JWTs expiram em 30 minutos por padrão. Um 401 encerra a sessão atual e limpa seu cache. Não há refresh token nem revogação individual no servidor nesta versão.

## Contrato Python ↔ TypeScript

O frontend usa `openapi-fetch`, com caminhos, parâmetros e respostas gerados dos schemas Pydantic. Após alterar um schema ou endpoint:

```powershell
.venv/Scripts/python scripts/export_openapi.py
npm --prefix FrontEnd run generate:api
.venv/Scripts/python scripts/check_contract.py
```

Versione `BackEnd/openapi.json` e `FrontEnd/src/types/api.generated.ts` juntos. Não edite o arquivo TypeScript gerado manualmente. O gerador fica em `tools/api-types` porque seu peer dependency TypeScript 5 difere do TypeScript 6 recomendado pelo SDK 57.

## Antes de commitar

O `.gitignore` exclui `.env` reais, bancos locais e seus arquivos auxiliares/backup, dependências, ambientes virtuais, caches, logs, cobertura de testes e exports. A pasta `.review` contém evidências e backups locais e deve permanecer fora do Git. O script `scripts/repair_dev_firewall.ps1` é específico deste computador e também está ignorado; mantenha-o e os backups locais se precisar revisar ou restaurar o ajuste. Apagar o script não remove as regras já criadas no Windows.

Versione os `.env.example` com placeholders, `package-lock.json`, os locks Python, as migrações, `BackEnd/openapi.json` e `FrontEnd/src/types/api.generated.ts`. Antes do commit, revise `git status --short` e `git diff --cached`. O `.gitignore` não remove arquivos já versionados; se uma chave real tiver sido publicada, remova o arquivo do versionamento e substitua a chave.

## Verificação

```powershell
npm --prefix FrontEnd run typecheck
npm --prefix FrontEnd run lint
npm --prefix FrontEnd run format:check
npm --prefix FrontEnd run test
npm --prefix FrontEnd run doctor
.venv/Scripts/python -m pytest -c BackEnd/pyproject.toml BackEnd/tests -q
.venv/Scripts/python -m ruff check BackEnd scripts
.venv/Scripts/python -m ruff format --check BackEnd scripts
.venv/Scripts/python -m mypy --config-file BackEnd/pyproject.toml BackEnd
.venv/Scripts/python scripts/check_contract.py
```

Para verificar o empacotamento das três plataformas, execute `npx expo export --platform all` dentro de `FrontEnd`. Para auditorias, use `npm audit` nessa pasta e `.venv/Scripts/python -m pip_audit` na raiz. Os alertas transitivos ainda presentes estão detalhados no relatório.

## Produção

Configure `ENVIRONMENT=production`, PostgreSQL, `AUTO_CREATE_TABLES=false`, chave JWT exclusiva e origens HTTPS explícitas. Instale o lock de produção, aplique Alembic e use um gateway com limites compartilhados entre workers. Os limites e caches atuais são locais por processo. CORS define as origens permitidas para navegadores; a autorização dos dados privados é feita pelo JWT e pela checagem de proprietário.

O bloqueio por usuário ao validar sobreposição de hotéis usa `SELECT FOR UPDATE` em PostgreSQL. SQLite serve para desenvolvimento e não oferece essa mesma garantia entre gravações concorrentes. Para subir uma versão pública, valide também em dispositivo real, com credenciais reais do Google e a infraestrutura final.

## Estrutura

```text
BackEnd/
  routes/        HTTP, dependências e respostas tipadas
  services/      regras de negócio e integração Google
  schemas.py     validação Pydantic v2 e contrato da API
  models.py      modelos SQLAlchemy 2
  migrations/    baseline Alembic e adoção do banco legado
  tests/         autenticação, privacidade, validação, provedor e migrações
FrontEnd/
  src/components/ UI compartilhada, formulários e modais
  src/screens/    telas de navegação
  src/hooks/      consultas, mutações e regras dos formulários
  src/context/    autenticação, viagens, tema e preferências
  src/services/   cliente HTTP, token e armazenamento criptografado offline
  src/types/      modelos derivados do OpenAPI e navegação
  src/utils/      datas, geometria, PDF, links e importação
scripts/          configuração local e checagem do contrato
tools/api-types/  gerador isolado de TypeScript
```

O código anterior está preservado em `.review/original`, criado antes das alterações. Essa pasta também guarda os resultados locais de auditoria e a evidência do teste web com dados simulados; não deve ser publicada nem distribuída com o aplicativo.
