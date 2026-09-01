param(
  [string]$FfmpegPath = $env:FFMPEG_PATH
)

$ErrorActionPreference = 'Stop'
$culture = [System.Globalization.CultureInfo]::InvariantCulture
$videoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $FfmpegPath) {
  $command = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($command) { $FfmpegPath = $command.Source }
}
if (-not $FfmpegPath -or -not (Test-Path -LiteralPath $FfmpegPath)) {
  throw 'Set FFMPEG_PATH to an FFmpeg 5+ binary before rendering campaign videos.'
}

function Render-Campaign {
  param(
    [string]$FrameDirectory,
    [string]$OutputName,
    [double]$FrameSeconds = 3.0,
    [double]$FadeSeconds = 0.4
  )

  $frames = @(Get-ChildItem -LiteralPath $FrameDirectory -Filter '*.png' | Sort-Object Name)
  if ($frames.Count -lt 2) { throw "Campaign requires at least two frames: $FrameDirectory" }

  $frameDuration = $FrameSeconds.ToString('0.###', $culture)
  $fadeDuration = $FadeSeconds.ToString('0.###', $culture)
  $args = @('-y', '-hide_banner', '-loglevel', 'warning')
  foreach ($frame in $frames) {
    $args += @('-loop', '1', '-framerate', '30', '-t', $frameDuration, '-i', $frame.FullName)
  }

  $filters = @()
  for ($i = 0; $i -lt $frames.Count; $i++) {
    $filters += "[$i`:v]scale=1080:1920,zoompan=z='min(zoom+0.00042,1.034)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,trim=duration=$frameDuration,setpts=PTS-STARTPTS,format=yuv420p[v$i]"
  }

  $current = 'v0'
  for ($i = 1; $i -lt $frames.Count; $i++) {
    $offset = ($i * ($FrameSeconds - $FadeSeconds)).ToString('0.###', $culture)
    $next = "x$i"
    $filters += "[$current][v$i]xfade=transition=fade:duration=$fadeDuration`:offset=$offset[$next]"
    $current = $next
  }

  $total = $frames.Count * $FrameSeconds - ($frames.Count - 1) * $FadeSeconds
  $fadeOutStart = ($total - 0.4).ToString('0.###', $culture)
  $filters += "[$current]fade=t=in:st=0:d=0.18,fade=t=out:st=$fadeOutStart`:d=0.4[vout]"

  $output = Join-Path $videoRoot $OutputName
  $args += @(
    '-filter_complex', ($filters -join ';'),
    '-map', '[vout]',
    '-r', '30',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    $output
  )

  & $FfmpegPath @args
  if ($LASTEXITCODE -ne 0) { throw "FFmpeg failed for $FrameDirectory" }
  Write-Output "Rendered $output"
}

Render-Campaign -FrameDirectory (Join-Path $videoRoot 'campaign-frames/employer-readiness') -OutputName 'capital-mastery-employer-readiness-19s.mp4'
Render-Campaign -FrameDirectory (Join-Path $videoRoot 'campaign-frames/learner-work') -OutputName 'capital-mastery-learner-work-19s.mp4'
