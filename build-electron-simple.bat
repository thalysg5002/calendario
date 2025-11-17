@echo off
echo ========================================
echo   Construindo Executavel do Calendario
echo ========================================
echo.

echo [1/3] Instalando dependencias...
call pnpm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)

echo.
echo [2/3] Construindo aplicacao...
call pnpm run build
if %errorlevel% neq 0 (
    echo ERRO: Falha ao construir aplicacao
    pause
    exit /b 1
)

echo.
echo [3/3] Gerando executavel com Electron...
call pnpm run electron:build
if %errorlevel% neq 0 (
    echo ERRO: Falha ao gerar executavel
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo O executavel foi gerado em: dist-app\
echo.
pause
