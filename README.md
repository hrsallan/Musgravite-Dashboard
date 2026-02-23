# Musgravite Dashboard

O **Musgravite Dashboard** é uma plataforma analítica desenvolvida para o monitoramento e gestão de Notas AM, oferecendo insights detalhados sobre reclamações de leitura de consumo de energia. Através de visualizações interativas e processamento de dados eficiente, a ferramenta auxilia na tomada de decisões estratégicas e operacionais.

## 📝 O que é Nota AM?

No contexto do Musgravite Dashboard, as **Notas AM** representam registros de reclamações relacionadas a erros de leitura de consumo, formalizadas diretamente pelo cliente junto à concessionária Companhia Energética de Minas Gerais (CEMIG).

Essas ocorrências são originadas fora do fluxo operacional interno, sendo abertas quando o cliente contesta valores faturados devido a possíveis inconsistências na leitura do medidor.

### 🔎 Conceito Operacional

As Notas AM correspondem a:

*   Reclamações de erro de leitura;
*   Registros iniciados diretamente pelo cliente na concessionária;
*   Demandas que podem resultar em releitura, reanálise técnica ou correção de faturamento.

### 🎯 Finalidade no Musgravite Dashboard

Dentro do Musgravite Dashboard, as Notas AM são utilizadas para:

*   📈 **Contabilização e acompanhamento de volumes;**
*   📊 **Monitoramento de indicadores e métricas de desempenho;**
*   🔁 **Análise de reincidência e tendências;**
*   🧠 **Suporte à tomada de decisão estratégica e operacional.**

---

## 🚀 Tecnologias Utilizadas

Este projeto foi desenvolvido utilizando uma arquitetura moderna e eficiente, separando o frontend do backend para garantir escalabilidade e manutenção simplificada.

### Frontend
*   **[React](https://reactjs.org/):** Biblioteca JavaScript para construção de interfaces de usuário interativas.
*   **[Vite](https://vitejs.dev/):** Build tool que oferece um ambiente de desenvolvimento rápido e otimizado.
*   **JavaScript (ES6+):** Linguagem de programação utilizada para a lógica da interface.

### Backend
*   **[Python](https://www.python.org/):** Linguagem principal para o processamento de dados e lógica de servidor.
*   **[Flask](https://flask.palletsprojects.com/):** Microframework web leve e flexível para criação da API.
*   **[SQLite](https://www.sqlite.org/):** Banco de dados relacional embutido para armazenamento leve e eficiente.
*   **[Pandas](https://pandas.pydata.org/):** Biblioteca poderosa para análise e manipulação de dados (utilizada no processamento dos arquivos `.xlsx` e `.csv`).

---

## 📦 Instalação e Execução

Siga os passos abaixo para configurar e rodar o projeto localmente.

### Pré-requisitos

*   **Node.js** (versão 14 ou superior)
*   **Python** (versão 3.8 ou superior)

### 1. Configuração do Backend

Navegue até a pasta `backend`:

```bash
cd backend
```

Recomendamos a criação de um ambiente virtual:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

Instale as dependências necessárias:

```bash
pip install flask flask-cors pandas openpyxl
```

Execute o servidor:

```bash
python app.py
```

O backend estará rodando em `http://localhost:5000`.

### 2. Configuração do Frontend

Em um novo terminal, navegue até a raiz do projeto (onde está o `package.json`):

```bash
cd ..
# ou apenas abra o terminal na raiz se já não estiver no backend
```

Instale as dependências do projeto:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O frontend estará disponível geralmente em `http://localhost:5173` (ou outra porta indicada pelo Vite).

---

## 🛠 Funcionalidades Principais

*   **Dashboard Interativo:** Visualização de métricas principais, gráficos de barras e rosca.
*   **Upload de Arquivos:** Importação de relatórios `.xlsx`, `.xls` ou `.csv` para processamento automático.
*   **Análise por Região e Cidade:** Detalhamento dos dados geográficos para identificar focos de reclamações.
*   **Ranking:** Classificação das regiões com maior volume de Notas AM.

---

Desenvolvido por **Allan Silva**.
