@echo off
REM Automate firestore-send-email extension installation via powershell input

setlocal enabledelayedexpansion

echo 🚀 Installing firestore-send-email Firebase Extension...
echo ======================================================

REM Create temporary input file with all the responses
set tempfile=%temp%\firebase_ext_input.txt

(
echo.
echo.
echo.
echo smtps://MS_JABy3i@test-yxj6lj9qdz74do2r.mlsender.net@smtp.mailersend.net:587
echo 1
echo.
echo.
echo.
echo.
echo.
echo.
) > "%tempfile%"

REM Run firebase ext:install with input file
npx firebase ext:install firebase/firestore-send-email --project=agritectum-platform < "%tempfile%"

if errorlevel 1 (
    echo.
    echo ⚠️ Installation failed or incomplete
    echo Try manually at: https://console.firebase.google.com/project/agritectum-platform/extensions
) else (
    echo.
    echo ✅ Installation completed!
)

REM Cleanup
del "%tempfile%"

echo.
echo ======================================================
pause
