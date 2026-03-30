$ErrorActionPreference = 'Stop'

function Get-Percentile {
    param(
        [double[]]$arr,
        [double]$pct
    )

    if ($arr.Count -eq 0) { return [double]::NaN }
    $sorted = $arr | Sort-Object
    $idx = [math]::Ceiling(($pct / 100.0) * $sorted.Count) - 1
    if ($idx -lt 0) { $idx = 0 }
    if ($idx -ge $sorted.Count) { $idx = $sorted.Count - 1 }
    return [math]::Round([double]$sorted[$idx], 2)
}

function Measure-Endpoint {
    param(
        [scriptblock]$Call,
        [int]$Iterations
    )

    $lat = @()
    $ok = 0
    $err = 0

    for ($i = 1; $i -le $Iterations; $i++) {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            & $Call | Out-Null
            $ok++
        }
        catch {
            $err++
        }
        $sw.Stop()
        $lat += [double]$sw.Elapsed.TotalMilliseconds
    }

    [PSCustomObject]@{
        ok  = $ok
        err = $err
        avg = [math]::Round((($lat | Measure-Object -Average).Average), 2)
        p95 = Get-Percentile -arr $lat -pct 95
        p99 = Get-Percentile -arr $lat -pct 99
        max = [math]::Round((($lat | Measure-Object -Maximum).Maximum), 2)
    }
}

$runId = Get-Date -Format yyyyMMddHHmmss
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8000/health/ready" | Out-Null

$email = "perf_user_${runId}@mail.com"
$registerBody = @{
    username  = $email
    password  = 'PerfPass123'
    nombre    = 'Perf'
    apellidos = 'Tester'
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/auth/register" -ContentType "application/json" -Body $registerBody | Out-Null

$login = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/auth/login" -ContentType "application/x-www-form-urlencoded" -Body "username=$email&password=PerfPass123"
$token = $login.access_token
$headers = @{ Authorization = "Bearer $token" }

$granja = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/granjas/" -Headers $headers -ContentType "application/json" -Body (@{ nombre = "PerfGranja_$runId"; ubicacion_geo = 'POINT(5 5)' } | ConvertTo-Json)
$parcela = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/parcelas/" -Headers $headers -ContentType "application/json" -Body (@{ granja_id = $granja.id; nombre = "PerfParcela_$runId"; tamx = 10; tamy = 10 } | ConvertTo-Json)
$casilla = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/casillas/" -Headers $headers -ContentType "application/json" -Body (@{ parcela_id = $parcela.id; posx = 1; posy = 1; estado = 'LISTO' } | ConvertTo-Json)
$sensor = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/sensores/" -Headers $headers -ContentType "application/json" -Body (@{ casilla_id = $casilla.id; numref = "PERF_SENSOR_$runId"; fabricante = 'ESP32'; tipo = 'humedad_suelo' } | ConvertTo-Json)

$workers = 6
$perWorker = 120
$jobs = @()
for ($w = 1; $w -le $workers; $w++) {
    $jobs += Start-Job -ScriptBlock {
        param($tok, $sensorId, $wId, $n)
        $h = @{ Authorization = "Bearer $tok" }
        $lat = @()
        $ok = 0
        $err = 0

        for ($i = 1; $i -le $n; $i++) {
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            try {
                $body = @{ sensor_id = $sensorId; variable = 'humedad_suelo'; valor = (30 + (($i + $wId) % 40)) } | ConvertTo-Json
                Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/mediciones/" -Headers $h -ContentType "application/json" -Body $body | Out-Null
                $ok++
            }
            catch {
                $err++
            }
            $sw.Stop()
            $lat += [double]$sw.Elapsed.TotalMilliseconds
        }

        [PSCustomObject]@{
            worker = $wId
            ok     = $ok
            err    = $err
            lat    = $lat
        }
    } -ArgumentList $token, $sensor.id, $w, $perWorker
}

Wait-Job -Job $jobs | Out-Null
$jobResults = Receive-Job -Job $jobs
Remove-Job -Job $jobs

$allLat = @()
$totalOk = 0
$totalErr = 0
foreach ($r in $jobResults) {
    $allLat += $r.lat
    $totalOk += $r.ok
    $totalErr += $r.err
}

$concP50 = Get-Percentile -arr $allLat -pct 50
$concP95 = Get-Percentile -arr $allLat -pct 95
$concP99 = Get-Percentile -arr $allLat -pct 99
$concAvg = [math]::Round((($allLat | Measure-Object -Average).Average), 2)
$concMax = [math]::Round((($allLat | Measure-Object -Maximum).Maximum), 2)

$mLogin = Measure-Endpoint -Iterations 60 -Call { Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/auth/login" -ContentType "application/x-www-form-urlencoded" -Body "username=$email&password=PerfPass123" }
$mGranjas = Measure-Endpoint -Iterations 80 -Call { Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8000/api/v1/granjas/?skip=0&limit=100" -Headers $headers }
$mMedGet = Measure-Endpoint -Iterations 80 -Call { Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8000/api/v1/mediciones/?sensor_id=$($sensor.id)&limit=200" -Headers $headers }

Write-Output "RUN_ID=$runId"
Write-Output "CONCURRENCY_POST_MEDICIONES workers=$workers perWorker=$perWorker totalReq=$($workers * $perWorker) ok=$totalOk err=$totalErr avg_ms=$concAvg p50_ms=$concP50 p95_ms=$concP95 p99_ms=$concP99 max_ms=$concMax"
Write-Output "LAT_AUTH_LOGIN n=60 ok=$($mLogin.ok) err=$($mLogin.err) avg_ms=$($mLogin.avg) p95_ms=$($mLogin.p95) p99_ms=$($mLogin.p99) max_ms=$($mLogin.max)"
Write-Output "LAT_GET_GRANJAS n=80 ok=$($mGranjas.ok) err=$($mGranjas.err) avg_ms=$($mGranjas.avg) p95_ms=$($mGranjas.p95) p99_ms=$($mGranjas.p99) max_ms=$($mGranjas.max)"
Write-Output "LAT_GET_MEDICIONES n=80 ok=$($mMedGet.ok) err=$($mMedGet.err) avg_ms=$($mMedGet.avg) p95_ms=$($mMedGet.p95) p99_ms=$($mMedGet.p99) max_ms=$($mMedGet.max)"
Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:8000/health/ready" | Out-Null
Write-Output "FINAL_HEALTH=OK"
