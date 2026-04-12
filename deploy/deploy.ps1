# ─────────────────────────────────────────────────────────────
# rubbermats.ch — FTP deployment script (WinSCP / PowerShell)
# Usage: .\deploy\deploy.ps1
# Requires: WinSCP .NET assembly (or install via: winget install WinSCP)
# ─────────────────────────────────────────────────────────────

param(
    [string]$FtpHost   = $env:FTP_HOST   ?? "sl71.web.hostpoint.ch",
    [string]$FtpUser   = $env:FTP_USER   ?? "ftp@rubbermats.ch",
    [string]$FtpPass   = $env:FTP_PASS   ?? "",
    [string]$RemoteDir = $env:REMOTE_DIR ?? "/"
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$Excludes = @(
    "litho-template\", "node_modules\", ".git\", ".vs\", ".claude\",
    "deploy\", "*.md", "_generate-*.js",
    "index-old-homepage.html", "mail-config.local.php"
)

# ── Summary ──────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  rubbermats.ch — FTP Deployment" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source:  $ProjectRoot"
Write-Host "Target:  ${FtpHost}:${RemoteDir}"
Write-Host "User:    $FtpUser"
Write-Host ""

# Count files
$files = Get-ChildItem -Path $ProjectRoot -Recurse -File |
    Where-Object {
        $rel = $_.FullName.Substring($ProjectRoot.Length + 1)
        -not ($rel -match "^(litho-template|\.git|\.vs|\.claude|node_modules|deploy)\\") -and
        -not ($rel -match "\.md$") -and
        -not ($rel -match "^_generate-") -and
        $_.Name -ne "index-old-homepage.html" -and
        $_.Name -ne "mail-config.local.php"
    }

$totalSize = ($files | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($totalSize / 1MB, 1)

Write-Host "Files to upload: $($files.Count)"
Write-Host "Estimated size:  ${sizeMB} MB"
Write-Host ""

$confirm = Read-Host "Proceed with upload? [y/N]"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

# ── Upload via WinSCP ────────────────────────────────────────
try {
    Add-Type -Path "C:\Program Files (x86)\WinSCP\WinSCPnet.dll"
} catch {
    Write-Host ""
    Write-Host "WinSCP .NET assembly not found." -ForegroundColor Red
    Write-Host "Install WinSCP: winget install WinSCP" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: use FileZilla or lftp manually with these settings:" -ForegroundColor Yellow
    Write-Host "  Host: $FtpHost"
    Write-Host "  User: $FtpUser"
    Write-Host "  Remote dir: $RemoteDir"
    Write-Host "  Exclude: litho-template/, .git/, node_modules/, deploy/"
    exit 1
}

$sessionOptions = New-Object WinSCP.SessionOptions -Property @{
    Protocol              = [WinSCP.Protocol]::Ftp
    FtpSecure             = [WinSCP.FtpSecure]::Explicit
    HostName              = $FtpHost
    UserName              = $FtpUser
    Password              = $FtpPass
    GiveUpSecurityAndAcceptAnyTlsHostCertificate = $true
}

$transferOptions = New-Object WinSCP.TransferOptions
$transferOptions.TransferMode = [WinSCP.TransferMode]::Automatic
$transferOptions.FileMask = "| litho-template\; .git\; .vs\; .claude\; node_modules\; deploy\; *.md; _generate-*.js; index-old-homepage.html; mail-config.local.php"

$session = New-Object WinSCP.Session
try {
    $session.Open($sessionOptions)
    Write-Host ""
    Write-Host "Connected. Synchronizing..." -ForegroundColor Green

    $result = $session.SynchronizeDirectories(
        [WinSCP.SynchronizationMode]::Remote,
        $ProjectRoot,
        $RemoteDir,
        $false,                    # delete files on remote not in local
        $false,                    # mirror mode
        [WinSCP.SynchronizationCriteria]::Time,
        $transferOptions
    )

    $result.Check()
    Write-Host ""
    Write-Host "Deployment complete. Uploaded $($result.Uploads.Count) files." -ForegroundColor Green
    Write-Host "Visit: https://rubbermats.ch" -ForegroundColor Cyan
} finally {
    $session.Dispose()
}
