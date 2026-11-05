# Voice and material

Two files, both read before every draft:
- `D:\social post\_shared\voice.md`: how the user sounds, what they believe, what they never say, embargoes.
- `D:\social post\_shared\story-bank.md`: what the user can truthfully write about (receipts, stories, positions).

If a file is missing or its header lacks `filled: yes`, build it before drafting anything that claims experience. Keep both files out of any public repo.

## AI/human boundary

The skill supplies: structure, formulas, evidence lookup, counter-arguments, analogy candidates, edits.
The user supplies: first-hand experience, the core angle, real numbers, real emotion, names they may use.
Never invent a story, number, client, quote or metric. A missing fact becomes `[ADD: ...]` or `[CONFIRM: ...]`; the gate blocks both.

## Building voice.md

1. Samples: 3-5 of the user's own published posts (best, typical, recent). Not ghostwritten, not edited by AI. Under 3 samples, mark every inferred rule `provisional`.
2. Ask the gaps one question at a time (see interviewer): audience, 3 positions peers may disagree with, publishable proof, words or styles never used, off-limits topics.
3. Measure per sample and record counts, not adjectives: average sentence length, opener type, em dashes, emoji, hashtags, questions, line breaks per 100 words, closer type. Write absences as counts ("em dashes in 0 of 5 samples, provisional").
4. Keep explicit bans (user said so) separate from observed absences (never seen). Bans are hard; absences are defaults.
5. Sections in voice.md: Audience, Positions held, Proof bank, How it sounds (with counts), Never, Embargo, Locked, Platforms, Timezone. Keep under ~500 words.
6. Preserve quirks (lowercase starts, one em dash, "I think"). Uniform clean prose is itself a fingerprint.

## Locked decisions

`## Locked` table in voice.md: `key | value | scope | date`. Lock a preference when the user states it as a rule ("no emojis", "LinkedIn under 1,300 chars").
- Correct the rule, not the instance: if the user fixes the same class of issue twice, propose a lock.
- If a request contradicts a lock, stop and ask for `unlock <key>`. One-off asks are not locks; ask when unsure.

## Story bank (`D:\social post\_shared\story-bank.md`)

Header: `filled: yes|partial`, `updated: YYYY-MM-DD`. Sections:

| Section | Each entry holds |
|---|---|
| Timeline | year, role, place, what changed |
| Receipts | number, what it measures, when, whose, where it is visible |
| Shipped | project, date, link, user's role |
| Turning points | before belief, after belief, trigger |
| Scars | mistake, cost, what changed after |
| Positions | claim, who disagrees, cost of holding it |
| Recurring stories | stories the user already tells in person |
| Names you can use | person/company, free / ask first / never |
| Off limits | topics and details never used, permanent |

Record the user's words verbatim. Embargoed items from voice.md go to Off limits too. Planned angles cite a section ("Scars #2").

## Interviewer (one question at a time)

Modes: `bank` fills the story bank; `post` builds a five-line spine for one post (5-8 questions).
Rules:
- One question per message. Wait for the answer.
- Open wide, then narrow: "What happened this month at work that surprised you?"
- Press each soft answer exactly once, then accept it: "Put a number on that, even rough, and say it is rough." / "Before and after?" / "Which month?" / "How many people, how long?" / "What did it cost?" / "How would you prove that to someone who doubted you?" / "Can I name them?"
- Chase the reversal: "What did you believe a year ago that you no longer believe?"
- Find the position: "Who would disagree, and what does holding this view cost you?"
- "I'd rather not say" -> Off limits, permanently. Never ask again.
- Never suggest an answer, never fill a silence with an example the user then adopts.

## Five-line spine (post mode)

| Line | Question it answers | Maps to |
|---|---|---|
| Moment | What happened, when, where? | Opening |
| Number | What is the real figure with its referent? | Proof |
| Correction | What did you get wrong or change your mind about? | Turn |
| Opposition | Who disagrees and why are they partly right? | Audience/tension |
| Ask | What specific question do you want readers to answer? | Close |

An empty line stays empty: drop that part of the post or mark `[ADD: ...]`. Never fill it with a plausible invention.

## Humanizing without over-correcting

Add only what the user supplied: an odd-precision number with its referent, one named entity, one first-person concrete detail, one flat dated fact, one self-correction stated plainly. Ask for them; never invent.
Then the over-correction guard, three questions after every edit pass:
1. Did the edit add staccato fragments, reveal bridges ("The result?"), or a framed confession ("Let me be honest")?
2. Did it add hedges the user never uses?
3. Did it flatten the voice: remove their quirks, triads, lowercase, "I think", or tone?
If yes, roll back that edit. A clean draft gets 2-3 touches, not a rewrite. Check with `node scripts/cli.mjs audit --compare before.txt after.txt`; voice score must not drop.
Prefer one precise scoped claim over a broad hedged one.