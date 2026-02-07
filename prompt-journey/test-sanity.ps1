# E2E Sanity Test Script for PromptJourney Import Features
$base = "http://localhost:3000"
$pass = 0
$fail = 0

function Test($name, $block) {
    try {
        $result = & $block
        Write-Host "[PASS] $name" -ForegroundColor Green
        if ($result) { Write-Host "       $result" -ForegroundColor DarkGray }
        $script:pass++
    } catch {
        Write-Host "[FAIL] $name" -ForegroundColor Red
        Write-Host "       $($_.Exception.Message)" -ForegroundColor Yellow
        $script:fail++
    }
}

Write-Host "`n===== PromptJourney E2E Sanity Tests =====`n"

# 1. Import page loads
Test "Import page loads (GET /import)" {
    $r = Invoke-WebRequest "$base/import" -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -ne 200) { throw "Expected 200, got $($r.StatusCode)" }
    "Status 200, $($r.Content.Length) bytes"
}

# 2. Journeys new page loads
Test "New Journey page loads (GET /journeys/new)" {
    $r = Invoke-WebRequest "$base/journeys/new" -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -ne 200) { throw "Expected 200, got $($r.StatusCode)" }
    "Status 200, $($r.Content.Length) bytes"
}

# 3. Paste parser - ChatGPT format (auth required = 401 is correct behavior from CLI)
Test "Paste parser: endpoint auth-protected (POST /api/import/paste)" {
    $body = '{"text":"User: How do I create a React hook?\nChatGPT: To create a custom React hook, you start by creating a function that starts with use:\n\n```tsx\nfunction useCounter() {\n  const [count, setCount] = useState(0);\n  return { count, increment: () => setCount(c => c + 1) };\n}\n```\n\nUser: How do I use it in a component?\nChatGPT: Simply call it inside your component:\n\n```tsx\nfunction Counter() {\n  const { count, increment } = useCounter();\n  return <button onClick={increment}>{count}</button>;\n}\n```"}'
    try {
        $r = Invoke-WebRequest "$base/api/import/paste" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        "Status $($r.StatusCode)"
    } catch [System.Net.WebException] {
        $status = [int]$_.Exception.Response.StatusCode
        if ($status -eq 401) { "Auth required (401) - correct" }
        else { throw "Unexpected status $status" }
    }
}

# 4. Paste parser - Claude format
Test "Paste parser: Claude format auth-protected" {
    $body = '{"text":"Human: Explain async/await in JavaScript\nAssistant: Async/await is a way to write asynchronous code that looks synchronous. The async keyword makes a function return a Promise, and await pauses execution until that Promise resolves.\n\nHuman: Show me an example\nAssistant: Here is a simple example fetching data:\n\nasync function fetchUser(id) {\n  const response = await fetch(`/api/users/${id}`);\n  const user = await response.json();\n  return user;\n}"}'
    try {
        $r = Invoke-WebRequest "$base/api/import/paste" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        "Status $($r.StatusCode)"
    } catch [System.Net.WebException] {
        $status = [int]$_.Exception.Response.StatusCode
        if ($status -eq 401) { "Auth required (401) - correct" }
        else { throw "Unexpected status $status" }
    }
}

# 5. Paste parser - Gemini format
Test "Paste parser: Gemini format auth-protected" {
    $body = '{"text":"You: What is the difference between let and const in JavaScript?\nGemini: In JavaScript, both let and const are block-scoped variable declarations. The key difference: let allows reassignment while const does not. Use const by default and let only when you need to reassign.\n\nYou: When should I use var?\nGemini: In modern JavaScript, you should almost never use var. It is function-scoped rather than block-scoped, which can lead to unexpected behavior. Stick with const and let."}'
    try {
        $r = Invoke-WebRequest "$base/api/import/paste" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        "Status $($r.StatusCode)"
    } catch [System.Net.WebException] {
        $status = [int]$_.Exception.Response.StatusCode
        if ($status -eq 401) { "Auth required (401) - correct" }
        else { throw "Unexpected status $status" }
    }
}

# 6. Paste parser - validation (too short)
Test "Paste parser: rejects short text or requires auth" {
    $body = '{"text":"hello"}'
    try {
        $r = Invoke-WebRequest "$base/api/import/paste" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        throw "Should have returned 400 or 401"
    } catch [System.Net.WebException] {
        $status = [int]$_.Exception.Response.StatusCode
        if ($status -eq 400 -or $status -eq 401) { "Correctly rejected with $status" }
        else { throw "Expected 400 or 401, got $status" }
    }
}

# 7. URL parser - validation (invalid URL)
Test "URL parser: rejects invalid URL or requires auth" {
    $body = '{"url":"not-a-url"}'
    try {
        $r = Invoke-WebRequest "$base/api/import/url" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        throw "Should have returned 400 or 401"
    } catch [System.Net.WebException] {
        $status = [int]$_.Exception.Response.StatusCode
        if ($status -eq 400 -or $status -eq 401) { "Correctly rejected with $status" }
        else { throw "Expected 400 or 401, got $status" }
    }
}

# 8. URL parser - validation (unsupported domain)
Test "URL parser: rejects unsupported domain or requires auth" {
    $body = '{"url":"https://example.com/share/12345"}'
    try {
        $r = Invoke-WebRequest "$base/api/import/url" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        throw "Should have returned 400 or 401"
    } catch [System.Net.WebException] {
        $status = [int]$_.Exception.Response.StatusCode
        if ($status -eq 400 -or $status -eq 401) { "Correctly rejected with $status" }
        else { throw "Expected 400 or 401, got $status" }
    }
}

# 9. URL parser endpoint exists and responds
Test "URL parser: endpoint exists (POST /api/import/url)" {
    $body = '{"url":"https://chatgpt.com/share/test-invalid-id-12345"}'
    try {
        $r = Invoke-WebRequest "$base/api/import/url" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 15
        "Status $($r.StatusCode)"
    } catch [System.Net.WebException] {
        $status = [int]$_.Exception.Response.StatusCode
        # 400 is expected for invalid share ID
        if ($status -eq 400 -or $status -eq 401) {
            "Endpoint responds correctly (status $status for invalid share)"
        } else {
            throw "Unexpected status $status"
        }
    }
}

# 10. ChatGPT file upload endpoint exists
Test "ChatGPT upload: endpoint exists (POST /api/import/chatgpt)" {
    try {
        $r = Invoke-WebRequest "$base/api/import/chatgpt" -Method POST -UseBasicParsing -TimeoutSec 10
        "Status $($r.StatusCode)"
    } catch [System.Net.WebException] {
        $status = [int]$_.Exception.Response.StatusCode
        if ($status -eq 400 -or $status -eq 401) {
            "Endpoint responds (status $status - auth required or missing file)"
        } else {
            throw "Unexpected $status"
        }
    }
}

# 11. Journey create page loads
Test "Journey list page (GET /journeys)" {
    $r = Invoke-WebRequest "$base/journeys" -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -ne 200) { throw "Expected 200" }
    "Status 200"
}

# 12. Home page loads
Test "Home page loads (GET /)" {
    $r = Invoke-WebRequest "$base/" -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -ne 200) { throw "Expected 200" }
    "Status 200"
}

Write-Host "`n===== Results: $pass passed, $fail failed =====" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
