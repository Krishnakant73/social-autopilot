# LinkedIn

Read with: references/voice.md, references/engagement.md, references/profile.md, data/hooks-linkedin.json, data/platforms.json (limits, video specs, caps). Evidence labels: `official` (platform docs, source+date), `craft` (practitioner consensus), `folklore` (unverified). Never present folklore as fact in drafts or receipts.

## 1. Post shape (text post)
1. Line 1: the hook, alone, inside the mobile fold. One idea. No question unless only the user could ask it. Numbers over adjectives.
2. Line 2: pays off line 1. Never setup ("Here's what happened", "Let me explain").
3. Body: paragraphs of 1-3 lines, blank line between. Every abstract line gets a specific (number, name, date, tool, quote) within 2 lines.
4. One turn line: where the most specific detail or the correction lives.
5. Close: ONE specific question OR ONE instruction. Never both. Never "Thoughts?", "Agree?", "Who else?".
6. Hashtags: 0-3, bottom, real and niche. Links: none in body; put in first comment and say so in the receipt (link penalty is `folklore`; keeping links out is a cheap hedge).
7. Own product or embargoed topic: never (voice.md embargo). Max 1 emoji, never as line-1 decoration.

Density caps (craft): 1 contrast ("not X, it's Y") per post, 1 triad and only of numbers or named acts, 0 reveal bridges ("The result?", "Plot twist:"), 0 questions before the close, fragments (<4 words) max 2.

Test before showing: "If the hook works with any other person's name on it, it is not the user's hook." Rewrite or ask for the specific.

## 2. Length ranges (craft)
| Type | Chars | Use |
|---|---|---|
| Short | 300-600 | one observation, one rule, callout |
| Working range | 900-1,300 | default for proof/teach/opinion |
| Long | 1,500-1,900 | story with scene + cost, teardown |
| Hard limit | 3,000 | `official` composer/API limit |
Under 400 reads as a thought. Over 2,000 every line must earn its place. Run `node scripts/cli.mjs check --platform linkedin --file draft.txt`.

## 3. Fold rules
- Cut points (craft, UI observation, varies by device): ~140 chars mobile, ~210 desktop. Line breaks count and burn fold space.
- Hook must survive the MOBILE cut as a complete idea. A mid-idea cut with no open loop is fatal; a mid-word cut is ugly.
- No blank line or one-word line before the cut ("line-break burn").
- Check: `node scripts/cli.mjs fold --platform linkedin --file draft.txt` (reports clean / mid-word / mid-idea). Fix until mobile = clean.

## 4. Hooks
Formula bank lives in data/hooks-linkedin.json (id, template, example, best_for, goal, trap). Do not copy it here. Use it like this:
1. Pick the post goal first: saves, shares, comments, follows, clicks.
2. Draft 3 hooks from 3 DIFFERENT formula ids whose `goal` matches. Never 3 variants of one formula.
3. Rank: write them one per line to hooks.txt, run `node scripts/cli.mjs hooks --platform linkedin --file hooks.txt`. It returns formula id + trap per hook. Read the trap; if the draft falls into it, fix or drop.
4. Ship the strongest. Receipt names the id and one sentence on why.
5. Check an existing hook or someone else's post: `node scripts/cli.mjs classify --platform linkedin --text "..."`.
6. Rotation: no formula id twice in 7 days; Pattern Interrupt / Permission Slip style formulas max once a month (read `log` via `stats`).

Goal hints (craft, not data): comments = contrarian, question trap with a real fork, myth bust; saves = list promise (N<=10), direct value, time anchor; shares = comparison, good vs great, permission slip; follows = insider/credentialed takes (years must be real); clicks = receipt + first-comment link.
Vendor stats ("number-first +34%", "question-first -34%") are `folklore` (vendor, not LinkedIn): tie-breakers only.

## 5. Formats
### Text
Default. Shape above.

