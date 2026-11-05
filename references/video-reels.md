# AI reels production (IG Reels, YT Shorts, LinkedIn video)

Use for any short video the skill helps make: talking-head, faceless explainer, kinetic type, product promo. Platform rules (eligibility, CTA, caption, hashtags) live in platforms/instagram.md, platforms/youtube.md, platforms/linkedin.md. This file covers making the video.

Hard rules for video:
- Never fabricate view counts, follower counts, likes, comments, testimonials, client logos, "as seen in" bars or analytics screenshots. Social-proof overlays (follow buttons with counts, post cards with metrics, view-count grids, counter walls) use only numbers the user supplies with a source, or they are cut.
- No cloned voice or likeness of anyone but the user, and the user's only with their consent. AI-generated footage or voice gets the platform's AI label where required (Meta "AI info", YouTube altered/synthetic disclosure).
- Model a winner's structure and technique, never its words, voice or footage.
- Rendering, paid generation (TTS, music, images) and any upload are user-gated. Say the cost before asking.

## 1. Intake (one round, max 3-4 questions)
Collect, recommended option first with a reason: platform(s) and aspect, target length, one message, audience, approved facts (numbers, names, dates, prices, links), production limits (phone only, faceless, screen recordings, existing footage), voice (user's own / Fish Audio / none), CTA. Show stated vs inferred as two groups. An inferred field is not an answer; "sounds good" to a plan is not approval of a render.

## 2. Story spine
Write one line: "This video tells [audience] that [message]." Then:
- Hook speaks outcome language. No file names, feature lists or section headings in the hook.
- Value claim lands by beat 2.
- Self-check: delete the evidence beats and the value must still stand; delete the value beats and if the video still works, it was a feature tour.
- Numbers only where they carry stakes ("cut review from 3 days to 1"), never inventory ("23 files changed").
- Shapes (pick one): Hook-Proof-CTA (15 s); Hook-2/3 beats-CTA (30 s); HRST Hook, Relatable, Show, Takeaway (30-45 s story); Claim-Status quo-Pivot-Mechanism-Payoff (60 s); PAS pain-agitate-solve (promo); Before-After-Bridge (transformation).
- Hook formulas: data/hooks-shortform.json by id and name. Rank with `node scripts/cli.mjs hooks --platform instagram --file hooks.txt` (or `--platform youtube` for Shorts).

## 3. Pitch round (unformed requests only, one round)
First ask what the user already pictures. If nothing, generate 5 concepts, one per path: the subject's world, the target emotion as a frame (urgency = compression, longing = empty space, awe = one element too large), the audience, the anti-pattern inverted (what every other video on this topic looks like, then the opposite), an unusual format (letter, countdown, recipe, front page, map). At least 2 of the 5 must be unlikely choices. Two concepts with the same layout silhouette count as one. Each pitch: 3 lines (concept, visual world, opening hook). Show all 5, then recommend one.

## 4. Storyboard (a proposal, approved before any build)
Open with the spine line, then:

| # | Time | Spoken (exact) | On screen (exact) | Visual / motion | Audio | Why (traces to message) |
|---|---|---|---|---|---|---|
| 1 | 0:00-0:02 | ... | <= 6 words | motion in frame 1 | ... | hook |

- A Why that cannot trace to the message is cut.
- New visual every 2-4 s; nothing static over 4 s outside the end card; end card <= 2 s and never frozen.
- On-screen words equal the VO word for word or are a deliberately shorter caption, never a paraphrase. Gag captions are never read aloud.
- Group shots by setup for filming (one pass per location/angle). Give a B-roll fallback per scene.
- Unknown facts: `[ADD: ...]` / `[CONFIRM: ...]`. The gate blocks them.
- Stop and get an explicit OK on the table before VO, generation or render.

## 5. Script timing
- Speaking rate 130-165 wpm (2.2-2.75 words/s). Plan at 150 wpm: 15 s = ~37 words, 30 s = ~75, 45 s = ~110, 60 s = ~150. The script should feel shorter than the video.
- Hook: first sentence <= 3 s spoken (about 8 words). Beats <= 4 s each.
- Numbers written as spoken in VO ("ten times", "nearly two million", "A P I"), exact figure on screen.
- `(beat)` marks a spoken pause. One `[ON SCREEN: ...]` per beat.
- Check: `node scripts/cli.mjs reel --platform instagram|youtube --file script.txt --target SECONDS`. It flags hook > 3 s, beats over 4 s, gaps, missing loop word, CTA not last, length off target by more than 10%. Fix every flag.
- LinkedIn video uses the same command with `--platform linkedin` if the engine supports it; otherwise time with `--platform instagram` and apply the LinkedIn specs below.

## 6. Captions (burned in, most first views are muted: craft)
- Group size: high energy 2-3 words, conversational 3-5, calm 4-6. Word cap by density: > 3.5 words/s -> 2, > 2.5 -> 3, else 4.
- Break a group at sentence end, at a pause >= 150 ms (silence gap > 0.18 s in word timestamps), or at the cap. Tail pad 0.12 s.
- One group visible at a time. Never over the face. Emphasise numbers, names, the CTA keyword; one accent colour.
- Size: >= 56 px at 1080 wide for social captions; anything must-read >= 28 px; legible at 360 px wide.
- From a real transcript only (word timestamps from the user's recording or media-use transcription). Transcript QA: > 20% music-note or nonsense tokens = failed, rerun with a larger model. Whisper `.en` models translate non-English audio silently; use a multilingual model for Hindi or mixed speech.
- Drop filler tokens (um, uh, ah) shorter than 0.1 s.

## 7. Safe zones and specs
Safe zones are conventions measured from app UI, not platform specs; verify on a phone before posting.

| Platform | Canvas | Keep key content out of | Notes |
|---|---|---|---|
| IG Reels | 1080x1920 9:16 | top 14% (270 px), bottom 20% (385 px), right 12% (130 px) | grid crop 3:4 centre 1080x1440, feed crop 4:5; cover word inside both |
| YT Shorts | 1080x1920 9:16 | top 14%, bottom 20%, right 12% (same as Reels: no measured Shorts-specific figure) | first frame doubles as thumbnail |
| LinkedIn vertical | 1080x1920 9:16 | bottom 20%, top 10% | feed often crops to 4:5 preview |
| LinkedIn / IG feed | 1080x1350 4:5 or 1080x1080 | outer 120 px | captions bottom 16.67% band, content ends 20 px above it |
| YouTube long-form | 1920x1080 16:9 | bottom 15% for captions/progress | thumbnail 1280x720 |

Export (craft): H.264 yuv420p, bt709, 30 fps (60 for motion graphics finals), 1080p minimum, 15-20 Mbps VBR, AAC 48 kHz 192-320 kbps, `+faststart`. Platform limits (verify quarterly): Reels via API 3 s-15 min, <= 300 MB (Meta API docs as summarised in research); Reels over 3 min not recommended to non-followers (folklore); Shorts up to 3 min (official, Oct 2024); LinkedIn video limits: see platforms/linkedin.md.

Loudness (convention): integrated -14 LUFS, true peak <= -1 dBTP (two-pass loudnorm I=-14 TP=-1.5 LRA=11). Music bed about -18 dB under VO, duck to ~0.15 on speech; SFX about -9 dB, max 2 sounds at once. Measure from the rendered file, not the project.

## 8. Tools already installed (use these, do not reinvent)
- Motion Reel Kit, `D:\social post\linkedin\motion-reel-kit` (skill `/motion-reel` in `.claude/skills/motion-reel/`). Product launch and promo reels in code, 16:9/1:1/4:5/9:16. Start from `presets/blank/` or `presets/lukas-yt/`, fill `templates/brief.md`, follow its 10 steps: scaffold (`scripts/init.sh videos/<slug>`), capture brand (`capture.mjs <url>` on the user's own product site only, never LinkedIn/Instagram), style guide, beat grid (`music.py`, `beats.py`, `sync.mjs`), shotlist then STOP for OK, VO, build, critique loop (`render.mjs --sheet`, `review.py`), finals (`mix.py` to -14 LUFS). Its RULES.md and CRITIQUE.md are the house style; obey them inside that kit. Windows: run the .sh scripts via WSL or Git Bash.
- HyperFrames skills, the `hyperframes*` skills (if installed), `motion-graphics`, `product-launch-video`. Entry point `hyperframes/SKILL.md`; it routes to faceless explainer, talking-head recut, embedded captions, motion graphics, slideshow. Use for faceless explainers and captioned talking-head recuts. Ask before `npx hyperframes skills update`. Never publish to hyperframes.dev without approval. Set `HYPERFRAMES_NO_TELEMETRY=1` (and `DO_NOT_TRACK=1`).
- media-use, the `media-use` skill (if installed). One verb `resolve --type bgm|sfx|image|icon|logo|voice|grade|lut`, plus transcription, captions, cut and reframe. Prefer bundled/local assets; paid providers (HeyGen and others) only after the user picks them. Logos come from the official source, never redrawn.
- Fish Audio MCP: voiceover only, only after the user approves the exact script and cost. Price is 1 credit per UTF-8 byte including tags: get a free quote with `text_to_speech` `dry_run: true`, show bytes, credits and balance (`get_credit_balance`) in the shotlist message, then generate. Use the user's own cloned voice or a stock voice; never clone anyone else. Prefer the user's own recorded voice when it exists.
- Talking-head effects (Vibha-Ramprakash claude-video-effects, if the user installs it): render only the 1.5-4 s effect clips, max 2x zoom, overlays behind the subject or above the head, never over the face. Its view-count and follower effects follow the no-fabrication rule above.

Tool selection: product/brand promo -> motion-reel-kit; faceless explainer or captions on the user's footage -> hyperframes + media-use; the user filming on a phone -> script + storyboard + shot list only, the user edits in CapCut/Edits (export without watermark).

## 9. Render review (gate: every score >= 8)
Before rendering the whole video, render stills at the midpoint of every beat and at each cut (-0.1 s / +0.2 s) and inspect them at full size and at 360 px wide with the safe-zone overlay. Then render, then score. Each criterion 1-10, 8 = shippable:

| Criterion | Automatic cap |
|---|---|
| Hook (reads in 2 s, frame 0 not empty) | empty frame 0 -> max 6 |
| Readability at 360 px | CTA illegible -> 6; key text in UI zone -> 7 |
| Truth (every number, name, logo is supplied and sourced) | any invented metric or proof -> 0, block |
| Motion | fade used as a transition -> 6; visible pop -> 7 |
| Pacing | gap > 4 s or static > 2 s outside end card -> 7 |
| Captions and VO match | paraphrased caption or caption over face -> 6 |
| Sound | hits off > 80 ms or loudness off > 0.5 LU -> 6 |
| Composition | a 9:16 third empty > 1 s -> 7; blank or double-exposed frame -> 7 |
| Loop and end | jump at loop seam or end card static > 1.5 s -> 7 |

Rules: no 8 without evidence (a still, a measured number); an unfixed problem cannot score higher than last round; fix the 3 worst per round; ship = all >= 8 after at least 2 rounds (3 inside motion-reel-kit). Use a fresh critic sub-agent when available. Report the score table, actual duration, loudness, known imperfections. The score is editorial judgement, not a performance prediction; never promise views.

## 10. Visual slop (question every one)
- Centred title on a gradient; gradient text; purple-blue or cyan-on-dark neon; pure #000/#fff; glow on UI; left accent stripes; identical card grids; everything centred.
- Everything fading in; crossfades between every shot; bouncy/elastic easing as the default; spins, glitches, light leaks, particle bursts; lazy breathing loops; screensaver float.
- Equaliser bars, spectrum analysers, waveforms, strobing, rainbow cycling.
- Pie charts, multi-axis charts, 6-panel dashboards, gridlines and legends.
- Default fonts (Inter, Roboto, Poppins, Montserrat, Playfair) unless they are the brand's. One display face + one UI face, one accent colour.
- Stock "person typing on laptop" B-roll, AI hands and garbled AI text in frame, fake UI that looks like Instagram/X/iMessage presented as real.
- Slideshow failure (everything appears by 25% of the scene then freezes).
Motion that works (craft): reveals timed to the VO in the back half of a scene; enter 0.3-0.5 s, exit ~0.25 s; one primary transition for 60-70% of cuts; hard cuts on beats; held shots micro-push 1.00 -> 1.05; ease-out cubic, vary eases.

## 11. Hand-off
Deliver: file paths per aspect, duration, loudness, score table, contact sheet, caption text, cover/thumbnail frame, AI-disclosure note if any generated media is used. Then run the platform text checks (`check`, `gate`) on the caption. The user uploads.