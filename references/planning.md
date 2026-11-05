# Planning and learning

## 1. Brief (before any draft)

Rewrite the request into one brief and show it as a single line before drafting:
```
Brief: deliverable | audience | size | constraints | done-when
e.g. LinkedIn text post | AI engineers adopting RAG | 900-1,300 chars | no links, 0-2 hashtags, firsthand only | gate passes + user approves exact text
```
- Deliverable: platform + format (text post, thread, carousel, reel script, Short, long-form title set).
- Audience: one group from voice.md, not "everyone".
- Size: chars, posts, slides or seconds. Never "short".
- Constraints: evidence type (firsthand/external), locked decisions from voice.md, embargoes, deadline.
- Done-when: the check that ends the task (gate exit 0, fold clean, reel within target, user approval).
Missing slots: ask in one message, numbered, each with a default ("Size? default 900-1,300 chars"). Silence = defaults.
Locked decisions in voice.md override the request; a contradiction stops the work until the user says `unlock <key>`.
On revision: change only the part the user named, keep the rest verbatim. "Not quite" gets one question: what missed, what to keep.

## 2. Weekly plan

One table per platform, built Sunday or on request. Every angle cites a story-bank section or a research file; no citation, no slot.

```
Day | Platform | Pillar | Format | Formula id | Angle (source) | CTA type | Goal
Tue | linkedin | AI reliability | text | LI-07 | Scars #2 | specific question | comments
```

Defaults (craft, adjust to the user's capacity and log data):
- LinkedIn: 3 posts/week, Tue-Fri; one day comments only. X: 1-2 posts/day plus replies. Instagram: 2-3 reels or carousels/week. YouTube: 1 Short or long-form per week, only if the user can record.
- Pillars from voice.md positions, 3-5 pillars, no pillar over 60% of the week.
- No formula id repeated within 7 days on one platform.
- Goal tags (from the hooks files `goal` field): saves, shares, comments, follows, clicks, watch. Each week covers at least 3 different goals; at least one saves or shares post.
- Content mix per platform per week: at least one firsthand story or result, one teaching/reference post, one opinion with a stated opposition. Timely posts only from a research file under 7 days old.
- Optional idea grid: pillars x formats (actionable, analytical, contrarian, observation, X vs Y, present vs future, listicle). Name the single strongest cell.
- Posting times: hypotheses until the user's own log shows a difference (see below). Default to weekday mornings in the user's timezone (Asia/Kolkata), labelled `folklore`.
The plan schedules drafting, not publishing. Each post still needs gate + approval of the exact text.

## 3. Learning loop

Log every published post (the user gives the URL and numbers at 24h and 168h):
```
node scripts/cli.mjs log --platform linkedin --file post.txt --url URL
node scripts/cli.mjs stats --json
```
`stats` reports engagement rate, reach multiple vs the user's median, and splits by formula, format and length with sample-size warnings.

Sample-size honesty:
- n < 5 in a group: anecdote. Report it, change nothing.
- n 5-9: weak signal. May pick the next experiment.
- n >= 10 per arm, consistent at 24h and 168h: adopt as a default, note date and n in voice.md.
- Compare like with like (same platform, format, similar week). One viral post is an outlier, not a rule.
- Rank by qualified outcomes first (meaningful comments, saves/sends, follows, profile visits, conversations), impressions last.

Experiments: change one variable at a time (hook formula, format, length, proof type, CTA, time). Write the hypothesis, control, variant and success metric before posting. Adopt, reject or retest once per week. Repeat the winning problem/proof/audience pattern, never the wording.
Claims from creators, courses or PDFs enter as hypotheses (`folklore` or `craft`) until the user's own data or official docs support them.

## 4. Blind draft comparison (user rejects a draft)

1. Ask what missed and what to keep, in the user's words. Save the rejected draft as `before.txt` verbatim.
2. Write 2-3 genuinely different alternatives (different formula or structure, not synonyms). Same brief, same facts; no new claims.
3. Run the gate on each; any blocked draft is out (fatal: invented fact, embargo, platform limit, open `[ADD:]`).
4. Score blind as A/B/C including the rejected draft, labels shuffled. Criteria 0-10, weighted: claims backed 30, brief met 25, specificity 15, survives critique 20, clarity 10. A 7 is not a default; length and confident wording earn nothing.
5. Check deltas: `node scripts/cli.mjs audit --compare before.txt after.txt`.
6. Report the ranking honestly, even if the rejected draft wins, then let the user pick. The user's choice is final.