@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd /d D:\EasyBookTracker
%GIT% add -A > D:\EasyBookTracker\gitout.txt 2>&1
%GIT% commit -m "feat: shelf wraps to 2 rows plus new spine colors" >> D:\EasyBookTracker\gitout.txt 2>&1
%GIT% push >> D:\EasyBookTracker\gitout.txt 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> D:\EasyBookTracker\gitout.txt
