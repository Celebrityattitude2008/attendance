@echo off
echo Starting Prella local server with Firebase Admin backend on http://localhost:8000
echo.
if not exist node_modules (
  echo Installing dependencies...
  npm install
)
npm start
pause

