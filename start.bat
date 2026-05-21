@echo off
title Easy Book Tracker — Servidor Local
echo.
echo  =========================================
echo   Easy Book Tracker — iniciando servidor
echo  =========================================
echo.

:: Tenta Node.js (npx serve)
where node >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  Usando Node.js...
    echo  Abra: http://localhost:3000
    echo.
    echo  Pressione Ctrl+C para encerrar.
    echo.
    start "" "http://localhost:3000"
    npx --yes serve . -l 3000
    goto :end
)

:: Tenta Python 3
where python >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  Usando Python 3...
    echo  Abra: http://localhost:8080
    echo.
    echo  Pressione Ctrl+C para encerrar.
    echo.
    start "" "http://localhost:8080"
    python -m http.server 8080
    goto :end
)

:: Tenta Python (pode ser "py" no Windows)
where py >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo  Usando Python (py)...
    echo  Abra: http://localhost:8080
    echo.
    echo  Pressione Ctrl+C para encerrar.
    echo.
    start "" "http://localhost:8080"
    py -m http.server 8080
    goto :end
)

:: Nenhum encontrado
echo  ATEN??O: Node.js e Python nao encontrados.
echo.
echo  Instale uma das opcoes abaixo e tente de novo:
echo.
echo  1) Node.js  -> https://nodejs.org  (versao LTS)
echo  2) Python   -> https://python.org  (versao 3.x)
echo.
echo  Ou use o VS Code com a extensao "Live Server":
echo     Clique com botao direito no index.html
echo     e selecione "Open with Live Server".
echo.
pause

:end
