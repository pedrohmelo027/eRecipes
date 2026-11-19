# 🍳 eRecipes — Site de Receitas Inteligente

> Diga o que você tem na geladeira e descubra o que cozinhar hoje.

🌐 **Acesse:** [erecipes-chi.vercel.app](https://erecipes-chi.vercel.app)

## 📖 Sobre o projeto

O **eRecipes** é uma aplicação web que encontra receitas a partir dos ingredientes que você já tem em casa. Em vez de procurar uma receita e depois sair comprando o que falta, você marca o que está disponível na geladeira e na despensa, e o sistema mostra as receitas que dá para preparar só com isso e, em seguida, as que usam algum desses ingredientes, junto com o que falta comprar.

O projeto foi desenvolvido como trabalho acadêmico do curso de **Ciência da Computação do IFSP – Campus Salto**.

### O problema

- **O dilema diário:** "o que eu cozinho hoje?"
- **Desperdício:** alimentos esquecidos na geladeira até estragarem.
- **Falta de inspiração:** dificuldade em combinar ingredientes que já estão em casa.

### Objetivo

Desenvolver uma aplicação web para encontrar receitas baseadas nos ingredientes que o usuário possui, promovendo:

- 🌱 **Sustentabilidade** — redução do desperdício de alimentos em casa
- ⏱️ **Praticidade** — menos tempo pensando no que fazer
- ✨ **Inspiração** — refeições novas com o que já existe na cozinha

## ⚙️ Funcionalidades

| Funcionalidade | Descrição |
| --- | --- |
| 🔐 **Autenticação** | Cadastro e login de usuários com JWT |
| 📝 **Gestão de receitas** | Cadastrar, editar e excluir as próprias receitas, com ingredientes, quantidades, unidade de medida, modo de preparo, tempo, rendimento e foto |
| 🔎 **Busca por ingredientes** | Seleção dos ingredientes em "bolinhas"; primeiro aparecem as receitas que dá para fazer só com eles, depois as que usam algum, mostrando o que falta |
| 🔁 **Sinônimos** | Nomes regionais do mesmo ingrediente (aipim, mandioca, macaxeira…) contam como iguais na busca, e cada receita mantém o nome usado pelo autor |
| 🗂️ **Categorias** | Filtro das receitas por tipo culinário (bolos, massas, saladas…) |
| 📚 **Todas as receitas** | Listagem pública e paginada das receitas cadastradas |
| 🛡️ **Administração** | O administrador edita, desativa e reativa usuários; receitas de usuários inativos deixam de aparecer |

## 🔄 Fluxo do usuário

```
1. Informar  →  2. Buscar  →  3. Escolher  →  4. Preparar
```

1. **Informar** — o usuário marca os ingredientes que tem disponíveis.
2. **Buscar** — o sistema consulta as receitas compatíveis, considerando os sinônimos.
3. **Escolher** — os resultados podem ser filtrados por categoria.
4. **Preparar** — o usuário vê a receita escolhida com o passo a passo.

## 🛠️ Tecnologias

O projeto é feito 100% em **TypeScript**.

- **Front-end:** [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [React Router](https://reactrouter.com/)
- **Back-end:** [Node.js](https://nodejs.org/) + [Express 5](https://expressjs.com/), com [Sequelize](https://sequelize.org/) (ORM), [Umzug](https://github.com/sequelize/umzug) (migrations e seeds), [Zod](https://zod.dev/) (validação) e JWT
- **Banco de dados:** [PostgreSQL](https://www.postgresql.org/) hospedado no [Supabase](https://supabase.com/)
- **Fotos das receitas:** [Supabase Storage](https://supabase.com/docs/guides/storage)
- **Hospedagem:** [Vercel](https://vercel.com/) (front-end e API)
- **Testes:** [Jest](https://jestjs.io/) + [Supertest](https://github.com/ladjs/supertest)

### Arquitetura

A aplicação segue uma **arquitetura MVC em camadas**, com front-end e back-end **desacoplados**: o cliente React consome a API Node.js, que concentra as regras de negócio e o acesso ao banco.

```
┌──────────────┐  HTTP/JSON  ┌──────────────────────────────┐        ┌────────────────────┐
│  React (UI)  │ ──────────► │  API Node.js (Express)       │ ─────► │  Supabase          │
│  front-end   │ ◄────────── │  routes → controllers →      │ ◄───── │  PostgreSQL        │
│  Vercel      │             │  services → models           │        │  Storage (fotos)   │
└──────────────┘             │  Vercel Function             │        └────────────────────┘
                             └──────────────────────────────┘
```

### Hospedagem

| Parte | Onde | Endereço |
| --- | --- | --- |
| Front-end | Vercel | [erecipes-chi.vercel.app](https://erecipes-chi.vercel.app) |
| API | Vercel (Function) | [erecipes-api.vercel.app/api](https://erecipes-api.vercel.app/api/categorias) |
| Banco de dados | Supabase (PostgreSQL) | — |
| Fotos | Supabase Storage | — |

O front-end encaminha as chamadas de `/api` para a API (veja `frontend/vercel.json`). Cada push na `main` gera um novo deploy na Vercel. As tabelas no Supabase têm RLS ligado, então a API REST pública do Supabase não lê nem altera os dados; só o backend acessa o banco.

## 📁 Estrutura do repositório

```
eRecipes/
├── frontend/              # Aplicação React (Vite)
│   └── src/
│       ├── api/           # Chamadas à API e tipos
│       ├── components/
│       ├── contexts/      # Autenticação
│       ├── hooks/
│       ├── pages/
│       └── routes/
├── backend/               # API Node.js
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/        # Usuario, Receita, ItemReceita, Ingrediente, Categoria e enums
│   │   ├── middlewares/   # Autenticação, autorização e erros
│   │   ├── validators/
│   │   └── database/      # Migrations e seeds
│   └── tests/
├── docs/                  # Diagramas e especificação de casos de uso
└── README.md
```

## 🚀 Como executar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- Um projeto no [Supabase](https://supabase.com/) (o plano gratuito serve) **ou** um PostgreSQL 15+ local
- npm

### 1. Clonar o repositório

```bash
git clone https://github.com/pedrohmelo027/eRecipes.git
cd eRecipes
```

### 2. Configurar o banco de dados e o storage

**Opção A — Supabase:** no painel do projeto, copie:

- a connection string em **Connect → Session pooler** → `DATABASE_URL`
- a URL do projeto e a chave `service_role` em **Project Settings → API** → `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`

O bucket público das fotos (`fotos-receitas`) é criado automaticamente no primeiro upload.

**Opção B — Postgres local:** deixe `DATABASE_URL` e `SUPABASE_URL` vazias e preencha `DB_HOST`, `DB_PORT`, `DB_USER` e `DB_PASSWORD`. As fotos ficam na pasta `backend/uploads`. Para subir um Postgres rápido com Docker/Podman:

```bash
podman run -d --name erecipes-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17
```

### 3. Back-end

```bash
cd backend
npm install
cp .env.example .env   # preencha conforme a opção escolhida acima
npm run db:setup       # cria as tabelas e os dados iniciais (categorias, ingredientes, sinônimos e admin)
npm run dev            # API em http://localhost:3333/api
```

Outros comandos do banco: `npm run db:migrate` (aplica migrations pendentes), `npm run db:migrate:undo` (desfaz a última) e `npm run db:seed`.

### 4. Front-end

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`, e o Vite encaminha `/api` para a API local.

### 5. Testes

```bash
cd backend
npm test
```

> Os testes sempre usam o Postgres local definido em `DB_*` + `DB_NAME_TEST`, **nunca** o Supabase: o banco de teste é apagado a cada execução.

## 📐 Documentação

Os artefatos de engenharia de software ficam na pasta [`docs/`](./docs):

- [Modelo de casos de uso](./docs/Modelo%20de%20Caso%20de%20Uso.png)
- [Especificação de casos de uso](./docs/Especifica%C3%A7%C3%A3o%20de%20Casos%20de%20Uso.pdf) (também em `.docx`)
- [Diagrama de classes](./docs/Diagrama%20de%20Classe.png)
- [Arquitetura](./docs/Arquitetura.png)
- Modelo do Astah com todos os diagramas: `eRecipes - Modelos Analise e Design.asta`

## 👤 Autor

**Pedro** — estudante de Ciência da Computação no IFSP Salto

[![GitHub](https://img.shields.io/badge/GitHub-pedrohmelo027-181717?logo=github)](https://github.com/pedrohmelo027)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-perfil-0A66C2?logo=linkedin)](https://www.linkedin.com/in/pedro-henrique-nascimento-melo-9b8718278/)

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos. Distribuído sob a licença MIT — veja o arquivo [`LICENSE`](./LICENSE) para mais detalhes.
