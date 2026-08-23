param(
    [string]$WasmBindgenPath = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$userProfilePath = [Environment]::GetFolderPath("UserProfile")
$cargoCommand = Get-Command cargo -ErrorAction SilentlyContinue
if ($cargoCommand) {
    $cargoPath = $cargoCommand.Source
} else {
    $cargoPath = Join-Path $userProfilePath ".cargo\bin\cargo.exe"
}
if (-not (Test-Path -LiteralPath $cargoPath)) {
    throw "cargo was not found"
}

$rustupPath = Join-Path (Split-Path -Parent $cargoPath) "rustup.exe"
if (-not (Test-Path -LiteralPath $rustupPath)) {
    throw "rustup was not found next to cargo"
}

& $rustupPath target add wasm32-unknown-unknown
if ($LASTEXITCODE -ne 0) {
    throw "failed to install the wasm32-unknown-unknown target"
}

$encodedFlagSeparator = [char]0x1f
$previousEncodedRustFlags = $env:CARGO_ENCODED_RUSTFLAGS
$privacyRustFlags = @(
    "--remap-path-prefix=$userProfilePath=/rust-user"
    "--remap-path-prefix=$projectRoot=/workspace"
) -join $encodedFlagSeparator

Push-Location $projectRoot
try {
    $env:CARGO_ENCODED_RUSTFLAGS = if ($previousEncodedRustFlags) {
        $previousEncodedRustFlags + $encodedFlagSeparator + $privacyRustFlags
    } else {
        $privacyRustFlags
    }
    & $cargoPath build --release -p gogma-wasm-search --target wasm32-unknown-unknown
    if ($LASTEXITCODE -ne 0) {
        throw "WASM cargo build failed"
    }

    if ($WasmBindgenPath) {
        $wasmBindgenExe = $WasmBindgenPath
    } else {
        $wasmBindgenCommand = Get-Command wasm-bindgen -ErrorAction SilentlyContinue
        $wasmBindgenExe = if ($wasmBindgenCommand) { $wasmBindgenCommand.Source } else { "" }
    }

    if (-not $wasmBindgenExe) {
        $version = "0.2.126"
        $expectedSha256 = "5A3773C7E69CFB2D865E235E9210DE184C8C3AF1787720646EC1A8BBE09C6179"
        $toolDirectory = Join-Path ([IO.Path]::GetTempPath()) (
            "gogma-wasm-bindgen-" + [guid]::NewGuid().ToString("N")
        )
        New-Item -ItemType Directory -Path $toolDirectory | Out-Null
        $archive = Join-Path $toolDirectory "wasm-bindgen.tar.gz"
        $downloadUrl = (
            "https://github.com/wasm-bindgen/wasm-bindgen/releases/download/" +
            "$version/wasm-bindgen-$version-x86_64-pc-windows-msvc.tar.gz"
        )
        Invoke-WebRequest -Uri $downloadUrl -OutFile $archive
        $actualSha256 = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash
        if ($actualSha256 -ne $expectedSha256) {
            throw "wasm-bindgen archive checksum mismatch"
        }
        tar -xf $archive -C $toolDirectory
        $wasmBindgenExe = Get-ChildItem -LiteralPath $toolDirectory -Recurse `
            -Filter "wasm-bindgen.exe" | Select-Object -First 1 -ExpandProperty FullName
    }

    if (-not $wasmBindgenExe -or -not (Test-Path -LiteralPath $wasmBindgenExe)) {
        throw "wasm-bindgen.exe was not found"
    }

    & $wasmBindgenExe --target web --out-dir web\pkg --out-name gogma_wasm_search `
        target\wasm32-unknown-unknown\release\gogma_wasm_search.wasm
    if ($LASTEXITCODE -ne 0) {
        throw "wasm-bindgen glue generation failed"
    }
} finally {
    $env:CARGO_ENCODED_RUSTFLAGS = $previousEncodedRustFlags
    Pop-Location
}

Write-Output "Generated web/pkg/gogma_wasm_search.js and WebAssembly binary."
