# social-autopilot

An agent skill for Codex and Claude Code that researches, writes, humanizes, gates, plans and tracks content for LinkedIn, X, Instagram and YouTube in your own voice.

The model writes. A zero-dependency Node engine (`scripts/engine.mjs`) measures: AI-tell audit with a weakest-link panel, hook ranking against 104 formulas, platform limits (X weighted count, see-more fold), evidence gate, reel/Short timing, YouTube title and chapter checks, outlier and audience-pain research, logging and stats. It never posts, comments or messages for you.

## Install

Requires Node 20+.

```bash
# Codex
git clone https://github.com/Krishnakant73/social-autopilot ~/.agents/skills/social-autopilot
# Claude Code
git clone https://github.com/Krishnakant73/social-autopilot ~/.claude/skills/social-autopilot
```

Start a new session and ask, e.g. `write a linkedin post: <what happened, first-hand>`.

## Use

- Full guide with 22 example prompts and every command: [`references/how-to-use.md`](references/how-to-use.md)
- CLI: `node scripts/cli.mjs --help` (17 commands: audit, scrub, check, fold, hooks, classify, gate, repurpose, thread, reel, title, chapters, outliers, pain, log, stats, caps)
- Tests: `node --test tests/*.mjs`

Personal files (voice file, story bank, log) default to the author's folders. Build your own voice file with `interview me to build my voice file`, and set the log path with `--log FILE` or the `SOCIAL_LOG` environment variable.

## Rules it enforces

Drafts only; every external action needs explicit approval. Official APIs only, no website automation or scraping of logged-in sessions. No fabricated numbers, stories or social proof. Algorithm claims are labelled official, craft or folklore.

## License and credits

MIT. Built on ideas, formula banks and rules from MIT-licensed open-source skills; see [CREDITS.md](CREDITS.md).