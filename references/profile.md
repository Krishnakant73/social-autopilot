# Profile and bio audit (100-point rubrics)

Input: pasted profile text + screenshots described by the user. No scraping. Output: score table (item, max, scored, reason), total, then rewrites in DESCENDING points-lost order (biggest loss first; ties: least effort first). Re-score the rewrite honestly ("if 88, say 88"). Say what copy cannot fix (recommendations, history, photo, followers). Typical first pass: 30s-40s. Scores are copy-quality estimates, not performance claims; validate with 30 days of profile views, search appearances, Featured clicks, follows, qualified messages.

Rules for every rewrite:
- No invented titles, clients, numbers, years, awards or follower counts. Missing proof -> `[ADD: one real number]`; gate blocks until filled.
- Embargoed topics in voice.md stay out of profiles and bios too, until the user releases them topic by topic.
- Run copy through `node scripts/cli.mjs audit --platform P --text "..."`. Banned anywhere: passionate, results-driven/-oriented, seasoned, proven track record, guru, ninja, rockstar, visionary, thought leader, go-getter, synergy, "Welcome to my profile", "Let's connect!", "aspiring" (unless true and wanted).
- First person in About. Never open with own name, "I am a...", or third person.

## 1. LinkedIn (100)
| Item | Pts | Full marks when |
|---|---|---|
| Headline: core claim in first 65 chars | 10 | role/outcome + audience visible before the ~65-char search/byline cut (craft UI observation) |
| Headline: proof + direction | 8 | contains a real proof point or concrete scope; <=220 chars (`official` limit); <=2 pipes; not a bare job title; doesn't start "Helping X do Y" |
| Headline: searchable terms | 4 | 2-4 terms recruiters/buyers actually search, no keyword soup (4+ pipes = 0) |
| About: first 2-3 lines | 10 | names the reader's problem or a sharp claim; works alone above "see more" (~265 chars) |
| About: body | 8 | problem -> what user does -> 1-3 numbered/named proofs -> how they work; short paragraphs; 150-300 words (limit 2,600) |
| About: one CTA | 4 | exactly one next step (follow for X / email / Featured link); no "DM me for anything" |
| Featured | 10 | 2-3 items chosen by goal: best post or teardown, one proof asset (demo, case study, repo), one contact/offer; 3-5 word benefit titles |
| Experience | 12 | current role: one scope line + 2-3 outcome bullets (action verb + real metric); no "Responsible for/Worked on/Helped with/Assisted with"; >10-year-old roles one line; coherent career story |
| Banner | 6 | 1584x396; one positioning sentence + one contact/next step; text in middle/right, clear of photo (bottom-left) |
| Photo | 5 | >=400x400, current, face ~60% of circle, plain background |
| Activity | 10 | posted on the core topic in last 30 days (5); substantive comments this week (5) |
| Recommendations | 4 | >=2 specific ones naming a result |
| Skills | 3 | top 3-5 pinned skills match headline terms |
| Custom URL + clean name | 2 | linkedin.com/in/name; no emoji/credentials soup in name field |
| Consistency | 4 | same name spelling, niche wording and link hub as X/IG/YouTube and personal site |
| Total | 100 | |

Headline formulas (pick 3 options, different shapes): `{what you do for whom} | {proof} | {how to start}`; `{Role} building {concrete thing} | {proof}`; audience-first "For {ICP} stuck at {problem}: ..."; credential + direction ("Ex-{real employer} {role}. Now {direction}"). Show char count and mark char 65.
About 5 blocks: Hook (1-3 lines) / who you help + outcome / 2-3 proofs / how you work / one CTA.
Note from the user's prior audit (linkedin-profile-final.md): leading with role clarity, separating shipped from planned capability, and marking products "pre-launch" scored highest on honesty; keep that discipline. That file names embargoed products; do not reuse those lines until released.

## 2. X bio (100)
| Item | Pts | Full marks when |
|---|---|---|
| Bio line 1: who it's for + topic | 25 | reader knows in 1 second what they'll get; <=160 chars total (`official`) |
| Proof | 15 | one real credential, number or shipped thing; none invented |
| Follow reason | 15 | what posts deliver ("threads on RAG failures and evals") |
| Name field | 8 | real name, optional 1-3 word topic; no emoji walls |
| Handle | 5 | matches other platforms or close |
| Photo | 8 | same face as LinkedIn, readable at 48px |
| Header | 6 | 1500x500, one line of positioning or blank; no clutter |
| Pinned post | 10 | best-performing or most representative post/thread, <90 days old or evergreen |
| Link | 5 | one hub (site/newsletter), works logged out |
| Location/consistency | 3 | timezone/location if relevant; wording matches LinkedIn |

## 3. Instagram bio (100)
| Item | Pts | Full marks when |
|---|---|---|
| Name field (searchable) | 15 | name + keyword people search (name field is searchable, craft); <=30 chars |
| Bio line 1: promise | 20 | who it's for + what they get; 150-char limit (`official`) |
| Proof | 10 | real credential/number |
| CTA + link | 15 | one action that names what's behind the link; link works; <=5 links (`official`) |
| Photo | 8 | face or clear mark, readable at small circle |
| Pinned posts (3) | 12 | 3 pins: best reel, a proof/story, a start-here carousel |
| Highlights | 8 | 3-5 named covers (Start here, Proof, FAQ); no stale promos |
| Grid first 9 | 8 | consistent topic legible at a glance; covers set, 3:4 crop safe |
| Category/contact | 4 | correct professional category; contact if seeking work/clients |

## 4. YouTube channel (100)
| Item | Pts | Full marks when |
|---|---|---|
| Channel name + handle | 10 | memorable, matches other platforms |
| Banner | 10 | 2560x1440, text inside 1546x423 safe area; promise + schedule only if real |
| Description first 2 lines | 15 | who it's for + what they learn; keywords natural; rest <=1,000 chars (`official` limit) |
| Channel trailer / featured video | 15 | trailer for non-subscribers <=60-90 s states promise in first 10 s; featured for returning viewers |
| Home sections / playlists | 15 | 3-5 playlists ordered by viewer path (start here, core series, latest) |
| Thumbnails consistency | 10 | recognisable style, readable at ~320px, 3-5 words max |
| Upload consistency | 10 | cadence the user can sustain; last upload <=30 days |
| Links + contact | 5 | 1-2 links to hub/LinkedIn; business email if open to work |
| Avatar | 5 | same face/mark as other platforms, 800x800 |
| Consistency | 5 | niche wording identical to LinkedIn/X |

## 5. Output template
```
PROFILE SCORE: 41/100 (LinkedIn)
| Item | Max | Score | Why |
...
FIX ORDER (points lost):
1. Featured  -10  -> [rewrite / exact items to add]
2. Headline core claim  -8  -> 3 options with char counts, char-65 mark
...
RE-SCORE: 78/100. Cannot fix with copy: recommendations (4), activity history (10).
```
