# Projeto Técnico: Sistema de Notas Fiscais
Aplicação de Sistema de Notas FullStack Angular + C#

## Pré-requisitos

Certifique-se de ter instalado:
 
| Ferramenta | Versão mínima | Download |
|---|---|---|
| .NET SDK | 8.0 | https://dotnet.microsoft.com/download |
| SQL Server | 2019 ou superior | https://www.microsoft.com/sql-server |
| SQL Server Management Studio (SSMS) | qualquer | https://aka.ms/ssms |
| Node.js | 18.x ou superior | https://nodejs.org |
| Angular CLI | 17.x | `npm install -g @angular/cli` |
| Visual Studio 2022 | Community ou superior | https://visualstudio.microsoft.com |

## Passo 1

Descobrir o nome do seu servidor
 
Abra o **SQL Server Management Studio (SSMS)** e anote o nome que aparece no campo **"Nome do servidor"** na tela de login.

Teste a conexão no SSMS

1. Abra o SSMS
2. Conecte-se ao seu servidor
3. Confirme que consegue acessar o banco — as tabelas serão criadas automaticamente pelo EF Core
**Dica:** Não é necessário criar os bancos manualmente. O EF Core cria **EstoqueDB** e **FaturamentoDB** automaticamente na primeira execução (via migration).

##  Passo 2 
Abra os dois arquivos `appsettings.json` e substitua `SEU_SERVIDOR` pelo nome encontrado no Passo 1.

### SistemaEstoque.API/appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=SEU_SERVIDOR;Database=EstoqueDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### SistemaFaturamento.API/appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=SEU_SERVIDOR;Database=FaturamentoDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "EstoqueService": {
    "BaseUrl": "https://localhost:44334"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

**Se usar autenticação por usuário e senha (SQL Auth)**, substitua `Trusted_Connection=True` por: `User Id=sa;Password=SUA_SENHA;`

##  Passo 3

Abra o **Package Manager Console** no Visual Studio (`Ferramentas → Gerenciador de Pacotes NuGet → Console do Gerenciador de Pacotes`) ou use o terminal.

### Para o Serviço de Estoque
 
```bash
cd SistemaEstoque.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Para o Serviço de Faturamento
 
```bash
cd SistemaFaturamento.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Se o comando `dotnet ef` não for reconhecido: **dotnet tool install --global dotnet-ef**

> Após subir, cada serviço abrirá a documentação Swagger:
> - Estoque: https://localhost:44334/swagger
> - Faturamento: https://localhost:44340/swagger
 
## Passo 5

Com o VS Code aberto na pasta abra o **terminal** :
 

cd SistemaNotas-Front
 
### Instalar dependências (apenas na primeira vez)
npm install
 
### Iniciar o servidor de desenvolvimento
ng serve

 
Acesse no navegador: **http://localhost:4200**

## URLs dos Serviços

| Serviço | URL base | Swagger |
|---|---|---|
| Serviço de Estoque | https://localhost:44334 | https://localhost:44334/swagger |
| Serviço de Faturamento | https://localhost:44340 | https://localhost:44340/swagger |
| Frontend Angular | http://localhost:4200 | — |
 
> **Atenção:** Se as portas `44334` ou `44340` já estiverem em uso, o .NET escolherá outra porta automaticamente. Nesse caso, atualize:
> - O arquivo `appsettings.json` do Faturamento (`EstoqueService.BaseUrl`)
> - Os arquivos de service do Angular (`src/app/services/produto.ts` e `nota-fiscal.ts`)

## Funcionalidades
 
### Cadastro de Produtos
- Campos: Código (chave única), Descrição, Saldo inicial
- Listagem com saldo destacado em vermelho quando zerado
- Exclusão de produtos
### Emissão de Notas Fiscais
- Numeração sequencial automática
- Status inicial: **Aberta**
- Adição de múltiplos produtos com quantidades
- Validação de saldo disponível em tempo real
### Impressão de Notas
- Spinner de processamento durante a operação
- Dá baixa no estoque de cada item
- Atualiza o status para **Fechada**
- Nota Fechada não pode ser impressa novamente
### Lista de Notas
- Exibe o nome do produto (não apenas o código)
- Badge de status colorido (verde = Aberta, cinza = Fechada)
- Exclusão de notas

## Arquitetura
 
```
Angular Frontend (4200)
       |
       |──► SistemaEstoque.API (44334)  ──► SQL Server: EstoqueDB
       |
       |──► SistemaFaturamento.API (44340) ──► SQL Server: FaturamentoDB
                    |
                    |──► SistemaEstoque.API (chamada HTTP interna na impressão)
```

### Requisitos implementados
 
| Requisito | Implementação |
|---|---|
| Arquitetura de Microsserviços | Dois projetos ASP.NET Core independentes |
| Tratamento de Falha | `HttpRequestException` → HTTP 503 com mensagem amigável |
| Banco de Dados Real | Entity Framework Core + SQL Server |
| Concorrência *(opcional)* | `SemaphoreSlim(1,1)` no endpoint de impressão |
| Idempotência *(opcional)* | PK impede produto duplicado; status Fechada impede dupla baixa |

## Tecnologias utilizadas
 
**Backend:**
- ASP.NET Core 8 Web API
- Entity Framework Core 8
- SQL Server
- LINQ (`MaxAsync`, `Include`, `FirstOrDefaultAsync`, `Any`)
- `IHttpClientFactory` para comunicação entre microsserviços

**Frontend:**
- Angular 17+ (Standalone Components)
- Angular Material (MatTable, MatButton, MatSnackBar, MatSpinner, MatToolbar, MatSelect)
- RxJS (`Observable`, `forkJoin`, `catchError`, `finalize`)
- `ChangeDetectionStrategy.OnPush` + `ChangeDetectorRef.markForCheck()`
