@echo off
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /PID %%p /F /T >nul 2>&1
echo Dev server stopped.
