# X

Read with `references/algorithm-claims.md` (every ranking claim, labelled) and `references/x-articles.md` (long-form). Hook bank: `data/hooks-x.json`; refer to hooks by id + name, never paste the bank here. The user posts every item; nothing below authorises an external action.

## 1. Pick the container first (say it in one line)
| Material | Container |
|---|---|
| One claim, number or moment | single post |
| One argument that needs 400-2,000 words of flow, user has Premium | long post (<= 25,000 weighted) |
| Separate steps, evidence or a story with a turn | thread |
| Someone else's post deserves your angle in front of your followers | quote |
| You can add to a live conversation | reply |
| Reference piece, 1,500+ words, headers, images | X Article (`references/x-articles.md`) |
Three ideas = three posts. If posts 2..n of a thread do not escalate, ship post 1 alone.

## 2. Counting (always the engine, never `len()`)
`node scripts/cli.mjs check --platform x --file draft.txt` uses X weighted counting: Latin/Cyrillic/most punctuation 1, emoji and CJK 2 each (ZWJ sequences, flags, skin tones count once as 2), any URL 23, NFC normalised. Limits: post 280, long post 25,000 (Premium), bio 160, display name 50. Mentions past weighted char 280 of a long post do not notify. Fold preview: `cli.mjs fold --platform x`.

## 3. Single post
- Line 1 complete alone, <= ~110 weighted chars, concrete noun or number in the first 8 words, no link, hashtag or @ in line 1.
- Line 2 = payoff or proof, not setup. Every later line earns its place.
- End on the last true sentence OR one specific question, never both. No "Thoughts?", "Agree?", "RT if", "follow for more".
- 0 hashtags by default (max 1, at the end). 0-1 emoji. No em dash, no `--`.
- Missing number: write `[ADD: number]`; the gate blocks until it is real.
- Recasing test: if it would pass as a LinkedIn post after capitalising, it is not an X post yet. Amputation test: line 1 alone must pull.
- Link: default in a reply under the post, only when a click is the goal and the user approves the self-reply. Settle link-in-body vs reply with the user's own data (n >= 5 each, `cli.mjs stats`).

## 4. Hooks (by id, from data/hooks-x.json)
1. Write 5 hooks from 5 different formulas chosen by goal. 2. `cli.mjs hooks --platform x --file hooks.txt` ranks and names each formula + trap. 3. Check the three gates by hand: clear with zero context; real stakes (cost, surprise, disagreement); open loop someone can answer. 4. Ship the top one, say why in one sentence. `cli.mjs classify --platform x --text "..."` names the formula of any single hook.

Goal -> formula ids (ids as defined in data/hooks-x.json; if an id differs, use the `name`):
| Goal | Formulas |
|---|---|
| replies | X-01 Contrarian Take, X-20 Open Question, X-17 Regret, X-11 Prediction |
| reposts / sends | X-07 The Hottest New, X-10 Someone Else's Result, X-21 One-Liner, X-18 Comparison |
| bookmarks | X-05 The List, X-09 Time Anchor, X-16 Thread Promise, X-12 Command |
| trust | X-03 Cost Confession, X-02 Number Reveal, X-04 Before/After, X-13 Statistic |
| follows | X-08 Credential Setup, X-14 Coinage, X-19 Field Report |
| news | X-15 Launch |
Rules: no formula more than 2x per week; any hook that would work with someone else's name on it is not the user's hook; X-08, X-10, X-13 need a real, checkable source (`gate --source URL`). Banned openers: "A thread 🧵", "Hot take:", "Unpopular opinion:", "Nobody is talking about", "Stop scrolling", greetings, "In this thread".

