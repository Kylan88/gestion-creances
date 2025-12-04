param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("login","addClient","listClients","paiement","relance")]
    [string]$Action,

    [string]$Nom,
    [string]$Telephone,
    [string]$Email,
    [int]$Montant,
    [string]$DateEcheance,
    [int]$ClientId,
    [int]$MontantPaiement,
    [string]$DatePaiement
)

# -------------------------
# CONFIG
# -------------------------
$baseUrl = "http://127.0.0.1:5000"
$cookieFile = ".cookie.txt"
$csrfFile = ".csrf_token.txt"

# Créer une session vierge
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Si un cookie existe déjà, on le réinjecte
if (Test-Path $cookieFile) {
    $cookieValue = Get-Content $cookieFile -Raw
    if ($cookieValue -ne "") {
        $cookie = New-Object System.Net.Cookie
        $cookie.Name = "session"
        $cookie.Value = $cookieValue
        $cookie.Domain = "127.0.0.1"
        $cookie.Path = "/"
        $session.Cookies.Add($cookie)
    }
}

function Save-Cookie {
    param($session)
    $cookie = $session.Cookies.GetCookies("http://127.0.0.1:5000")["session"]
    if ($cookie) {
        $cookie.Value | Out-File $cookieFile
    }
}

function Get-CsrfToken {
    if (Test-Path $csrfFile) {
        return Get-Content $csrfFile -Raw
    }
    else {
        Write-Host "⚠️ Pas de CSRF token. Lancez d'abord : -Action login"
        exit
    }
}

# -------------------------
# ACTIONS
# -------------------------

if ($Action -eq "login") {
    $body = @{ username = "admin"; password = "password" } | ConvertTo-Json
    $res = Invoke-WebRequest -Uri "$baseUrl/login" -Method POST -ContentType "application/json" -Body $body -WebSession $session
    Save-Cookie $session
    Write-Host "=== LOGIN ==="
    $res.Content

    # Récupérer immédiatement le CSRF token avec la même session
    $csrfRes = Invoke-WebRequest -Uri "$baseUrl/api/csrf_token" -Method GET -WebSession $session
    $csrf = ($csrfRes.Content | ConvertFrom-Json).csrf_token
    $csrf | Out-File $csrfFile
    Write-Host "=== CSRF Token associé à la session ==="
    Write-Host $csrf
}

elseif ($Action -eq "addClient") {
    $csrf = Get-CsrfToken
    $body = @{
        nom = $Nom
        telephone = $Telephone
        email = $Email
        montant_du = $Montant
        date_echeance = $DateEcheance
    } | ConvertTo-Json -Depth 10

    $res = Invoke-WebRequest -Uri "$baseUrl/clients/add" -Method POST -ContentType "application/json" `
        -Headers @{ "X-CSRF-Token" = $csrf } -Body $body -WebSession $session

    Write-Host "=== AJOUT CLIENT ==="
    $res.Content
}

elseif ($Action -eq "listClients") {
    $res = Invoke-WebRequest -Uri "$baseUrl/api/clients?page=1&per_page=5" -Method GET -WebSession $session
    Write-Host "=== LISTE CLIENTS ==="
    $res.Content
}

elseif ($Action -eq "paiement") {
    $csrf = Get-CsrfToken
    $body = @{
        montant = $MontantPaiement
        date_paiement = $DatePaiement
    } | ConvertTo-Json

    $res = Invoke-WebRequest -Uri "$baseUrl/clients/$ClientId/paiement" -Method POST -ContentType "application/json" `
        -Headers @{ "X-CSRF-Token" = $csrf } -Body $body -WebSession $session

    Write-Host "=== PAIEMENT ==="
    $res.Content
}

elseif ($Action -eq "relance") {
    $csrf = Get-CsrfToken
    $res = Invoke-WebRequest -Uri "$baseUrl/clients/$ClientId/relance" -Method POST -WebSession $session `
        -Headers @{ "X-CSRF-Token" = $csrf }

    Write-Host "=== RELANCE ==="
    $res.Content
}
