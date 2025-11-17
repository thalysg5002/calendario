# Como Gerar o Executável (.exe)

## Pré-requisitos

Certifique-se de ter instalado:
- Node.js (versão 18 ou superior)
- npm ou pnpm

## Passos para Gerar o Executável

### 1. Instalar Dependências

```powershell
pnpm install
```

ou

```powershell
npm install
```

### 2. Construir a Aplicação

```powershell
pnpm run build
```

Este comando irá:
- Compilar o código TypeScript
- Gerar os arquivos otimizados para produção na pasta `dist/`

### 3. Gerar o Executável com Electron

```powershell
pnpm run electron:build
```

ou para apenas testar sem criar instalador:

```powershell
pnpm run electron:build:dir
```

O executável será gerado em: `dist-app/`

### 4. Testar em Modo Desenvolvimento (opcional)

Para testar a aplicação Electron antes de fazer o build:

```powershell
pnpm run electron:dev
```

## Estrutura de Arquivos do Build

```
dist-app/
├── Calendário Igreja-1.0.0-Setup.exe  (Instalador)
└── win-unpacked/                       (Pasta com executável descompactado)
    └── Calendário Igreja.exe
```

## Troubleshooting

### Erro: "electron-builder not found"

```powershell
pnpm install electron-builder --save-dev
```

### Erro ao carregar a aplicação

1. Verifique se o build foi feito corretamente: `pnpm run build`
2. Verifique os logs do Electron no arquivo temporário

### Ícone não aparece

Certifique-se de que existe um arquivo `assets/icon.png` (256x256 ou maior)

## Personalização

### Alterar Ícone

Substitua o arquivo `assets/icon.png` por sua imagem (recomendado 512x512px)

### Alterar Nome da Aplicação

Edite `electron-builder.json`:
```json
{
  "productName": "Seu Nome Aqui"
}
```

### Configurações Adicionais

Veja documentação completa em: https://www.electron.build/