## 5. Thread
- Structure: 1 hook (stands alone, specific payoff promise) / 2 stake or context (second most read) / 3..N one idea each, point then one line of proof (number, screenshot, snippet) / N+1 recap that works as a screenshot / last: one real ask or a flat closing line.
- Shapes: story (hook, scene, turn, outcome, lesson), teardown (claim, evidence in steps, payoff), list (promise, one item per post, the claim they add up to).
- Length is earned, not targeted (no source supports an ideal count; see algorithm-claims). Under 3 posts = single post; over 12 = consider an Article.
- Each post <= ~260 weighted to leave edit room. Numbering `1/` optional, costs ~5-7 chars. Cut connector posts ("But that's not all"). Links only in the last post or a reply.
- Split: write beats separated by `---`, then `cli.mjs thread --file draft.txt` (splits on `---`, then paragraphs, then sentences; word splits are flagged). Re-run `check --platform x` on the result. Media: name which file attaches to which post (max 4 images per post).
- After posting: user stays the first hour to answer replies. A week later, quote post 1 with a second angle instead of reposting.

## 6. Quote
Quote when your angle deserves its own reach and followers need the context; reply when you are answering the author. Never quote to dunk on a smaller account. Shape: one line that reframes or narrows the original, then the missing case, number or counter-example. Never "This." or "So true". A days-old thread is better served by a quote or a fresh post than a reply.

