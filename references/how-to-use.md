# social-autopilot v2: how to use it

Skill only (no UI or web app). A skill for LinkedIn, X, Instagram and YouTube. The AI writes in your voice; a zero-dependency Node engine scores every draft and blocks weak ones. It never posts, comments or messages for you. Needs Node 20+.

## Install

| Tool | Folder | How it loads |
|---|---|---|
| Codex | `%USERPROFILE%\.agents\skills\social-autopilot\` | Automatic. New session, then ask for a post |
| Claude Code | `%USERPROFILE%\.claude\skills\social-autopilot\` | Automatic. Start `claude`, run `/skills` to see it, or ask for a post |

Both copies are identical. Edit one, then copy it over the other:

```powershell
Copy-Item "$env:USERPROFILE\.agents\skills\social-autopilot\*" "$env:USERPROFILE\.claude\skills\social-autopilot" -Recurse -Force
```

On another computer: copy the `social-autopilot` folder into the same place (`~/.agents/skills/` for Codex, `~/.claude/skills/` for Claude Code). In a single project only: put it in `<project>\.claude\skills\` (Claude Code) or `<project>\.agents\skills\` (Codex).

## Your files

| Path | What |
|---|---|
| `SKILL.md` | Router + core loop + hard rules |
| `platforms\` | linkedin.md, x.md, instagram.md, youtube.md |
| `references\` | engagement, profile, research, voice, planning, video-reels, x-articles, algorithm-claims, safety, this guide |
| `data\` | Hook banks (LI-01..29, X-01..28, SF-01..26, YT-01..21), slop.json, platforms.json (limits + daily caps) |
| `scripts\cli.mjs` | 17 commands |
| `D:\social post\_shared\voice.md` | Your voice file and embargo list |
| `D:\social post\_shared\log.csv` | Posts + metrics (override with `--log` or the `SOCIAL_LOG` env var) |
| `D:\social post\_research\notes\` | Notes from the 27 repos and 62 websites the skill was built from |
## Ask in Codex or Claude Code

| Use case | Example prompt |
|---|---|
| LinkedIn post | `write a linkedin post: we froze 300 eval questions, 41 answers were wrong but fluent, now we block releases under 92% grounded accuracy. first-hand.` |
| LinkedIn carousel | `turn this post into a 10-slide linkedin carousel: <paste>` |
| X post / thread | `write an X post and a 5-part thread from this: <paste>` |
| X Article | `turn my RAG eval notes into an X Article: <paste>` |
| Instagram reel | `write a 25s instagram reel script about why fluent AI answers aren't evidence, with on-screen text and caption` |
| YouTube | `10 youtube titles, a thumbnail brief and the first 30 seconds for a video on RAG evals` |
| YouTube analytics | `diagnose my youtube export: <paste CSV>` |
| Reel production | `plan and storyboard a 20s reel for this post, then build it with motion-reel-kit` |
| Comments | `draft 2 comments of different types for this linkedin post: <paste>` |
| Replies | `triage and draft replies to these comments on my post: <paste>` |
| DM / invite | `connection note for <name, role>, reason: their post on eval drift` |
| Profile audit | `score my linkedin profile out of 100 and rewrite: <paste>` |
| Outlier research | `find outliers in D:\social post\research\swipe.csv` |
| Trend research | `research what changed in AI evals this week with primary sources, then 3 post ideas` |
| Audience pain | `rank the pain themes in these comments: <paste CSV>` |
| Competitor research | `competitor research on <creator or tool>: what works, what I must not copy` |
| De-slop | `audit this for AI tells and fix it: <paste>` |
| Repurpose | `repurpose my 2026-09-15 linkedin post for X, Instagram and YouTube Shorts` |
| Voice / story bank | `interview me to build my story bank` |
| Weekly plan | `plan my week: 3 linkedin, 3 X, 1 reel` |
| Tracking | `log this as posted: <url>, 2100 impressions, 64 likes, 11 comments, 2300 followers` |
| Review | `show my stats and what to change` |

Every writing answer ends with a receipt and asks you to approve:

```
RECEIPT linkedin | hook LI-02 Number Reveal | 1,178 chars | human 100 (weakest specificity) | hook 98 | evidence firsthand | slot Tue 09:00 IST (folklore) | link: first comment
```

## The commands

```powershell
$cli = "$env:USERPROFILE\.agents\skills\social-autopilot\scripts\cli.mjs"   # or ...\.claude\skills\... for Claude Code
node $cli <command> --help        # details for any command
```

