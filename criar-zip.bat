@echo off
echo ========================================
echo  GERADOR DE ZIP - Rota do Estudo
echo ========================================
echo.

:: Definir nome do arquivo
set "FILENAME=rota-do-estudo-v1.0.0.zip"

:: Verificar se existe um ZIP antigo e remover
if exist "..\%FILENAME%" (
    echo Removendo ZIP antigo...
    del "..\%FILENAME%"
    echo.
)

echo Criando novo arquivo ZIP...
echo.

:: Criar ZIP (requer PowerShell)
powershell -Command "Compress-Archive -Path '.\manifest.json', '.\background.js', '.\popup', '.\content', '.\icons' -DestinationPath '..\%FILENAME%' -Force"

echo.
if exist "..\%FILENAME%" (
    echo ✅ SUCESSO! ZIP criado em:
    echo    %CD%\..\%FILENAME%
    echo.
    echo Tamanho:
    dir "..\%FILENAME%" | findstr "rota-do-estudo"
) else (
    echo ❌ ERRO! Nao foi possivel criar o ZIP.
)

echo.
echo ========================================
echo Pressione qualquer tecla para fechar...
pause >nul
