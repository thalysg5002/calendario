@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║                   CALENDÁRIO - BUILD ELECTRON                          ║
echo ║                        Verificação Rápida                              ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.

echo 📁 Verificando estrutura de arquivos...
echo.

if exist "electron\main.cjs" (
    echo ✅ electron\main.cjs encontrado
) else (
    echo ❌ electron\main.cjs NÃO encontrado
)

if exist "electron\preload.cjs" (
    echo ✅ electron\preload.cjs encontrado
) else (
    echo ❌ electron\preload.cjs NÃO encontrado
)

if exist "electron-builder.json" (
    echo ✅ electron-builder.json encontrado
) else (
    echo ❌ electron-builder.json NÃO encontrado
)

if exist "assets\icon.png" (
    echo ✅ assets\icon.png encontrado
) else (
    echo ⚠️  assets\icon.png NÃO encontrado (opcional)
)

echo.
echo 📦 Verificando dependências...
echo.

where pnpm >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ pnpm instalado
) else (
    echo ⚠️  pnpm não encontrado ^(usando npm^)
)

where node >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js instalado
    node --version
) else (
    echo ❌ Node.js NÃO instalado
)

echo.
echo 📋 Comandos disponíveis:
echo.
echo    1. pnpm install          - Instalar dependências
echo    2. pnpm run build        - Build da aplicação
echo    3. pnpm run electron:build - Gerar executável
echo.
echo    OU use: .\build-electron-simple.bat
echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║  Se todos os itens estão ✅, você pode executar o build!               ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.
pause
