@echo off
REM Smart Tro MCP Server Startup Script for Windows

echo Starting Smart Tro MCP Server...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Navigate to MCP directory
cd /d "%~dp0"

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/upgrade dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Set environment variables
set GRADIO_SERVER_NAME=0.0.0.0
set GRADIO_SERVER_PORT=7860
set PROPERTY_API_URL=http://localhost:3001/api/properties/search

REM Start Gradio server
echo Starting Smart Tro MCP Gradio Server on http://localhost:7860
echo Backend API: %PROPERTY_API_URL%
echo.
echo Press Ctrl+C to stop the server
echo.

python gradio_server.py

pause
