# 🍳 eRecipes — Site de Receitas Inteligente

> Diga o que você tem na geladeira e descubra o que cozinhar hoje.

## 📖 Sobre o projeto

O **eRecipes** é uma aplicação web que encontra receitas a partir dos ingredientes que você já tem em casa. Em vez de procurar uma receita e depois sair comprando o que falta, você informa o que está disponível na sua geladeira e na despensa, e o sistema retorna as receitas cadastradas que dá para preparar com eles.

O projeto foi desenvolvido como trabalho acadêmico do curso de **Ciência da Computação do IFSP – Campus Salto**.

### O problema

- **O dilema diário:** "o que eu cozinho hoje?"
- **Desperdício:** alimentos esquecidos na geladeira até estragarem.
- **Falta de inspiração:** dificuldade em combinar ingredientes que já estão em casa.

### Objetivo

Desenvolver uma aplicação web para encontrar receitas baseadas exatamente nos ingredientes que o usuário possui, promovendo:

- 🌱 **Sustentabilidade** — redução do desperdício de alimentos em casa
- ⏱️ **Praticidade** — menos tempo pensando no que fazer
- ✨ **Inspiração** — refeições novas com o que já existe na cozinha

## ⚙️ Funcionalidades

| Funcionalidade | Descrição |
| --- | --- |
| 🔐 **Autenticação** | Cadastro e login seguro de usuários |
| 📝 **Gestão de receitas** | Cadastro de novas receitas com ingredientes e modo de preparo |
| 🔎 **Busca inteligente** | Filtro de receitas pelos ingredientes informados |
| 🗂️ **Categorização** | Organização das receitas por tipo culinário |

## 🔄 Fluxo do usuário

```
1. Informar  →  2. Buscar  →  3. Escolher  →  4. Preparar
```

1. **Informar** — o usuário lista os ingredientes que tem disponíveis.
2. **Buscar** — o sistema consulta o banco de receitas compatíveis.
3. **Escolher** — os resultados podem ser filtrados por categoria.
4. **Preparar** — o usuário visualiza a receita escolhida com o passo a passo.

## 🛠️ Tecnologias

O projeto é feito 100% em **JavaScript/TypeScript**.

- **Front-end:** [React](https://react.dev/) — interfaces dinâmicas e responsivas
- **Back-end:** [Node.js](https://nodejs.org/) — API REST
- **Banco de dados:** [MySQL](https://www.mysql.com/)

### Arquitetura

A aplicação segue uma **arquitetura MVC em camadas**, com front-end e back-end **desacoplados**: o cliente React consome a API Node.js, que concentra as regras de negócio e o acesso ao banco MySQL.

```
┌──────────────┐   HTTP/JSON   ┌──────────────────────────────┐        ┌─────────┐
│  React (UI)  │ ────────────► │  Node.js API                 │ ─────► │  MySQL  │
│  front-end   │ ◄──────────── │  routes → controllers →      │ ◄───── │         │
└──────────────┘               │  services → models           │        └─────────┘
                               └──────────────────────────────┘
```

## 📁 Estrutura do repositório

```
eRecipes/
├── frontend/          # Aplicação React
│   ├── src/
│   └── package.json
├── backend/           # API Node.js
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── models/
│   └── package.json
├── docs/              # Diagramas (casos de uso, classes, arquitetura)
└── README.md
```

## 🚀 Como executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [MySQL](https://www.mysql.com/) 8 ou superior
- npm (ou yarn/pnpm)

### 1. Clonar o repositório

```bash
git clone https://github.com/pedrohmelo027/eRecipes.git
cd eRecipes
```

### 2. Configurar o banco de dados

Crie o banco no MySQL:

```sql
CREATE DATABASE erecipes;
```

### 3. Back-end

```bash
cd backend
npm install
cp .env.example .env   # preencha com os dados do seu banco
npm run dev
```

Exemplo de `.env`:

```env
PORT=3333
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=erecipes
JWT_SECRET=troque_esta_chave
```

### 4. Front-end

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

A aplicação ficará disponível no endereço exibido no terminal (por exemplo, `http://localhost:5173`).

## 📐 Documentação

Os diagramas de engenharia de software do projeto ficam na pasta [`docs/`](./docs):

- Diagrama de casos de uso
- Diagrama de classes
- Diagrama de arquitetura do front-end
- Diagrama de arquitetura do back-end
- Diagrama de pacotes

## 👤 Autor

**Pedro** — estudante de Ciência da Computação no IFSP Salto

[![GitHub](https://img.shields.io/badge/GitHub-pedrohmelo027-181717?logo=github)](https://github.com/pedrohmelo027)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-perfil-0A66C2?logo=linkedin)](https://www.linkedin.com/in/pedro-henrique-nascimento-melo-9b8718278/)

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos. Distribuído sob a licença MIT — veja o arquivo [`LICENSE`](./LICENSE) para mais detalhes.
