param(
    [Parameter(Mandatory = $false)]
    [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$PagesPath = Join-Path $ProjectRoot 'wwwroot\pages'
$CssPath = Join-Path $ProjectRoot 'wwwroot\css\shared-sidebar.css'
$JsPath = Join-Path $ProjectRoot 'wwwroot\js\shared-sidebar.js'
$Csproj = Get-ChildItem -LiteralPath $ProjectRoot -Filter '*.csproj' -File -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $Csproj) { throw "Could not find a .csproj file at '$ProjectRoot'. Copy this script to the CHTManagement project root or pass -ProjectRoot.`n" }
if (-not (Test-Path -LiteralPath $PagesPath)) { throw "Pages folder not found: $PagesPath" }
if (-not (Test-Path -LiteralPath $CssPath)) { throw "Missing shared CSS file: $CssPath. Copy the bundle's wwwroot\css\shared-sidebar.css first." }
if (-not (Test-Path -LiteralPath $JsPath)) { throw "Missing shared JS file: $JsPath. Copy the bundle's wwwroot\js\shared-sidebar.js first." }

$Utf8WithBom = New-Object System.Text.UTF8Encoding($true)
$FilesChanged = 0
$FilesSkipped = 0

Get-ChildItem -LiteralPath $PagesPath -Filter '*.html' -File | ForEach-Object {
    $page = $_
    if ($page.Name -ieq 'login.html') {
        Write-Host "Skipped login page (no sidebar): $($page.Name)" -ForegroundColor DarkGray
        $script:FilesSkipped++
        return
    }

    $content = [System.IO.File]::ReadAllText($page.FullName)
    $original = $content

    if ($content -notmatch '(?i)/css/shared-sidebar\.css') {
        $headClose = [regex]::Match($content, '(?i)</head>')
        if (-not $headClose.Success) {
            Write-Warning "Skipped $($page.Name): no closing </head> found."
            $script:FilesSkipped++
            return
        }
        $insert = "`r`n    <link rel=`"stylesheet`" href=`"/css/shared-sidebar.css`">`r`n"
        $content = $content.Insert($headClose.Index, $insert)
    }

    if ($content -notmatch '(?i)/js/shared-sidebar\.js') {
        $bodyClose = [regex]::Match($content, '(?i)</body>')
        if (-not $bodyClose.Success) {
            Write-Warning "Skipped $($page.Name): no closing </body> found."
            $script:FilesSkipped++
            return
        }
        $insert = "`r`n    <script src=`"/js/shared-sidebar.js`"></script>`r`n"
        $content = $content.Insert($bodyClose.Index, $insert)
    }

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($page.FullName, $content, $Utf8WithBom)
        Write-Host "Updated: $($page.Name)" -ForegroundColor Green
        $script:FilesChanged++
    } else {
        Write-Host "Already updated: $($page.Name)" -ForegroundColor DarkGray
    }
}

Write-Host ''
Write-Host "Shared sidebar installation complete." -ForegroundColor Green
Write-Host "HTML files changed: $FilesChanged; files skipped: $FilesSkipped"
Write-Host 'Next: Build the solution, run the app, and inspect several pages.' -ForegroundColor Cyan
