@echo off
where git > D:\EasyBookTracker\gitout.txt 2>&1
if exist "C:\Program Files\Git\bin\git.exe" echo FOUND C:\Program Files\Git\bin\git.exe >> D:\EasyBookTracker\gitout.txt
if exist "C:\Program Files (x86)\Git\bin\git.exe" echo FOUND x86 >> D:\EasyBookTracker\gitout.txt
dir "C:\Program Files\Git\" >> D:\EasyBookTracker\gitout.txt 2>&1
