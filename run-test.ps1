$json = '{"email":"test-' + (Get-Date -Format "HHmmss") + '@example.com","code":"654321"}'
Write-Output "Running test with: $json"
npx convex run --deployment focused-lyrebird-470 --typecheck disable users:testVerifyFlow $json 2>&1
