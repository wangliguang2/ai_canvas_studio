$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "AI Canvas Studio: http://127.0.0.1:7863"
python .\server.py
