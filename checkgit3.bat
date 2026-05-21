@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd /d D:\EasyBookTracker
%GIT% log --oneline -5 > D:\EasyBookTracker\gitout.txt 2>&1
%GIT% remote -v >> D:\EasyBookTracker\gitout.txt 2>&1
%GIT% status >> D:\EasyBookTracker\gitout.txt 2>&1
echo EXIT=%ERRORLEVEL% >> D:\EasyBookTracker\gitout.txt
