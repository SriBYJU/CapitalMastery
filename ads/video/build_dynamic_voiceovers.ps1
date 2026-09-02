$ErrorActionPreference = 'Stop'
$culture = [System.Globalization.CultureInfo]::InvariantCulture
$videoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$voiceRoot = Join-Path $videoRoot 'voiceover'
$null = New-Item -ItemType Directory -Force -Path $voiceRoot

$ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source
$ffprobe = (Get-Command ffprobe -ErrorAction Stop).Source
$neuralRenderer = Join-Path $videoRoot 'build_neural_voiceovers.py'

python $neuralRenderer
if ($LASTEXITCODE -ne 0) { throw 'Kokoro neural voice rendering failed.' }

$campaigns = @(
  @{
    Name = 'learner'
    Video = 'capital-mastery-dynamic-learner-15s.mp4'
  },
  @{
    Name = 'employer'
    Video = 'capital-mastery-dynamic-employer-15s.mp4'
  }
)

foreach ($campaign in $campaigns) {
  $sourceVideo = Join-Path $videoRoot $campaign.Video
  if (-not (Test-Path -LiteralPath $sourceVideo)) {
    throw "Render the dynamic video before its voiceover: $sourceVideo"
  }

  $rawVoice = Join-Path $voiceRoot "$($campaign.Name)-voiceover-raw.wav"
  $masteredVoice = Join-Path $voiceRoot "$($campaign.Name)-voiceover.wav"
  $voicedVideo = Join-Path $videoRoot "capital-mastery-dynamic-$($campaign.Name)-15s-vo.mp4"

  $durationText = & $ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $rawVoice
  $duration = [double]::Parse(($durationText | Select-Object -First 1), $culture)
  $targetSpeechSeconds = 13.9
  $tempo = $duration / $targetSpeechSeconds
  if ($tempo -lt 0.5 -or $tempo -gt 2.0) {
    throw "Voiceover duration requires an unsupported tempo factor: $tempo"
  }
  $tempoText = $tempo.ToString('0.######', $culture)

  & $ffmpeg -y -hide_banner -loglevel warning -i $rawVoice -af "highpass=f=75,lowpass=f=10500,acompressor=threshold=-20dB:ratio=2.2:attack=12:release=180:makeup=2.5dB,atempo=$tempoText,loudnorm=I=-16:TP=-1.5:LRA=7,adelay=300,apad,atrim=duration=15,afade=t=in:st=0:d=0.18,afade=t=out:st=14.45:d=0.45" -ar 48000 -ac 2 $masteredVoice
  if ($LASTEXITCODE -ne 0) { throw "Voice mastering failed for $($campaign.Name)" }

  & $ffmpeg -y -hide_banner -loglevel warning -i $sourceVideo -i $masteredVoice -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -t 15 -movflags +faststart $voicedVideo
  if ($LASTEXITCODE -ne 0) { throw "Voice/video mux failed for $($campaign.Name)" }

  Remove-Item -LiteralPath $rawVoice
  Write-Output "Rendered $voicedVideo with local Kokoro af_bella neural voice"
}
