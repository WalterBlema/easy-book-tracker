@echo off
dir /a D:\EasyBookTracker\.git > D:\EasyBookTracker\gitout.txt 2>&1
type D:\EasyBookTracker\.git\HEAD >> D:\EasyBookTracker\gitout.txt 2>&1
type D:\EasyBookTracker\.git\config >> D:\EasyBookTracker\gitout.txt 2>&1
