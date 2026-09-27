
# CineVault

O CineVault é um sistema de catálogo e avaliação de filmes que desenvolvi para a atividade DEV do Visagio Rocket Lab 2026.2.

O objetivo do projeto é permitir que um administrador gerencie os filmes cadastrados, consulte suas informações e adicione avaliações com notas e comentários.

## Tecnologias utilizadas

Para desenvolver o projeto, utilizei:

- React, TypeScript e Vite no frontend
- Python e FastAPI no backend
- SQLite como banco de dados
- SQLAlchemy para trabalhar com o banco de dados
- Alembic para criar e atualizar as tabelas do banco

## Funcionalidades

O sistema possui as seguintes funcionalidades:

- Cadastrar filmes com título, diretor, ano de lançamento, gêneros e sinopse.
- Visualizar os filmes em um catálogo com paginação.
- Pesquisar filmes pelo título.
- Acessar os detalhes de cada filme.
- Editar e excluir filmes cadastrados.
- Adicionar avaliações com notas de 1 a 5 estrelas e comentários.
- Visualizar as avaliações e a nota média de cada filme.

## Organização do projeto

O projeto está dividido em três pastas principais:

- `backend`: contém a API, os modelos do banco de dados, as migrações e o script de importação.
- `frontend`: contém a interface do sistema, desenvolvida com React e TypeScript.
- `data`: contém os arquivos CSV utilizados para preencher o banco de dados.

A estrutura principal é:

    CineVault/
    ├── backend/
    │   ├── app/
    │   ├── migrations/
    │   ├── scripts/
    │   │   └── import_csv.py
    │   ├── tests/
    │   ├── .env.example
    │   └── pyproject.toml
    ├── frontend/
    │   ├── src/
    │   ├── package.json
    │   └── vite.config.ts
    ├── data/
    │   ├── bases-1/
    │   └── bases-2/
    └── README.md

## Como executar o projeto

Para executar o CineVault, é necessário ter instalado:

- Python 3.11 ou superior
- Node.js e npm
- Git

Os passos abaixo mostram como configurar o backend, preparar o banco de dados e iniciar o frontend.

### 1. Clonar o repositório

Primeiro, clone o projeto do GitHub:

```bash
git clone https://github.com/Ranilton10/CineVault.git
cd CineVault
```

### 2. Configurar o backend

Abra um terminal e entre na pasta do backend:

```bash
cd backend
```

Crie um ambiente virtual para instalar as dependências do Python.

No Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

No Linux ou macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Depois, instale as dependências do projeto:

```bash
python -m pip install -e ".[dev]"
```

Agora, crie o arquivo `.env` a partir do exemplo disponível no projeto.

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

Esse arquivo contém as configurações utilizadas pelo backend, incluindo a conexão com o banco de dados.

### 3. Criar as tabelas do banco de dados

O CineVault utiliza SQLite e Alembic.

Com o terminal ainda na pasta `backend`, execute:

```bash
python -m alembic upgrade head
```

Esse comando executa as migrações do projeto e cria as tabelas necessárias no banco de dados.

### 4. Importar os arquivos CSV

Depois de criar as tabelas, é necessário importar os dados iniciais fornecidos na atividade.

Os arquivos estão organizados nas pastas `data/bases-1` e `data/bases-2`.

Para realizar a importação, execute o seguinte comando no terminal do backend:

```bash
python scripts/import_csv.py
```

O script importa os filmes, gêneros, pessoas, produtoras, relacionamentos, informações de desempenho e avaliações.

Também verifica se as tabelas já possuem registros, evitando que os mesmos dados sejam importados novamente.

**Importante:** execute a importação apenas uma vez, depois de criar o banco de dados.

Como a base possui muitos registros, a importação pode demorar um pouco.

### 5. Iniciar o backend

Após configurar o banco de dados, inicie o servidor:

```bash
python -m uvicorn app.main:app --reload
```

O backend estará disponível em:

http://localhost:8000

Também é possível acessar a documentação automática da API:

http://localhost:8000/docs

Deixe esse terminal aberto enquanto estiver utilizando o sistema.

### 6. Configurar e iniciar o frontend

Abra outro terminal na pasta principal do CineVault.

Entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Depois, inicie o frontend:

```bash
npm run dev
```

A aplicação estará disponível em:

http://localhost:5173

Para utilizar o CineVault, é necessário manter o backend e o frontend funcionando ao mesmo tempo.

O Vite está configurado para encaminhar as requisições da aplicação ao backend FastAPI.

## Como utilizar o CineVault

Ao abrir a aplicação, o administrador encontra o catálogo de filmes.

Na página inicial, é possível pesquisar filmes pelo título, navegar pelas páginas do catálogo e cadastrar novos filmes.

Ao selecionar um filme, o sistema apresenta suas informações, como título, diretor, ano de lançamento, gêneros e sinopse.

Nessa mesma página, é possível editar ou excluir o filme, visualizar as avaliações existentes e adicionar uma nova avaliação.

Cada avaliação possui uma nota de 1 a 5 estrelas e um comentário. O sistema também apresenta a média das avaliações recebidas pelo filme.

## Banco de dados

Utilizei a estrutura de banco de dados disponibilizada no repositório inicial da atividade.

O projeto utiliza SQLAlchemy para trabalhar com as tabelas e Alembic para executar as migrações.

Os dados iniciais são carregados a partir dos arquivos CSV fornecidos.

O banco SQLite é criado localmente e não precisa ser enviado ao GitHub, pois pode ser reconstruído utilizando as migrações e o script de importação.

## Repositório original

O CineVault foi desenvolvido a partir do repositório-base:

https://github.com/Sophia-15/rocketlab2026-2


