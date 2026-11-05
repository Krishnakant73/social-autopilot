# Algorithm and performance claims (all platforms)

Labels: `official` = platform docs, first-party statement or open-sourced code (source + date required); `craft` = practitioner consensus, useful default, not proven; `folklore` = unverified or contradicted, never state as fact. Any claim in a draft, receipt or plan cites its row label. Re-verify `official` rows older than 6 months before quoting a number. The user's own `cli.mjs stats` beats every row below.

## X: open-sourced ranking weights (official)
Source: xai-org/x-algorithm `home-mixer/params/param.rs`, local clone `D:\social post\X\research\x-algorithm`, commit 6bb4594 (2026-09-12). Final score = sum(weight x predicted P(action)). The code comment says weights multiply predicted probabilities, not raw counts; "one report cancels 468 likes" is explicitly called incorrect (report base rate is >1000x lower than a like). Read weights as direction, not exchange rates.

| Action | Weight | Action | Weight |
|---|---|---|---|
| Share via copy link | 20.0 | Click | 0.4 |
| Reply between mutual follows (boost) | 15.0 | Open link | 0.2 |
| Reply | 5.0 | Video open | 0.07 |
| Quote | 5.0 | Photo expand | 0.05 |
| Share via DM | 5.0 | Dwell | 0.05 |
| Follow author | 4.0 | Quoted click | 0.05 |
| Share | 2.0 | Post unexplored (in-network) | 0.02 |
| Repost | 1.0 | Continuous dwell time | 0.004 |
| Like (favorite) | 0.5 | Profile click / VQV | 0.0 |
| Report | -234.0 | Mute author | -58.8 |
| Not interested | -43.2 | Block author | -31.2 |
| Not dwelled | -0.02 | | |

Other code facts (same commit, official): For You candidates older than 48 h are filtered (`MAX_POST_AGE = 48*60*60`); author diversity decay 0.5 per extra post from the same author in one feed load, floor 0.25; out-of-network weight factor 0.75 (topic out-of-network 0.5); cold-start boost for authors under 1,000 followers / posts under 1,000 impressions, max post age 86,400 s; out-of-network replies and reposts filtered from For You (`OONRetweetReplyFilter`); near-duplicate suppression vs seed embedding (VMRanker, commit 6bb4594); `local_day_of_week` is a model feature, not a best posting time.
Version drift: Jakeschincariol notes commit a707cc2 (2026-09-29) with Click 0.3, Not interested -47.52, ContClickDwellTime 0.4; liftli (checked 2026-10-13) lists Like 0.6. Values move between commits: quote the commit you checked.

2023 heavy ranker (official, twitter/the-algorithm-ml, 2023-03-31, historical only): like 0.5, repost 1.0, reply 13.5, reply engaged by author 75.0, negative feedback -74.0, report -369.0. Most "replies = 13.5x/27x/75x a like" posts quote this retired model.

## X: other claims
| Claim | Label | Source | Date |
|---|---|---|---|
| 280 weighted chars; emoji/CJK 2, URL 23; Premium long post 25,000 | official | twitter-text v3; X Help | 2026 |
| Non-API automation of x.com forbidden; automated keyword replies forbidden; AI reply bots need prior written approval | official | help.x.com/en/rules-and-policies/x-automation | 2026 |
| Original Content Rewards: 500k verified Home impressions/90 days + 500 verified followers; reply impressions excluded; copied/automated content ineligible | official | help.x.com/en/using-x/original-content-rewards | 2026-09-17 |
| Replies, quotes, DM/copy-link shares and follows outrank likes | official | weights above | 2026-09 |
| Links get no explicit penalty in ranking code (open link +0.2) | official | param.rs | 2026-09 |
| X said it stopped down-ranking link posts | folklore | Musk/Bier posts, no doc | 2026-07 |
| "Links cut reach 50%" | folklore (contradicted by code) | various skills | 2025-26 |
| Link posts still get fewer views in practice | folklore | one independent analysis | 2026-01 |
| Hashtags not needed by the system | folklore | Musk post | 2024-12 |
| 0-1 hashtag, never in line 1 | craft | all X skills read | 2026 |
| "10 replies in 15 min" / "3+ replies in 30 min triggers a second test" | folklore | sergebulaev, others | 2026 |
| "Post dies after N hours" decay curve | folklore (only a 48 h window in code) | liftli myth list | 2026 |
| Ideal thread length N posts (4-8, 5-12, 7) | folklore | multiple skills, no data | 2026 |
| "Hooks under 10 words do 3x" | folklore | liftli myth list | 2026 |
| "One report cancels N likes" | folklore (refuted in code comment) | param.rs | 2026-09 |
| Premium accounts get a reach boost; Premium replies rank higher | folklore | sergebulaev, Jakeschincariol | 2026 |
| Unverified accounts capped 50 posts / 200 replies per day | folklore | Jakeschincariol, unsourced | 2026 |
| Engagement pods do nothing | folklore | Jakeschincariol reading of code | 2026 |
| Editing within 30 min kills reach | folklore | alirezarezvani | 2026 |
| Native video +40%, screenshots +78% reposts, 4-image +25% | folklore | shannhk, unsourced | 2025-26 |
| Early replies from the author in the first hour help | craft | consensus; reply weights support direction | 2026 |
| Tue-Thu 9-11 AM ET best time | folklore | several skills, no data | 2026 |
| Space own posts; don't post minutes apart | official (direction) | author diversity decay 0.5 | 2026-09 |
| X API pay-per-use ~$0.010-0.015 per post create | folklore until checked | rohunvora (2026-02), Jakeschincariol (2026-09) | 2026 |

