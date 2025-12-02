# PowerShell script to reset inspector passwords
# Run this after starting Firebase Emulators

$NEW_PASSWORD = "Inspector123!"

Write-Host "🔐 Resetting Inspector Passwords..." -ForegroundColor Green
Write-Host ""

# Inspector User IDs and names
$inspectors = @(
    @{Id="1TngdzOaS7Xfd1GHJedLNuGX1g52"; Name="Petra Petersson"; Email="petra.petersson@taklaget.se"; Branch="goteborg"},
    @{Id="Uoa88HXQaefquAKA5gJIDBzHis73"; Name="Anders Andersson"; Email="anders.andersson@taklaget.se"; Branch="malmo"},
    @{Id="gKexXWp6cZbkodvWeNbAkT843jS2"; Name="Lars Larsson"; Email="lars.larsson@taklaget.se"; Branch="goteborg"},
    @{Id="iEwYDXyQLqa9jlKznHFZkO09sF53"; Name="Erik Andersson"; Email="erik.andersson@taklaget.se"; Branch="stockholm"},
    @{Id="sPvhXNxiSucbEjnxNvp6VqDhHM52"; Name="Karin Karlsson"; Email="karin.karlsson@taklaget.se"; Branch="malmo"},
    @{Id="sUfpSJgikgTviVzZRlalAuz6Hwo2"; Name="Sofia Johansson"; Email="sofia.johansson@taklaget.se"; Branch="stockholm"}
)

foreach ($inspector in $inspectors) {
    Write-Host "🔄 Resetting $($inspector.Name) ($($inspector.Email))..." -ForegroundColor Yellow
    
    $body = @{
        localId = $inspector.Id
        password = $NEW_PASSWORD
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:update" -Method POST -Body $body -ContentType "application/json"
        Write-Host "✅ Successfully reset password for $($inspector.Name)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to reset password for $($inspector.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Password reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 All inspectors can now login with:" -ForegroundColor Cyan
Write-Host "   Password: $NEW_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "📋 Inspector Login Credentials:" -ForegroundColor Cyan
foreach ($inspector in $inspectors) {
    Write-Host "   • $($inspector.Email) / $NEW_PASSWORD ($($inspector.Branch))" -ForegroundColor White
}

