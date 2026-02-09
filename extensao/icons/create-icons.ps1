Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param([int]$Size, [string]$Path)

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'

    # Background circle
    $bgColor = [System.Drawing.Color]::FromArgb(26, 26, 46)
    $bgBrush = New-Object System.Drawing.SolidBrush $bgColor
    $g.FillEllipse($bgBrush, 0, 0, ($Size - 1), ($Size - 1))

    # Border
    $borderColor = [System.Drawing.Color]::FromArgb(233, 69, 96)
    $lineWidth = [Math]::Max(1, [int]($Size * 0.06))
    $borderPen = New-Object System.Drawing.Pen $borderColor, $lineWidth
    $g.DrawEllipse($borderPen, 1, 1, ($Size - 3), ($Size - 3))

    # Play triangle
    $playColor = [System.Drawing.Color]::FromArgb(233, 69, 96)
    $playBrush = New-Object System.Drawing.SolidBrush $playColor
    $cx = [int]($Size * 0.45)
    $cy = [int]($Size * 0.5)
    $r = [int]($Size * 0.25)

    $x1 = $cx - [int]($r * 0.3)
    $y1 = $cy - $r
    $x2 = $cx + [int]($r * 1.2)
    $y2 = $cy
    $x3 = $cx - [int]($r * 0.3)
    $y3 = $cy + $r

    $p1 = New-Object System.Drawing.Point $x1, $y1
    $p2 = New-Object System.Drawing.Point $x2, $y2
    $p3 = New-Object System.Drawing.Point $x3, $y3
    $points = @($p1, $p2, $p3)

    $g.FillPolygon($playBrush, $points)

    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Host "Created: $Path"
}

$base = $PSScriptRoot
Create-Icon -Size 16 -Path "$base\icon16.png"
Create-Icon -Size 48 -Path "$base\icon48.png"
Create-Icon -Size 128 -Path "$base\icon128.png"
Write-Host "All icons created!"
