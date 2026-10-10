@echo off
title RIET Jaipur Enterprise ERP - 1-Click Launcher
echo ========================================================
echo  * RAJASTHAN INSTITUTE OF ENGINEERING & TECHNOLOGY
echo    RIET Jaipur - Enterprise College ERP Launcher
echo ========================================================
echo Starting Backend, Frontend and Edge Tunnel Supervisor...

start "FastAPI Backend" /min cmd /c ".\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 /nobreak >nul

start "Vite Frontend" /min cmd /c "cd sms-frontend && npm run dev"
timeout /t 3 /nobreak >nul

start "Cloudflare Edge Tunnel Supervisor" cmd /k ".\.venv\Scripts\python.exe tunnel_supervisor.py"

echo ========================================================
echo ERP Services Launched Successfully!
echo Check 'RIET_ERP_LIVE_LINK.txt' on your Desktop for live link.
echo ========================================================
