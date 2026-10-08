# OndeFica

Aplicativo para explorar Brasília, salvar favoritos e organizar viagens com visitas e hospedagens. Inclui horários, roteiros em PDF e consulta offline da programação previamente carregada no celular.

**Tecnologias:** Expo Go (SDK 57), React Native, TypeScript e FastAPI. Interface escura por padrão, com detalhes em verde-oliva e amarelo-ouro.

## Requisitos

- Python 3.11+
- Node.js 22.13+
- Expo Go compatível com SDK 57

## Instalação

Na raiz do projeto, usando PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --require-hashes -r BackEnd/requirements-dev.lock.txt
npm --prefix FrontEnd ci
.\.venv\Scripts\python.exe scripts/setup_dev.py
.\.venv\Scripts\python.exe -m alembic -c BackEnd/alembic.ini upgrade head
```

O setup cria os `.env` e uma chave JWT local, preservando configurações existentes. Faça backup antes de migrar um banco já utilizado.

## Configuração

Em `BackEnd/.env`, configure o Google Places:

```dotenv
GOOGLE_PLACES_API_KEY=sua_chave
GOOGLE_PLACES_MODE=demo
```

O modo `demo` usa a Maps Demo Key sem fotos/reviews; use `standard` para uma chave regular. As demais opções estão em [BackEnd/.env.example](BackEnd/.env.example).

Em `FrontEnd/.env`, informe a URL da API:

```dotenv
EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:8000
```

No celular, use o IP do computador e a mesma rede Wi-Fi. No navegador do computador, pode usar `http://localhost:8000`. Reinicie os serviços após alterar os `.env`. Credenciais ficam apenas no backend; variáveis `EXPO_PUBLIC_*` são públicas.

## Executar

Backend, na raiz do projeto:

```powershell
.\.venv\Scripts\python.exe -m uvicorn BackEnd.main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend, em outro terminal na raiz:

```powershell
npm --prefix FrontEnd start
```

Abra o QR code no Expo Go. Para a versão web: `npm --prefix FrontEnd run web`.

API: [documentação local](http://localhost:8000/docs) e [health check](http://localhost:8000/health). Para conferir a conexão no celular, abra `http://IP_DO_COMPUTADOR:8000/health`; o firewall precisa permitir o acesso local à API.

O catálogo funciona sem login. Crie uma conta no app para salvar favoritos e viagens. A consulta offline exige carregar a programação conectado; edições exigem conexão.

## Verificação

```powershell
npm --prefix FrontEnd run typecheck
npm --prefix FrontEnd run lint
npm --prefix FrontEnd run test
.\.venv\Scripts\python.exe -m pytest -c BackEnd/pyproject.toml BackEnd/tests -q
.\.venv\Scripts\python.exe scripts/check_contract.py
```

Não versione `.env`, bancos locais ou caches. Detalhes de arquitetura, migrações, contrato da API e limitações estão no [relatório técnico](RELATORIO_REFATORACAO.md).
