param(
    [switch]$CreateShortcutsOnly
)

$ErrorActionPreference = "Stop"

$root = Join-Path $PSScriptRoot ".."
$iconsPath = Join-Path $root "assets\icons"
$hostIconPath = Join-Path $iconsPath "host.ico"
$clientIconPath = Join-Path $iconsPath "client.ico"
$hostExePath = Join-Path $root "dist\Host\IslandGame.HostLauncher.exe"
$clientExePath = Join-Path $root "dist\Client\IslandGame.ClientLauncher.exe"
$hostShortcutPath = Join-Path $root "Island Game Host.lnk"
$clientShortcutPath = Join-Path $root "Island Game Client.lnk"

if (-not $CreateShortcutsOnly) {
    New-Item -ItemType Directory -Force -Path $iconsPath | Out-Null

    Add-Type -AssemblyName System.Drawing
    Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class NativeIconMethods
{
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool DestroyIcon(IntPtr hIcon);
}
"@

    function New-GameIcon {
        param(
            [string]$OutputPath,
            [string]$Label,
            [System.Drawing.Color]$TopColor,
            [System.Drawing.Color]$BottomColor,
            [System.Drawing.Color]$AccentColor
        )

        $size = 256
        $bitmap = New-Object System.Drawing.Bitmap($size, $size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.Clear([System.Drawing.Color]::Transparent)

        $backgroundRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
        $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            $backgroundRect,
            $TopColor,
            $BottomColor,
            90
        )
        $graphics.FillEllipse($backgroundBrush, 16, 16, 224, 224)

        $seaBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 33, 158, 188))
        $sandBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 244, 213, 141))
        $grassBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 124, 197, 118))
        $accentBrush = New-Object System.Drawing.SolidBrush($AccentColor)
        $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

        $graphics.FillEllipse($seaBrush, 42, 72, 172, 150)
        $graphics.FillEllipse($sandBrush, 60, 88, 136, 106)
        $graphics.FillEllipse($grassBrush, 78, 102, 100, 74)
        $graphics.FillEllipse($accentBrush, 102, 86, 52, 64)
        $graphics.FillEllipse($whiteBrush, 114, 70, 28, 28)

        $font = New-Object System.Drawing.Font("Segoe UI", 48, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $stringFormat = New-Object System.Drawing.StringFormat
        $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
        $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
        $graphics.DrawString($Label, $font, $whiteBrush, (New-Object System.Drawing.RectangleF(0, 0, $size, $size)), $stringFormat)

        $iconBitmap = New-Object System.Drawing.Bitmap($bitmap, 64, 64)
        $hIcon = $iconBitmap.GetHicon()
        $icon = [System.Drawing.Icon]::FromHandle($hIcon)
        $fileStream = [System.IO.File]::Create($OutputPath)
        $icon.Save($fileStream)
        $fileStream.Dispose()

        [NativeIconMethods]::DestroyIcon($hIcon) | Out-Null
        $icon.Dispose()
        $iconBitmap.Dispose()
        $font.Dispose()
        $stringFormat.Dispose()
        $accentBrush.Dispose()
        $whiteBrush.Dispose()
        $seaBrush.Dispose()
        $sandBrush.Dispose()
        $grassBrush.Dispose()
        $backgroundBrush.Dispose()
        $graphics.Dispose()
        $bitmap.Dispose()
    }

    New-GameIcon -OutputPath $hostIconPath -Label "H" -TopColor ([System.Drawing.Color]::FromArgb(255, 141, 208, 244)) -BottomColor ([System.Drawing.Color]::FromArgb(255, 15, 139, 141)) -AccentColor ([System.Drawing.Color]::FromArgb(255, 244, 162, 97))
    New-GameIcon -OutputPath $clientIconPath -Label "C" -TopColor ([System.Drawing.Color]::FromArgb(255, 168, 218, 220)) -BottomColor ([System.Drawing.Color]::FromArgb(255, 42, 157, 143)) -AccentColor ([System.Drawing.Color]::FromArgb(255, 38, 70, 83))
}

$shell = New-Object -ComObject WScript.Shell

function New-ShortcutFile {
    param(
        [string]$ShortcutPath,
        [string]$TargetPath,
        [string]$IconPath,
        [string]$Description
    )

    if (-not (Test-Path $TargetPath)) {
        return
    }

    $shortcut = $shell.CreateShortcut($ShortcutPath)
    $shortcut.TargetPath = $TargetPath
    $shortcut.WorkingDirectory = Split-Path $TargetPath
    $shortcut.IconLocation = $IconPath
    $shortcut.Description = $Description
    $shortcut.Save()
}

New-ShortcutFile -ShortcutPath $hostShortcutPath -TargetPath $hostExePath -IconPath $hostIconPath -Description "Inicia Island Game como anfitrion"
New-ShortcutFile -ShortcutPath $clientShortcutPath -TargetPath $clientExePath -IconPath $clientIconPath -Description "Abre Island Game como cliente"
