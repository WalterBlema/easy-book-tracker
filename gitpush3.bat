@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd /d D:\EasyBookTracker
%GIT% status > D:\EasyBookTracker\gitout.txt 2>&1
%GIT% log --oneline -3 >> D:\EasyBookTracker\gitout.txt 2>&1
%GIT% remote -v >> D:\EasyBookTracker\gitout.txt 2>&1
echo --- >> D:\EasyBookTracker\gitout.txt
%GIT% add -A >> D:\EasyBookTracker\gitout.txt 2>&1
%GIT% commit -m "feat: emoji search drawer with categories; shelf wraps 2 rows; new spine colors" >> D:\EasyBookTracker\gitout.txt 2>&1
%GIT% push >> D:\EasyBookTracker\gitout.txt 2>&1
echo DONE EXIT=%ERRORLEVEL% >> D:\EasyBookTracker\gitout.txt
