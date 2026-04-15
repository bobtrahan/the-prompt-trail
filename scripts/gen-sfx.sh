#!/bin/bash
# Generate all 16 SFX procedurally via ffmpeg
set -e
OUT="$(dirname "$0")/../game/public/assets/audio/sfx"
mkdir -p "$OUT"

echo "Generating SFX..."

# 1. key-correct — sharp mechanical click
ffmpeg -y -f lavfi -i "sine=frequency=4000:duration=0.02" \
  -af "volume=0.7,afade=t=out:st=0.01:d=0.01" \
  -ar 44100 "$OUT/key-correct.mp3" 2>/dev/null
echo "✅ key-correct"

# 2. key-wrong — muffled low thud
ffmpeg -y -f lavfi -i "sine=frequency=200:duration=0.06" \
  -af "volume=0.5,lowpass=f=400,afade=t=out:st=0.02:d=0.04" \
  -ar 44100 "$OUT/key-wrong.mp3" 2>/dev/null
echo "✅ key-wrong"

# 3. ui-click — soft digital tap
ffmpeg -y -f lavfi -i "sine=frequency=2500:duration=0.03" \
  -af "volume=0.4,afade=t=out:st=0.01:d=0.02" \
  -ar 44100 "$OUT/ui-click.mp3" 2>/dev/null
echo "✅ ui-click"

# 4. choice-select — crisp confirm blip (two quick tones)
ffmpeg -y -f lavfi -i "sine=frequency=1200:duration=0.04" \
  -f lavfi -i "sine=frequency=1800:duration=0.04" \
  -filter_complex "[0]afade=t=out:st=0.02:d=0.02[a];[1]adelay=50|50,afade=t=out:st=0.02:d=0.02[b];[a][b]amix=inputs=2:duration=longest,volume=0.6" \
  -ar 44100 "$OUT/choice-select.mp3" 2>/dev/null
echo "✅ choice-select"

# 5. notification — two-tone chime (macOS-ish)
ffmpeg -y -f lavfi -i "sine=frequency=880:duration=0.15" \
  -f lavfi -i "sine=frequency=1320:duration=0.15" \
  -filter_complex "[0]afade=t=in:d=0.01,afade=t=out:st=0.08:d=0.07[a];[1]adelay=150|150,afade=t=in:d=0.01,afade=t=out:st=0.08:d=0.07[b];[a][b]amix=inputs=2:duration=longest,volume=0.6" \
  -ar 44100 "$OUT/notification.mp3" 2>/dev/null
echo "✅ notification"

# 6. error — low buzz + warning tone
ffmpeg -y -f lavfi -i "sine=frequency=220:duration=0.4" \
  -f lavfi -i "sine=frequency=440:duration=0.2" \
  -filter_complex "[0]volume=0.3[a];[1]adelay=100|100,afade=t=out:st=0.1:d=0.1,volume=0.5[b];[a][b]amix=inputs=2:duration=longest,afade=t=out:st=0.25:d=0.15" \
  -ar 44100 "$OUT/error.mp3" 2>/dev/null
echo "✅ error"

# 7. critical — rapid three-tone alarm
ffmpeg -y -f lavfi -i "sine=frequency=880:duration=0.12" \
  -f lavfi -i "sine=frequency=880:duration=0.12" \
  -f lavfi -i "sine=frequency=1100:duration=0.15" \
  -filter_complex "[0]afade=t=out:st=0.08:d=0.04[a];[1]adelay=160|160,afade=t=out:st=0.08:d=0.04[b];[2]adelay=320|320,afade=t=out:st=0.1:d=0.05[c];[a][b][c]amix=inputs=3:duration=longest,volume=0.7" \
  -ar 44100 "$OUT/critical.mp3" 2>/dev/null
echo "✅ critical"

# 8. score-tick — tiny pip
ffmpeg -y -f lavfi -i "sine=frequency=3000:duration=0.025" \
  -af "volume=0.35,afade=t=out:st=0.01:d=0.015" \
  -ar 44100 "$OUT/score-tick.mp3" 2>/dev/null
echo "✅ score-tick"

# 9. rep-gain — rising two-note chime
ffmpeg -y -f lavfi -i "sine=frequency=660:duration=0.1" \
  -f lavfi -i "sine=frequency=990:duration=0.12" \
  -filter_complex "[0]afade=t=in:d=0.01,afade=t=out:st=0.06:d=0.04[a];[1]adelay=100|100,afade=t=in:d=0.01,afade=t=out:st=0.07:d=0.05[b];[a][b]amix=inputs=2:duration=longest,volume=0.6" \
  -ar 44100 "$OUT/rep-gain.mp3" 2>/dev/null
echo "✅ rep-gain"

# 10. rep-loss — descending two-note
ffmpeg -y -f lavfi -i "sine=frequency=660:duration=0.1" \
  -f lavfi -i "sine=frequency=440:duration=0.12" \
  -filter_complex "[0]afade=t=in:d=0.01,afade=t=out:st=0.06:d=0.04[a];[1]adelay=100|100,afade=t=in:d=0.01,afade=t=out:st=0.07:d=0.05[b];[a][b]amix=inputs=2:duration=longest,volume=0.6" \
  -ar 44100 "$OUT/rep-loss.mp3" 2>/dev/null
