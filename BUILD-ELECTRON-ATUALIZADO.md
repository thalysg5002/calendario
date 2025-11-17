# 🚀 Sistema de Calendário - Build Electron Atualizado

## ✅ Configuração Completa

O sistema foi configurado para gerar executáveis Windows (.exe) usando Electron + electron-builder.

### 📁 Arquivos Criados/Atualizados

1. **electron/main.cjs** - Processo principal do Electron
2. **electron/preload.cjs** - Script de preload para segurança
3. **electron-builder.json** - Configuração do empacotador
4. **package.json** - Scripts atualizados
5. **build-electron-simple.bat** - Script automático de build
6. **ELECTRON-BUILD-GUIDE.md** - Guia detalhado

---

## 🎯 Como Gerar o Executável

### Opção 1: Script Automático (Recomendado)

Simplesmente execute:

```powershell
.\build-electron-simple.bat
```

### Opção 2: Comandos Manuais

```powershell
# 1. Instalar dependências
pnpm install

# 2. Build da aplicação
pnpm run build

# 3. Gerar executável
pnpm run electron:build
```

---

## 📦 Resultado do Build

Após a execução bem-sucedida, você encontrará:

```
dist-app/
├── Calendário Igreja-1.0.0-Setup.exe    ← Instalador completo
└── win-unpacked/                         ← Pasta executável portátil
    ├── Calendário Igreja.exe             ← Executável principal
    ├── resources/
    │   └── app/
    │       └── dist/                     ← Arquivos da aplicação
    └── ...outros arquivos do Electron
```

---

## 🧪 Testar em Desenvolvimento

Para testar a aplicação Electron localmente antes do build:

```powershell
pnpm run electron:dev
```

Este comando irá:
1. Iniciar o servidor Vite (http://localhost:8080)
2. Abrir a janela do Electron conectada ao servidor

---

## 🔧 Configurações

### Personalizar Nome/Ícone

Edite `electron-builder.json`:

```json
{
  "appId": "com.suaigreja.calendario",
  "productName": "Nome da Sua Igreja - Calendário"
}
```

### Ícone da Aplicação

Substitua `assets/icon.png` por seu logotipo (recomendado: 512x512px, PNG)

### Versão

Atualize em `package.json`:

```json
{
  "version": "1.0.0"
}
```

---

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `pnpm run dev` | Desenvolvimento web (Vite) |
| `pnpm run build` | Build para produção |
| `pnpm run electron:dev` | Teste Electron em desenvolvimento |
| `pnpm run electron:build` | Gera instalador .exe |
| `pnpm run electron:build:dir` | Gera apenas pasta executável (mais rápido) |

---

## ⚠️ Requisitos

- **Node.js**: 18.x ou superior
- **npm/pnpm**: Gerenciador de pacotes
- **Windows**: Para gerar .exe (ou Linux/Mac para AppImage/DMG)

---

## 🐛 Solução de Problemas

### 1. Erro "Cannot find module 'electron'"

```powershell
pnpm install
```

### 2. Build falha

Verifique se executou o build antes:

```powershell
pnpm run build
```

### 3. Executável não inicia

- Verifique se a pasta `dist/` foi gerada corretamente
- Execute `pnpm run electron:build:dir` para debug

### 4. Ícone não aparece

- Certifique-se que `assets/icon.png` existe
- Formato recomendado: PNG, 512x512px ou maior

---

## 📚 Documentação Adicional

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [Vite](https://vitejs.dev/)

---

## ✨ Próximos Passos

Após gerar o executável:

1. **Teste o instalador** em uma máquina limpa
2. **Distribua** o arquivo Setup.exe para os usuários
3. **Configure atualização automática** (opcional) usando electron-updater

---

**Criado em:** ${new Date().toLocaleDateString('pt-BR')}
**Versão:** 1.0.0
