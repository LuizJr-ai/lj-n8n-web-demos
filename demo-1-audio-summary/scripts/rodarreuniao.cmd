@echo off
setlocal

if "%~1"=="" (
  echo Uso: rodarreuniao.cmd caminho-do-audio.wav
  exit /b 2
)

PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\tests\run_live_meeting_qa.ps1" -AudioPath "%~1"
exit /b %ERRORLEVEL%
