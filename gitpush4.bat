@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
cd /d D:\EasyBookTracker
%GIT% add -A > D:\EasyBookTracker\gitout.txt 2>&1
%GIT% commit -m "feat: drag-to-shelf decorations, file upload, btn-primary fix, shelf padding" >> D:\EasyBookTracker\gitout.txt 2>&1
%GIT% push >> D:\EasyBookTracker\gitout.txt 2>&1
echo EXIT=%ERRORLEVEL% >> D:\EasyBookTracker\gitout.txt