## 7. Reply strategy (drafts only; the user posts each one)
- Who: 10 accounts on an engage list: 5 reach (2-10x the user's size, notifications on), 3 peers (mutual follows; code shows a 15.0 boost on replies between mutual follows, see algorithm-claims), 2 buyers (reply for weeks before any DM, never pitch in a reply). Mix sizes; never the same 3 people every day.
- When: posts minutes to a few hours old, normally < 24 h. Early beats clever. Read the post and >= 5 visible replies first so the reply does not repeat one.
- Form: 5-25 words, max 2 sentences, user's casing, same language. One angle only this user could add. Types: add a datum, add the missing case, respectful fork, extend one line, real question, the receipt (what happened, 2 sentences), kind correction, reframe, one-liner (< 12 words).
- Banned: "Great post", "Love this", "So true", "Spot on", "Couldn't agree more", "This 👆", "💯", restating the post, hashtags, links, "check out my post", invented experience.
- Output: 2 drafts of different types + which to post + the detail only the user can add. Run `cli.mjs audit --platform x --text "..."`. Volume: 5-30 substantive replies/day is the craft range; no quota. Never keyword-triggered or automated: X rules forbid automated keyword replies and AI reply bots need X's prior written approval.
- Own replies (comments under the user's post): answer leads, then substance, peers, questions, support; ignore noise and bait. Answer in public, not "DM me". Concede the true part of a critique once, hold the line once. Hide > mute > block.

## 8. Long post (Premium)
One argument, sections as short paragraphs, bold sparingly. The first ~280 weighted chars show before "Show more": they must work as a standalone post (check with `cli.mjs fold --platform x`). Dwell is a ranked signal only if the read is earned: cut any paragraph that does not move the argument. The X composer cannot schedule long posts.

## 9. X Articles
Use for reference pieces with headers and images. Full workflow in `references/x-articles.md`: Markdown draft -> gate -> handoff package -> user pastes into the Articles editor. No browser automation.

## 10. Repurpose from LinkedIn
Only after the LinkedIn post is approved. `cli.mjs repurpose --file post.txt`, then rewrite natively:
- Extract claims, numbers, stories, mechanisms, mistakes, quotable lines. Fewer than 4 items = thin; say so.
- Cut ~40% and rewrite the hook (do not trim LinkedIn line 1). One-line dramatic paragraphs -> normal sentences. "I'm humbled to share" -> start at the claim. Backstory -> fold into the claim. Lesson paragraph -> flat closing line. "Agree?" -> arguable claim or real question. Hashtag block -> none. "Link in comments" -> link in reply only if click is the goal.
- Map: claim -> single post (X-01/X-21); number -> X-13/X-09; story -> X-03 or story thread; mechanism -> thread; mistake -> X-17; line -> near verbatim.
- Strip artefacts: "as I wrote on LinkedIn", "link in bio", foreign @handles, "see more".
- Deliver 3 versions (single <= 280, short thread, long post if Premium) with counts; say which ships first. Re-run `audit`, `check`, `gate` on X.

## 11. Gate and receipt
`node scripts/cli.mjs gate --platform x --file draft.txt --evidence firsthand` (or `--evidence external --source URL`, repeat per claim; `--notes FILE` so every number must exist in the notes). Exit 2 = blocked. Receipt: container, hook id + name, weighted chars per post, human verdict, hook score, evidence basis, target URL (replies/quotes), media + rights basis, link placement, suggested slot labelled hypothesis.
Pre-publish questions the engine cannot answer: does a reader have a reason to reply; would someone paste it to a friend (copy-link share weight 20.0); does a stranger learn what the user is about (follow 4.0); anything that earns a mute or "not interested" (misleading hook, rage bait, repeated promo); is this minutes after another own post (author diversity decay); write the most uncharitable reading before shipping a take.

## 12. Cadence (craft defaults until the user's data says otherwise)
- Week: 5-7 single posts, 1-2 threads or long posts (often a rebuilt LinkedIn post), 1-2 quotes, 0-1 poll (only if answers become the next post), 1 image/video post. Replies daily.
- Goal mix per week: >= 2 bookmark-goal, >= 1 reply-goal, >= 1 repost-goal. No pillar > 60%. Promotion max 1-2/week.
- Spacing: >= 2 h between own posts (author diversity decay 0.5 per extra post in one feed load, official code). Engine cap: 8 posts/day.
- Timing: hypothesis only. Default weekday morning/lunch in the audience's timezone (IST for the user unless the audience differs); the first line matters more than the hour. The user must be available the hour after posting. Learn from `cli.mjs stats` (first-hour impressions over 4-6 weeks); posts > 48 h old leave For You candidates (official code).
- Log: `cli.mjs log --platform x --file post.txt --status approved`, then `--status posted --url U`, then metrics at 1 h, 24 h, 7 d.

## 13. X API v2 with the user's OAuth 2.0 user token (official only, after approval of the exact action)
Scopes: `tweet.read users.read tweet.write media.write offline.access` (add `bookmark.read` only if asked).
| Can do | Endpoint |
|---|---|
| Publish post | `POST /2/tweets` `{text}` |
| Thread | `POST /2/tweets` per post with `reply.in_reply_to_tweet_id` = previous id; stop on first error, report posted ids |
| Quote / reply | `quote_tweet_id` / `reply.in_reply_to_tweet_id` (reply to others only when the user approves that exact reply) |
| Media | `POST /2/media/upload` then `media.media_ids` (max 4 images) |
| Poll | `poll.options` (2-4), `poll.duration_minutes` |
| Delete own post | `DELETE /2/tweets/:id` |
| Own metrics | `GET /2/users/:id/tweets?tweet.fields=public_metrics,non_public_metrics,organic_metrics` (non-public/organic: own posts, user context, last 30 days) |
| Who am I | `GET /2/users/me` |
| Research (read-only) | `GET /2/tweets/search/recent` (7 days, 100/request, 512-char query); show estimated cost first, 1 page default |
Cannot or will not: schedule (no scheduling endpoint; user schedules in the composer or approves a send time), create Articles (no endpoint; paste manually), like/follow/DM/repost on the user's behalf without approval of each action, anything on x.com outside the API. Pay-per-use pricing changes; quote the current price from docs.x.com before spending (notes list $0.010-0.015 per create, Feb-Sep 2026, unverified). On 429: read `x-rate-limit-reset`, stop, never loop. Keep tokens in env vars, never in logs or drafts.

## 14. Profile check (once)
Bio <= 160: who you help + what changes + one checkable proof; no "visionary", "thought leader", hashtags. Name = real name + optional topic word. Pinned = best proof, still true, < ~30 days old or a "start here". Photo face fills the circle, readable at 40 px. Header 1500x500, one positioning line, nothing bottom-left under the avatar. Last 10 posts on the bio topic. Two-second test: would a stranger follow from name + bio + pin alone?