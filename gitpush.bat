@echo off
cd /d D:\EasyBookTracker
git log --oneline -3 > D:\EasyBookTracker\gitout.txt 2>&1
git status >> D:\EasyBookTracker\gitout.txt 2>&1
git add -A >> D:\EasyBookTracker\gitout.txt 2>&1
git commit -m "feat: shelf wraps to 2 rows plus new spine colors" >> D:\EasyBookTracker\gitout.txt 2>&1
git push >> D:\EasyBookTracker\gitout.txt 2>&1
echo DONE >> D:\EasyBookTracker\gitout.txt
