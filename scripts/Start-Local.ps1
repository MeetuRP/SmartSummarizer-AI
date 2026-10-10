param(
    [ValidateSet('Prepare', 'Install', 'Ollama', 'Backend', 'Frontend')]
    [string]$Mode = 'Prepare'
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if ([IO.Path]::GetPathRoot($projectRoot) -ne 'D:\') { throw "Project root must be on D:. Found: $projectRoot" }
$cacheDirs = @('.cache\tmp', '.cache\pip', '.cache\huggingface\hub', '.cache\datasets', '.cache\torch', '.cache\torch_extensions', '.cache\npm', '.cache\uv', '.cache\pycache', '.models\ollama', '.models\faster-whisper')
foreach ($relative in $cacheDirs) { New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot $relative) | Out-Null }
$env:TEMP = Join-Path $projectRoot '.cache\tmp'
$env:TMP = $env:TEMP
$env:TMPDIR = $env:TEMP
$env:PIP_CACHE_DIR = Join-Path $projectRoot '.cache\pip'
$env:PYTHONPYCACHEPREFIX = Join-Path $projectRoot '.cache\pycache'
$env:HF_HOME = Join-Path $projectRoot '.cache\huggingface'
$env:HF_HUB_CACHE = Join-Path $env:HF_HOME 'hub'
$env:HF_DATASETS_CACHE = Join-Path $projectRoot '.cache\datasets'
$env:TORCH_HOME = Join-Path $projectRoot '.cache\torch'
$env:XDG_CACHE_HOME = Join-Path $projectRoot '.cache'
$env:TORCH_EXTENSIONS_DIR = Join-Path $projectRoot '.cache\torch_extensions'
$env:npm_config_cache = Join-Path $projectRoot '.cache\npm'
$env:UV_CACHE_DIR = Join-Path $projectRoot '.cache\uv'
$env:OLLAMA_MODELS = Join-Path $projectRoot '.models\ollama'
$env:OLLAMA_NO_CLOUD = '1'

Write-Host "Project and cache paths are on D: ($projectRoot)."
Write-Host "TEMP=$env:TEMP"
Write-Host "PIP_CACHE_DIR=$env:PIP_CACHE_DIR"
Write-Host "npm_config_cache=$env:npm_config_cache"
Write-Host "OLLAMA_MODELS=$env:OLLAMA_MODELS"
Write-Host "OLLAMA_NO_CLOUD=$env:OLLAMA_NO_CLOUD"
$venvForCacheCheck = Join-Path $projectRoot '.venv\Scripts\python.exe'
if (Test-Path $venvForCacheCheck) { Write-Host "Effective pip cache=$(& $venvForCacheCheck -m pip cache dir)" }
Push-Location (Join-Path $projectRoot 'frontend')
try { Write-Host "Effective npm cache=$(& npm.cmd config get cache)" }
finally { Pop-Location }

switch ($Mode) {
    'Prepare' { Write-Host 'Cache paths are prepared for child commands started by this script.' }
    'Install' {
        $python = Get-Command python -ErrorAction Stop
        $venvPython = Join-Path $projectRoot '.venv\Scripts\python.exe'
        if (-not (Test-Path $venvPython)) { & $python.Source -m venv (Join-Path $projectRoot '.venv'); if ($LASTEXITCODE -ne 0) { throw 'Could not create the project virtual environment.' } }
        & $venvPython -m pip install -r (Join-Path $projectRoot 'backend\requirements.txt')
        if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
        Push-Location (Join-Path $projectRoot 'frontend')
        try { npm.cmd ci --cache $env:npm_config_cache; if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' } }
        finally { Pop-Location }
    }
    'Ollama' {
        $ollamaExecutable = Join-Path $projectRoot '.tools\ollama\ollama.exe'
        if (-not (Test-Path -LiteralPath $ollamaExecutable)) { throw "Project-local Ollama was not found at $ollamaExecutable. Keep the runtime under D:." }
        $ollamaListener = Get-NetTCPConnection -State Listen -LocalPort 11434 -ErrorAction SilentlyContinue
        if ($ollamaListener) { throw 'Port 11434 is already in use. Stop the existing Ollama process so this D:-configured server owns model storage.' }
        & $ollamaExecutable serve
    }
    'Backend' {
        $venvPython = Join-Path $projectRoot '.venv\Scripts\python.exe'
        if (-not (Test-Path $venvPython)) { throw 'Create the D-drive .venv first with -Mode Install.' }
        Push-Location (Join-Path $projectRoot 'backend')
        try { & $venvPython -m uvicorn main:app --reload --port 8001 }
        finally { Pop-Location }
    }
    'Frontend' {
        Push-Location (Join-Path $projectRoot 'frontend')
        try { npm.cmd run dev }
        finally { Pop-Location }
    }
}