### Document carousel (PDF)
Use only when the idea has sequence (steps, countdown, progression, framework, comparison grid). One claim split across slides = failure, write a text post.
- 8-12 slides (craft). <4 real beats = text post; >7 beats = two carousels or cut.
- Slide 1 cover: hook <=6 words + one promise line (<=12 words total). Curiosity gap, not a title ("How we cut onboarding from 14 days to 3" beats "Onboarding Tips").
- Slide 2: the stake, one sentence.
- Slides 3..N: one idea per slide, headline 3-7 words, <=25 words under it. Reading slide headlines top to bottom must flow as an argument.
- Slide N+1: recap list (the screenshot slide, must stand alone).
- Last slide: one action (save for X / follow for Y / first-comment link). No fake deliverable.
- Every slide: number "3/10", handle small in a bottom corner, one accent colour, body type >=28px at 1080 wide.
- File: 1080x1350 (4:5) PDF, `official` limits <=100 MB, <=300 pages; document title required by API. Build from HTML (one `<section>` per slide, 1080x1350, `page-break-after: always`) only after copy is approved.
- Post text above it: 2-4 lines restating the hook + why to swipe. Runs through the same gate.
- Inspect render at full size and ~360px width; otherwise state "render pending".
- Format multipliers ("carousel 1.7-2.3x") are `folklore`.

### Image
- One idea, one image: diagram, real screenshot, annotated trace, photo of real work. The image is a second hook.
- Sizes (craft/UI): 1080x1350 (4:5) default, 1080x1080 or 1200x627 also fine; off-ratio gets centre-cropped. Up to 9-10 images per post (multi-image `official` via API MultiImage).
- Text on image <=40 words, readable at 360px. No stock photos, no AI faces of real people, no fabricated screenshots or dashboards.

### Video (native)
- Use for demos, walkthroughs, face-to-camera explanations. Captions burned in or uploaded (most watch muted, craft).
- First 3 s show the payoff or the problem; no intro, no logo sting.
- 30-90 s for feed (craft); longer only for teaching with chapters in the post text. Vertical 4:5 or 9:16, or 16:9 for screen recordings. Specs/limits in data/platforms.json (`linkedin.video`).
- Time scripts with `node scripts/cli.mjs reel --platform linkedin --file script.txt --target 60`. Never invent view counts or results on screen.

### Poll
- Question <=140 chars, 2-4 options <=30 chars, durations 1 day / 3 days / 1 week / 2 weeks (`official` composer + Posts API poll content).
- Options parallel, mutually exclusive, concrete ("Before 9am" not "Early"); 4th slot = honest edge case ("I don't track this").
- Intro text states the user's own position lightly. Kill: Yes/No/Maybe, lead-gen questions, "only 1% get this right".
- Follow up with a results post that adds the user's interpretation; poll counts are real data, quote them exactly.

### Newsletter / article
- Use for 1,200+ word arguments, teardowns, case studies. Headline <=100 chars, body ~110,000 (craft, third-party table; verify in editor).
- Archetypes (craft): data tutorial 1,500-2,500 words; contrarian essay 1,200-2,000 with a steel-man section; teardown 1,500-2,500; personal essay 800-1,800. Open with the number or the scene, never "In this article".
- Every article gets a 2-4 line feed post that stands alone (not "new article out!"). Same gate.
- Cannot be created through the member Posts API (see 9). User publishes in the editor.

## 6. Repurpose rules
Long asset (video, podcast, newsletter, transcript, devlog, meeting notes) -> week of posts:
1. Read the whole asset. Extract, don't summarise, six pulls with counts: Claims, Numbers, Stories, Mechanisms, Mistakes, Lines. Under 4 items total = thin, say so and stop.
2. Every number carried over must exist in the source: `node scripts/cli.mjs gate --platform linkedin --file post.txt --notes source.txt`.
3. Each post stands alone. Never "as I said in my latest video".
4. Vary formula ids across the batch. Order: strongest claim first, story midweek, mechanism last.
5. Draft one at a time on request; four at once converge on one voice.
6. Meeting notes / client calls: anonymise ("a 40-person agency"); if the other party could guess, blur again; NDA material needs their OK.
7. Devlog: find the one tension (3 attempts at one bug, a revert, a cut feature, a number that changed). Never a changelog dump.
8. Cross-post fit: `node scripts/cli.mjs repurpose --file post.txt`. LinkedIn -> X: strip broetry, "I'm humbled", hashtag clusters, backstory; `node scripts/cli.mjs thread --file post.txt` for threads.
9. Repeat a winning ANGLE after ~3 weeks with new evidence. Never repost the same words.

