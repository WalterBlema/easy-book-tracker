@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd /d D:\EasyBookTracker
%GIT% add -A > D:\EasyBookTracker\gitout.txt 2>&1
%GIT% commit -m "feat: resize handle on shelf decorations (drag corner to scale)" >> D:\EasyBookTracker\gitout.txt 2>&1
%GIT% push >> D:\EasyBookTracker\gitout.txt 2>&1
echo EXIT=%ERRORLEVEL% >> D:\EasyBookTracker\gitout.txt
