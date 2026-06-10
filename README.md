# FlyEasy ✈️

FlyEasy é uma aplicação moderna e intuitiva para **gestão de viagens, checklist de tarefas e análise de dados (Dashboard)**, projetada para oferecer uma experiência ágil, fluida e visualmente premium.

O projeto conta com um frontend estático interativo e um backend robusto construído sobre a plataforma **.NET**, utilizando banco de dados **SQLite** para persistência local dos dados.

---

## 🎨 Design & Visual

A interface foi projetada utilizando as melhores práticas de design moderno:

- **Paleta de Cores Personalizada:** Tema baseado em tons de violeta e roxo cósmico, trazendo identidade visual forte e moderna.
- **Tipografia:** Uso da fonte _Outfit_ via Google Fonts.
- **Modo Claro / Escuro:** Trocador de tema integrado que memoriza a preferência do usuário localmente.
- **Micro-interações:** Efeitos de hover responsivos, animações nos botões e transições fluidas.

---

## 🚀 Funcionalidades

- **Cadastro de Viagens:** Controle completo de passageiro, destino, data de ida, data de volta, hotel, status de pagamento e valor.
- **Edição Contextual (Inline):** Clique com o botão direito nas células da tabela para editar rapidamente qualquer dado (Passageiro, Destino, Status, Datas) sem precisar de formulários complexos.
- **Checklist de Tarefas:** Checklist interativo integrado para organizar tarefas pré-viagem.
- **Dashboard Analítico:** Aba dedicada com métricas em tempo real (total investido, viagens pendentes, destino mais visitado) e gráficos interativos para análise de status de pagamento e gastos por destino.
- **Exportação para Excel:** Gera planilhas customizadas e estilizadas em formato `.xlsx` usando `ExcelJS` com formatação automática de moedas e alinhamentos.
- **Ações Rápidas:** Limpeza completa do banco de dados e exportação rápida no rodapé.

---

## 🛠️ Tecnologias Utilizadas

### Frontend

- **HTML5 & CSS3**
- **JavaScript (ES6+)**
- **ExcelJS**
- **Chart.js** (para geração de gráficos interativos no dashboard)

### Backend

- **.NET 8 (C# / ASP.NET Core Web API)**
- **Entity Framework Core**
- **SQLite**

---

## 🏁 Como Executar o Projeto

### Pré-requisitos

- [.NET SDK 8.0](https://dotnet.microsoft.com/pt-br/download) instalado.

### 1. Executando o Backend (API)

Abra o terminal na pasta do projeto e navegue até a pasta da API:

```bash
cd excel/ApiGestaoViagens
```

Execute a API utilizando o comando do .NET:

```bash
dotnet run
```

A API será iniciada e estará escutando no endereço `http://localhost:5144`.

### 2. Executando o Frontend

Basta abrir o arquivo `index.html` diretamente em seu navegador favorito, ou utilizar uma extensão como o _Live Server_ do VS Code para executá-lo sob um servidor local.

---