## LinkedIn
| Claim | Label | Source | Date |
|---|---|---|---|
| Post limit 3,000 chars; comment 1,250; headline 220 | official | LinkedIn limits (liftli table) | 2026 |
| "...see more" fold ~210 chars desktop / ~140 mobile | craft (unpublished, measured) | liftli | 2026 |
| Posting via Posts API with user token (`w_member_social`) | official | LinkedIn Marketing API docs | 2026 |
| "Authenticity update" (Mar 2026) and "AI slop" report button with ~40% view loss on flagged posts (Jul 2026) | folklore (press-relayed, no first-party source in notes) | sergebulaev | 2026 |
| Outbound links in body suppress reach; link in first comment ~2.1x | folklore | vendor blogs (sergebulaev, Jakeschincariol) | 2026 |
| 0-3 niche hashtags ~+5%; 5+ negative | folklore | vendor data | 2026 |
| First 60-90 min decide most reach; 3+ comments in 30 min = second boost | folklore | vendor blogs | 2026 |
| Dwell sweet spot 31-60 s | folklore | vendor | 2026 |
| Odd-precision number in line 1 +34% likes; P.S. +7.5% | folklore | MagicPost vendor study | 2026 |
| AI-written posts underperform (3,368 posts) | folklore | Originality.AI vendor study | 2025 |
| Save = 5x a like; pods detected 97% | folklore | vendor | 2026 |
| Tue-Thu 7:30-9:30 timing | folklore | Jakeschincariol, unsourced | 2026 |
| Hook before the fold, short paragraphs, end on a real question or next step, stay to reply | craft | all LinkedIn skills | 2026 |

## Instagram
| Claim | Label | Source | Date |
|---|---|---|---|
| Reels ranking predicts: watch to end, like, say it was entertaining/funny, go to the audio page | official | about.instagram.com "Shedding more light on how Instagram works" | 2023, cited 2026 |
| Other-platform watermarks, low resolution, borders, text-covered frames, engagement bait, reposts are deprioritised for recommendation (still shown to followers) | official | Instagram recommendation guidelines (via ManyChat) | 2026 |
| Hashtags capped at 5 per post | official | Instagram @Creators announcement | 2025-12-18 |
| Hashtags are a label, not a reach lever | official | Adam Mosseri | 2025-02 |
| Trial Reels show to non-followers first | official | Instagram feature | 2025-26 |
| Sends per reach is the strongest signal; a DM share ~3-5x a like | folklore | folk reading of Mosseri, no source | 2026 |
| Mosseri suggested 2-3 reels/week | folklore (attributed, no link) | ManyChat | 2026 |
| Majority-original content in a rolling 30 days required | folklore until sourced | vyralcontent | 2026 |
| Hook in the first 3 s; write for mute; captions as search surface | craft | consensus | 2026 |
| 15-35 s reach sweet spot; > 3 min not recommended to non-followers | folklore / craft | reels-script skills | 2026 |

## YouTube
| Claim | Label | Source | Date |
|---|---|---|---|
| Tags are a weak signal, for misspellings/disambiguation | official | YouTube Help (via Jakeschincariol) | 2026 |
| More than 15 hashtags: all ignored; first 3 shown above the title | official | YouTube hashtag policy | 2026 |
| Shorts up to 3 min | official | YouTube | 2024-10 |
| Shorts view = any playback incl. loops; use Engaged Views | official | YouTube | 2025-03 |
| "Inauthentic content" policy targets mass-produced/templated videos | official | YouTube Partner Program policy | 2025-07 |
| Title/thumbnail A/B test: up to 3 variants, judged on watch-time share | official | YouTube Studio | 2024-25 |
| YPP: 1K subs + 4K hours or 10M Shorts views/90 days (expanded tier 500 subs) | official | YouTube Help | 2025-26 |
| Retention and satisfied sessions highest; CTR in context | craft (from Creator Insider statements, synthesised) | sergebulaev | 2026 |
| Shorts length peaks at 13 s and 60 s; avoid 30-45 s | folklore | single study | 2025 |
| Numbers in titles +20-30% CTR; niche CTR table | folklore | single agency (Focus Digital) | 2025-12 |
| Freshness decay after ~28-30 days | folklore | agricidaniel | 2025-09 |
| Tue-Thu 14:00-16:00 publish slot | folklore | unsourced | 2026 |