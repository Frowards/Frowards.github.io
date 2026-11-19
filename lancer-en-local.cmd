@echo off
REM ==========================================================================
REM  Lancer le portfolio en local
REM
REM  Les modules ES ne se chargent pas depuis une page ouverte en double-clic
REM  (adresse file://) : ce script sert le dossier sur http://localhost:8000
REM  puis ouvre la page dans le navigateur par défaut.
REM
REM  Prérequis : Python 3 (recommandé) ou, à défaut, Node.js (npx serve).
REM  Arrêt du serveur : Ctrl+C dans cette fenêtre (ou la fermer).
REM ==========================================================================
setlocal
chcp 65001 >nul

set "PORT=8000"
set "URL=http://localhost:%PORT%"

REM Servir le dossier du script, quel que soit le dossier de lancement
cd /d "%~dp0"

REM Recherche de Python : lanceur Windows "py", puis "python".
REM --version écarte le faux "python" du Microsoft Store (simple raccourci).
set "PY="
py --version >nul 2>nul && set "PY=py"
if not defined PY (python --version >nul 2>nul && set "PY=python")

if defined PY goto :python

REM Python absent : repli sur Node.js
where npx >nul 2>nul
if errorlevel 1 goto :aucun

echo Python introuvable : démarrage avec Node.js (npx serve) sur %URL%
call :ouvrir
npx --yes serve -l %PORT% .
goto :fin

:python
echo Démarrage du serveur local sur %URL%  (Ctrl+C pour arrêter)
call :ouvrir
%PY% -m http.server %PORT% --bind 127.0.0.1
goto :fin

:aucun
echo Ni Python ni Node.js n'ont été trouvés sur ce poste.
echo Installez Python 3 (https://www.python.org) puis relancez ce fichier.
pause
goto :fin

REM Ouvre la page après ~2 secondes, le temps que le serveur démarre
REM (fenêtre réduite et indépendante : le serveur garde celle-ci)
:ouvrir
start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & start "" %URL%"
exit /b

:fin
endlocal
