@echo off
:: =========================================
::  Easy Book Tracker — Git Setup & Push
::  Execute este arquivo UMA VEZ para
::  reconectar ao GitHub e fazer o push.
:: =========================================
set GIT="C:\Program Files\Git\bin\git.exe"
set REMOTE_URL=https://github.com/walterblema/easy-book-tracker.git

cd /d D:\EasyBookTracker

echo [1/5] Removendo .git corrompido...
rmdir /s /q .git

echo [2/5] Inicializando novo repositorio...
%GIT% init -b main

echo [3/5] Conectando ao GitHub...
%GIT% remote add origin %REMOTE_URL%

echo [4/5] Adicionando arquivos e fazendo commit...
%GIT% add -A
%GIT% commit -m "feat: emoji search drawer; shelf wraps 2 rows; 33 spine colors"

echo [5/5] Enviando para o GitHub...
%GIT% push -u origin main --force

echo.
echo ============================================
echo  Pronto! Vercel vai fazer deploy automatico.
echo ============================================
pause