echo "✅ rep-loss"

# 11. purchase — cha-ching (bright triple tap)
ffmpeg -y -f lavfi -i "sine=frequency=1500:duration=0.06" \
  -f lavfi -i "sine=frequency=2000:duration=0.06" \
  -f lavfi -i "sine=frequency=2500:duration=0.1" \
  -filter_complex "[0]afade=t=out:st=0.03:d=0.03[a];[1]adelay=80|80,afade=t=out:st=0.03:d=0.03[b];[2]adelay=160|160,afade=t=out:st=0.05:d=0.05[c];[a][b][c]amix=inputs=3:duration=longest,volume=0.6" \
  -ar 44100 "$OUT/purchase.mp3" 2>/dev/null
echo "✅ purchase"

# 12. boot — startup chime (chord swell: C-E-G-C)
ffmpeg -y -f lavfi -i "sine=frequency=523:duration=0.8" \
  -f lavfi -i "sine=frequency=659:duration=0.7" \
  -f lavfi -i "sine=frequency=784:duration=0.6" \
  -f lavfi -i "sine=frequency=1047:duration=0.5" \
  -filter_complex "\
[0]afade=t=in:d=0.05,afade=t=out:st=0.5:d=0.3,volume=0.4[a];\
[1]adelay=100|100,afade=t=in:d=0.05,afade=t=out:st=0.45:d=0.25,volume=0.35[b];\
[2]adelay=200|200,afade=t=in:d=0.05,afade=t=out:st=0.35:d=0.25,volume=0.3[c];\
[3]adelay=300|300,afade=t=in:d=0.05,afade=t=out:st=0.3:d=0.2,volume=0.25[d];\
[a][b][c][d]amix=inputs=4:duration=longest,volume=0.7" \
  -ar 44100 "$OUT/boot.mp3" 2>/dev/null
echo "✅ boot"

# 13. day-complete — rising arpeggio fanfare
ffmpeg -y -f lavfi -i "sine=frequency=523:duration=0.15" \
  -f lavfi -i "sine=frequency=659:duration=0.15" \
  -f lavfi -i "sine=frequency=784:duration=0.15" \
  -f lavfi -i "sine=frequency=1047:duration=0.3" \
  -f lavfi -i "sine=frequency=1318:duration=0.5" \
  -filter_complex "\
[0]afade=t=out:st=0.1:d=0.05,volume=0.4[a];\
[1]adelay=180|180,afade=t=out:st=0.1:d=0.05,volume=0.4[b];\
[2]adelay=360|360,afade=t=out:st=0.1:d=0.05,volume=0.4[c];\
[3]adelay=540|540,afade=t=out:st=0.2:d=0.1,volume=0.45[d];\
[4]adelay=750|750,afade=t=in:d=0.02,afade=t=out:st=0.3:d=0.2,volume=0.5[e];\
[a][b][c][d][e]amix=inputs=5:duration=longest,volume=0.7" \
  -ar 44100 "$OUT/day-complete.mp3" 2>/dev/null
echo "✅ day-complete"

# 14. bug-squash — crunchy zap + pop
ffmpeg -y -f lavfi -i "anoisesrc=d=0.05:c=pink:a=0.3" \
  -f lavfi -i "sine=frequency=150:duration=0.08" \
  -filter_complex "[0]highpass=f=2000,afade=t=out:st=0.02:d=0.03[a];[1]adelay=30|30,afade=t=out:st=0.03:d=0.05,volume=0.6[b];[a][b]amix=inputs=2:duration=longest,volume=0.8" \
  -ar 44100 "$OUT/bug-squash.mp3" 2>/dev/null
echo "✅ bug-squash"

# 15. bug-miss — hollow whiff
ffmpeg -y -f lavfi -i "sine=frequency=800:duration=0.1" \
  -af "volume=0.3,lowpass=f=1200,afade=t=in:d=0.01,afade=t=out:st=0.04:d=0.06" \
  -ar 44100 "$OUT/bug-miss.mp3" 2>/dev/null
echo "✅ bug-miss"

# 16. hw-damage — electric crackle + descending buzz
ffmpeg -y -f lavfi -i "anoisesrc=d=0.15:c=white:a=0.4" \
  -f lavfi -i "sine=frequency=600:duration=0.4" \
  -filter_complex "\
[0]highpass=f=3000,afade=t=out:st=0.05:d=0.1[a];\
[1]afreqshift=shift=-400:level=0.5,afade=t=in:d=0.05,afade=t=out:st=0.2:d=0.2,volume=0.5[b];\
[a][b]amix=inputs=2:duration=longest,volume=0.7" \
  -ar 44100 "$OUT/hw-damage.mp3" 2>/dev/null
echo "✅ hw-damage"

echo ""
echo "🎉 All 16 SFX generated in $OUT"
ls -la "$OUT"