| Command | What it does | Example |
|---|---|---|
| `audit` | AI tells + 5-check panel (burstiness, specificity, slop, fingerprint, voice) | `node $cli audit --platform linkedin --file draft.txt` |
| `audit --compare` | Before/after delta | `node $cli audit --compare v1.txt v2.txt` |
| `scrub` | Safe fixes: invisible chars, leakage, em-dash cap | `node $cli scrub --file draft.txt` |
| `check` | Platform rules; X weighted count (link 23, emoji 2) | `node $cli check --platform x --file post.txt` |
| `fold` | What shows before "see more" | `node $cli fold --platform linkedin --file draft.txt` |
| `hooks` | Rank hooks, name formula, trap and fix | `node $cli hooks --platform linkedin --file hooks.txt` |
| `classify` | Which formula a hook uses | `node $cli classify --platform x --text "I tested 3 RAG stacks for 30 days."` |
| `gate` | Go/no-go, exit 2 = blocked | `node $cli gate --platform linkedin --file draft.txt --evidence firsthand` |
| `gate --source` | External claims need URLs | `node $cli gate --platform x --file d.txt --source https://site/report` |
| `gate --notes` | Every number must be in your notes | `node $cli gate --platform x --file d.txt --notes notes.txt` |
| `repurpose` | Fit on all 4 platforms | `node $cli repurpose --file post.txt --evidence firsthand` |
| `thread` | Split for X with lint | `node $cli thread --file long.txt` |
| `reel` | Time a reel/Short script (hook <= 3 s, beats <= 4 s, CTA last) | `node $cli reel --platform instagram --file reel.txt --target 20` |
| `title` | YouTube title + thumbnail lint | `node $cli title --title "I graded 300 AI answers" --thumb "41 WRONG"` |
| `chapters` | Validate chapters | `node $cli chapters --file chapters.txt` |
| `outliers` | Views vs each account's median | `node $cli outliers --file swipe.csv` |
| `pain` | Audience complaint/request themes | `node $cli pain --file comments.csv` |
| `log` | Record a post | `node $cli log --platform linkedin --file post.txt --status posted --url URL --impressions 2100 --likes 64 --comments 11 --followers 2300` |
| `stats` | ER and reach by formula/format/length | `node $cli stats` |
| `caps` | Today's actions vs daily caps | `node $cli caps` |

File formats:
- reel script: one beat per line starting `HOOK:`, `BEAT:` or `CTA:`
- chapters: `0:00 Intro` per line
- outliers CSV: `account,url,views[,format,text,followers]` (each account's last 10-15 posts, dull ones too)
- pain CSV: `source,url,text`

## What the scores mean

- **Human score** (pass 80): penalties for AI-word clusters per paragraph, reveal bridges ("here's the thing"), "it's not X, it's Y", bait, cliché openers, triads, staccato, emoji stacks, em dashes. Model leakage, `[placeholders]`, `[ADD: ...]` and `[CONFIRM: ...]` block.
- **Panel** (weakest-link: 60% mean + 40% lowest): blocks only on slop or fingerprint; burstiness, specificity and voice warn. Your published posts warn on specificity: add a real number or name when you have one.
- **Hook score**: weakest-link across fold, specificity, brevity, tension, voice, clean; under 45 blocks.
- **Evidence**: numbers need `--evidence firsthand`, a `--source`, or `--notes`.
- **Daily caps** (`data/platforms.json`): LinkedIn 2 posts, 30 comments, 10 invites, 5 new DMs; X 5 posts, 40 replies; Instagram 1 post, 20 comments; YouTube 1 upload, 10 comments, 2 community posts.
- **Algorithm claims** are labelled official / craft / folklore in `references/algorithm-claims.md`.

## Weekly routine

1. Monday: `stats`, then outlier research on 6-10 accounts; pick 3 formulas you haven't used in 7 days.
2. Give Codex 3 real things from your week; get 3 LinkedIn posts through the gate.
3. Repurpose each to X and one reel/Short; each version re-gated.
4. Post by hand; `log --status posted --url ...`.
5. After 48 h log metrics; Friday `stats` and keep what beat your median. Under ~30 posts, treat patterns as hunches.

## Maintain it

```powershell
cd "$env:USERPROFILE\.agents\skills\social-autopilot"
node --test tests/*.mjs           # 39 tests; on Windows don't use "tests/" (Node treats it as a module name)
Copy-Item * "$env:USERPROFILE\.claude\skills\social-autopilot" -Recurse -Force   # sync to Claude Code
```

Edit voice in `D:\social post\_shared\voice.md`, rules in `platforms\*.md`, hooks in `data\hooks-*.json` (run tests after).