## 7. Weekly content mix
Default 3-4 posts/week; 4 good beats 7 average (craft). Max 1 post/day; skill cap 2/day (data/platforms.json caps).
| Type | Frequency | Rule |
|---|---|---|
| Proof | 1/week | something that happened, with a real number |
| Opinion | 1/week | a position part of the audience disagrees with; before gate, write the most uncharitable reading and scope the claim (or teams under 10) rather than delete it |
| Teach | 1/week | steps, checklist, framework; carousel candidate |
| Story | 1/fortnight | scene, dialogue, a cost |
| Offer | 1/fortnight | only after voice.md releases the product; until then replace with Teach |
Rules: never two same types back to back; no theme repeated within 14 days; no pillar >60% of a month; each slot = theme + this week's specific angle + formula id. Engagement days and the 20-minute pre-post routine: references/engagement.md.
Current phase (voice.md): reach first, embargoed projects excluded.

## 8. Timing
- There is no universal best time (craft; studies disagree). Hook and specificity matter far more.
- Default start (folklore): Tue-Thu 7:30-10:00 audience-local; tier 2 Mon afternoon, Fri morning; weekends personal story or nothing. User is Asia/Kolkata; for India audience use IST, for US audience 18:00-20:30 IST.
- Find the user's window (craft): rotate 2-3 slots for 4-6 weeks, log first-hour impressions, compare within one format, read after 12-15 posts. `node scripts/cli.mjs stats --platform linkedin` warns on small samples; under ~500 impressions a post is noise.
- First 60-90 min: user stays to reply (craft; "golden hour decides 80% of reach" is folklore). Edits: fix typos freely; avoid large rewrites in the first hours (folklore that it resets distribution, cheap to respect).
- What LinkedIn does say (`official`, LinkedIn Engineering blog, feed ranking posts 2021-2025): feed is personalised and ranked by models on member interaction history and content quality/relevance. Exact weights, "first 50 words", copy-paste detection and automation scores are NOT documented (user's audit, D:\social post\linkedin\linkedin-algorithm-video-audit-2026-10-03.md).

## 9. Official Posts API (what it can and cannot do)
Source: Microsoft Learn, LinkedIn Marketing "Posts API" / "Images API" / "Videos API" / "Documents API" (`official`; re-verify the `LinkedIn-Version` each year, versions sunset after ~1 year).
Can (member token, scope `w_member_social`, author `urn:li:person:{id}` from OpenID `sub`):
- `POST https://api.linkedin.com/rest/posts` with headers `LinkedIn-Version: YYYYMM`, `X-Restli-Protocol-Version: 2.0.0`; body `commentary`, `visibility: PUBLIC`, `distribution.feedDistribution: MAIN_FEED`, `lifecycleState: PUBLISHED`.
- Text, single image, multi-image, video, document (PDF/PPT/DOC), article/link share (URL card), poll. Media is uploaded first via Images/Videos/Documents `initializeUpload`, then referenced by URN.
- Read and delete own posts (`DELETE /rest/posts/{urn}`); response header `x-restli-id` gives the post URN; URL = `https://www.linkedin.com/feed/update/{urn}/`.
Cannot / do not use:
- No native scheduling field: scheduling = local queue (`D:\social post\linkedin\linkedin_scheduler.py`) that calls the API at the approved time.
- No native article or newsletter creation for members; no editing of the LinkedIn editor; mentions need the target URN.
- Comments, reactions, invites, DMs on others' content: hand-posted by the user (partner-only or not in scope). Never automate the website.
- Analytics for member posts are limited; use the user's Analytics -> Content export CSV for `stats`.
Error handling: 401 = token expired, stop and ask; 429 or limit errors = stop for the day, no retry loop; 5xx = retry once later; never claim "posted" without the returned URN.
Publish flow: gate pass (`node scripts/cli.mjs gate --platform linkedin --file post.txt --evidence firsthand`) -> show exact final text -> user approves that exact text -> API call or user pastes -> `node scripts/cli.mjs log --platform linkedin --file post.txt` with URL.

## 10. Receipt (print under every draft)
`formula: LI-xx Name | chars: N/3000 | fold: clean @ N | hashtags: N | link: first comment / none | gate: PASS/BLOCKED (reason) | weakest check: X | evidence: firsthand/external | slot: Day HH:MM IST (folklore default / measured)`