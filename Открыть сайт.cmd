@echo off
chcp 65001 >nul
title DARK MODE
cd /d "%~dp0"
if not exist node_modules (
  echo Устанавливаю зависимости, это один раз...
  call npm install
)
if not exist .next\BUILD_ID (
  echo Собираю сайт, это один раз...
  call npm run build
)
if /i not "%~1"=="nobrowser" start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 90;$i++){try{Invoke-WebRequest -UseBasicParsing http://localhost:3100 -TimeoutSec 2 | Out-Null; Start-Process 'http://localhost:3100'; break}catch{Start-Sleep -Seconds 1}}"
echo.
echo Сайт: http://localhost:3100
echo Пока это окно открыто, сайт работает. Закроешь окно - сайт выключится.
echo.
call npm run start
