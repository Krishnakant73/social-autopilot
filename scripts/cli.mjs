#!/usr/bin/env node
// social-autopilot CLI v2. Usage: node scripts/cli.mjs <command> [--platform linkedin|x|instagram|youtube] [--file F | --text T] [--json]
// Every command: --help. Output is a short text report; add --json for the full structured result.
import { readFileSync, appendFileSync, existsSync, writeFileSync } from "node:fs";
import * as E from "./engine.mjs";

// Log location: --log FILE, else $SOCIAL_LOG, else the author's shared folder if it exists, else ./social-log.csv
const DEFAULT_LOG = process.env.SOCIAL_LOG || (existsSync("D:\\social post\\_shared") ? "D:\\social post\\_shared\\log.csv" : "social-log.csv");
const BOOL = new Set(["premium", "json", "help", "h", "no-number"]);
const argv = process.argv.slice(2); const cmd = argv[0] && !argv[0].startsWith("--") ? argv[0] : (argv.includes("--help") ? "help" : argv[0]);
const opt = { sources: [], _: [] };
for (let i = cmd === argv[0] ? 1 : 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) { opt._.push(a); continue; }
  const k = a.slice(2);
  if (BOOL.has(k)) { opt[k] = true; continue; }
  const v = argv[i + 1]; if (v === undefined || v.startsWith("--")) { opt[k] = true; continue; }
  if (k === "source") opt.sources.push(v); else opt[k] = v; i++;
}
const platform = opt.platform || "linkedin";
const readText = () => opt.file ? readFileSync(opt.file, "utf8") : typeof opt.text === "string" ? opt.text : (process.stdin.isTTY ? "" : readFileSync(0, "utf8"));
const json = (o) => console.log(JSON.stringify(o, null, 2));
const say = (...l) => console.log(l.join("\n"));
const fmtIssues = (issues) => issues.length ? issues.map((i) => "  [" + i.severity + "] " + i.rule + ": " + i.detail).join("\n") : "  none";
const readLog = (f) => existsSync(f) ? E.parseCSV(readFileSync(f, "utf8")) : [];
const needPlatform = (allowed) => { if (!allowed.includes(platform)) { console.error("--platform must be one of: " + allowed.join(", ")); process.exit(1); } };

const HELP = {
  audit: "audit [--platform P] (--file F | --text T) [--json]\n  Human audit: penalty rules + 5-check panel (burstiness, specificity, slop, fingerprint, voice), weakest-link verdict\n  (mean*0.6 + min*0.4; PASS >= 70 and min >= 55), rewrite suggestions. Burstiness is n/a under ~40 words.\naudit --compare before.txt after.txt [--platform P]\n  Delta between two drafts: score, panel, per-check change, rules fixed/introduced, voiceDropped.",
  scrub: "scrub (--file F | --text T)\n  Safe mechanical fixes only: invisible/format/tag chars (emoji ZWJ kept), hard spaces, curly quotes, ellipsis,\n  en dashes, em dashes over the cap (1 per 100 words) -> comma, forensic leakage. URLs untouched. Prints the text.",
  check: "check --platform P (--file F | --text T) [--premium] [--json]\n  Platform rules: length (X uses weighted count: URL=23, emoji/CJK=2), hashtags, links, fold, wall-of-text;\n  X line-1/mention/em-dash lints; Instagram first line, filler tags, one ask, emoji density.",
  fold: "fold --platform P (--file F | --text T) [--json]\n  Fold preview at the platform's cut points (LinkedIn 140 mobile / 210 desktop, X 280 weighted, Instagram 125,\n  YouTube 150). Status per cut: clean / mid-word / mid-idea.",
  hooks: "hooks --platform P (--file hooks.txt | --text T) [--json]\n  Rank hooks (one per line): weakest-link score, verdict, weakest property + fix, dealbreakers, formula id + trap.\n  Instagram/YouTube Shorts use data/hooks-shortform.json; --platform youtube --bank youtube for long-form openers.",
  classify: "classify --platform P (--file F | --text T) [--bank linkedin|x|shortform|youtube] [--json]\n  Name the formula of one hook or post (first two lines), with trap, goal, confidence and alternatives.",
  gate: "gate --platform P (--file F | --text T) [--evidence firsthand|external] [--source URL ...] [--notes FILE] [--premium] [--json]\n  Full go/no-go. Exit 0 = pass, 2 = blocked. Blocks: forensic/placeholder, platform hard limits, human score < 80,\n  panel FLAGGED on slop/fingerprint, hook < 45, numeric claims without --source or --evidence firsthand,\n  any [CONFIRM: ...]/[ADD: ...] marker, and with --notes: any number in the draft that is not in the notes file.",
  repurpose: "repurpose (--file F | --text T) [--evidence firsthand] [--source URL] [--json]\n  Fit of one post on every platform (X gets a thread split). Then rewrite natively per platform.",
  thread: "thread (--file F | --text T) [--limit 280] [--no-number] [--json]\n  Split to an X thread: '---' lines, then paragraphs, then sentences; numbered 'n/N'; weighted counts; lints.",
  reel: "reel --platform instagram|youtube|linkedin|x (--file F | --text T) [--target SECONDS] [--wps 2.5] [--json]\n  Time a reel/short/video script (one line = one beat; (beat) = 0.5 s pause; [ON SCREEN: ...] not spoken).\n  Flags: hook > 3 s, beat > 4 s, abstract runs, no loop word, CTA not last, off target by > 10%.",
  title: "title --title \"...\" [--thumb \"...\"] [--json]\n  YouTube title + thumbnail lint: 100 hard, ~60 desktop, ~40 mobile (shows the visible head), caps, vague words,\n  number, front-load, thumbnail <= 3 words and no shared words with the title; formula + pairing.",
  chapters: "chapters (--file F | --text T) [--duration SECONDS] [--json]\n  Validate a chapter list: first 0:00, >= 3 chapters, each >= 10 s, ascending.",
  outliers: "outliers --file posts.csv [--threshold 3] [--min-posts 5] [--platform P] [--json]\n  CSV account,url,views[,format,text,followers]. Multiple vs each account's own median; thin accounts listed;\n  text classified to a formula; reach = views/followers when given.",
  pain: "pain --file comments.csv [--months 18] [--json]\n  CSV source,url,text[,date,rating,likes] of audience comments the user collected by hand.\n  Ranked complaint/request themes with verbatim linked quotes, thin flags, sample-size warnings.",
  log: "log --platform P (--file F | --text T) [--status approved|posted] [--url U] [--action post|comment|reply|dm|connect|follow]\n    [--formula LI-07] [--format text|carousel|video|thread] [--impressions N --likes N --comments N --saves N --shares N]\n    [--followers N] [--log FILE]\n  Append a row to log.csv (date in Asia/Kolkata). Formula is classified automatically unless --formula is given.",
  stats: "stats [--platform P] [--log FILE] [--json]\n  Engagement rate, median reach multiple (impressions/followers), by platform/formula/format/length,\n  top 5 vs bottom 5 once there are 10+ rows, sample-size warnings. Only status=posted, action=post rows.",
  caps: "caps [--log FILE] [--date YYYY-MM-DD] [--json]\n  Today's (Asia/Kolkata) used/cap per platform and action from log.csv. status=posted counts; action column\n  defaults to post. Caps come from data/platforms.json (null = no numeric cap).",
};
const usage = () => say("social-autopilot CLI v2", "commands: " + Object.keys(HELP).join(" | "), "node scripts/cli.mjs <command> --help for details", "common flags: --platform linkedin|x|instagram|youtube --file F --text T --json");

if (!cmd || cmd === "help" || cmd === "--help") { if (opt._[0] && HELP[opt._[0]]) say(HELP[opt._[0]]); else usage(); process.exit(0); }
if (!HELP[cmd]) { console.error("unknown command: " + cmd); usage(); process.exit(1); }
if (opt.help || opt.h) { say(HELP[cmd]); process.exit(0); }
if (["check", "fold", "audit", "gate", "hooks", "classify", "log", "stats", "outliers"].includes(cmd) && opt.platform && !E.PLATFORMS[platform]) { console.error("unknown platform " + platform); process.exit(1); }

switch (cmd) {
  case "audit": {
    if (opt.compare) {
      const files = [opt.compare, ...opt._].filter((x) => typeof x === "string");
      if (files.length < 2) { console.error("audit --compare before.txt after.txt"); process.exit(1); }
      const r = E.auditCompare(readFileSync(files[0], "utf8"), readFileSync(files[1], "utf8"), platform);
      if (opt.json) { json(r); break; }
      say("score  " + r.score.before + " -> " + r.score.after + " (" + (r.score.delta >= 0 ? "+" : "") + r.score.delta + ")",
        "panel  " + r.panel.before + " " + r.panel.verdictBefore + " -> " + r.panel.after + " " + r.panel.verdictAfter,
        ...Object.entries(r.checks).map(([k, v]) => "  " + k.padEnd(12) + (v.before ?? "n/a") + " -> " + (v.after ?? "n/a")),
        "fixed: " + (r.fixed.join(", ") || "none"), "introduced: " + (r.introduced.join(", ") || "none"),
        r.voiceDropped ? "WARNING: voice score dropped; roll back the edit that flattened it" : "voice held");
      break;
    }
    const r = E.humanAudit(readText(), platform);
    if (opt.json) { json(r); break; }
    const p = r.panel;
    say("human score " + r.score + " " + (r.pass ? "PASS" : "FAIL") + " (" + r.wordCount + " words)", "issues:", fmtIssues(r.issues),
      "panel " + p.overall + " " + p.verdict + " (scored on " + p.judged + " of 5)",
      ...Object.entries(p.checks).map(([k, v]) => "  " + k.padEnd(12) + (v.score ?? "n/a") + (v.note ? "  " + v.note : "")),
      "weakest: " + p.weakest + ". Fix that first: " + p.fix,
      r.suggestions.length ? "suggestions (rewrite, do not synonym-swap): " + r.suggestions.map((s) => s.word + " -> " + s.suggestion).join("; ") : "",
      r.note);
    break;
  }
  case "scrub": console.log(E.scrub(readText())); break;
  case "check": {
    const r = E.platformCheck(readText(), platform, opt);
    if (opt.json) { json(r); break; }
    const spec = E.PLATFORMS[platform];
    say(spec.label + ": " + r.length + (r.weighted ? " weighted" : "") + " / " + (opt.premium && spec.premiumMaxChars ? spec.premiumMaxChars : spec.maxChars) + " chars, " + r.hashtags + " hashtags, " + r.links + " links", fmtIssues(r.issues));
    process.exitCode = r.issues.some((i) => i.severity === "block") ? 2 : 0; break;
  }
  case "fold": {
    const r = E.foldPreview(readText(), platform);
    if (opt.json) { json(r); break; }
    say(platform + " length " + r.length, ...r.cuts.map((c) => "--- " + c.name + " @" + c.at + ": " + c.status.toUpperCase() + (c.fits ? " (whole post visible)" : "") + "\n" + c.visible));
    break;
  }
  case "hooks": {
    const t = readText(); const plat = opt.bank === "youtube" ? "youtube" : platform;
    const r = E.rankHooks(t.split("\n"), plat).map((h) => opt.bank ? { ...h, ...(() => { const c = E.classifyHook(h.hook, plat, { bank: opt.bank }); return { formula: c.id, formulaName: c.name, trap: c.trap }; })() } : h);
    if (opt.json) { json(r); break; }
    say(...r.map((h, i) => (i + 1) + ". " + h.score + " " + h.verdict + "  " + h.hook + "\n   formula: " + (h.formula ? h.formula + " " + h.formulaName : "unclassified") + " | weakest: " + h.weakest + " (" + h.fix + ")" + (h.dealbreakers.length ? " | dealbreakers: " + h.dealbreakers.join(", ") : "") + "\n   trap: " + h.trap));
    break;
  }
  case "classify": {
    const r = E.classifyHook(readText(), platform, { bank: opt.bank });
    if (opt.json) { json(r); break; }
    say((r.id ? r.id + " " + r.name : "unclassified") + " (confidence " + r.confidence + (r.goal ? ", goal " + r.goal : "") + ")", "trap: " + r.trap, r.alternatives.length ? "also: " + r.alternatives.join(", ") : "");
    break;
  }
  case "gate": {
    const notes = typeof opt.notes === "string" ? readFileSync(opt.notes, "utf8") : undefined;
    const r = E.gate(readText(), platform, { ...opt, evidenceKind: opt.evidence, notes });
    process.exitCode = r.pass ? 0 : 2;
    if (opt.json) { json(r); break; }
    say("GATE " + (r.pass ? "PASS" : "BLOCKED") + " (" + platform + ")",
      "human " + r.human.score + " | panel " + r.human.panel.overall + " " + r.human.panel.verdict + " (weakest " + r.weakest + ") | hook " + r.hook.score + " " + r.hook.verdict + " | formula " + (r.hook.formula || "unclassified"),
      "evidence: " + (r.evidence.pass ? "ok" : r.evidence.detail) + (r.evidence.notesChecked ? " (numbers checked against notes)" : ""),
      r.blocks.length ? "blocks:\n" + r.blocks.map((b) => "  - " + b).join("\n") : "blocks: none",
      r.warnings.length ? "warnings:\n" + r.warnings.map((b) => "  - " + b).join("\n") : "warnings: none");
    break;
  }
  case "repurpose": {
    const text = readText(); const res = {};
    for (const p of Object.keys(E.PLATFORMS)) {
      const t = p === "x" && E.xWeightedLength(text) > 280 ? E.toThread(text) : null;
      const g = E.gate(t ? t.join("\n\n") : text, p, { ...opt, evidenceKind: opt.evidence, premium: !!t });
      res[p] = { pass: g.pass && (!t || t.every((x) => E.xWeightedLength(x) <= 280)), blocks: g.blocks, issues: g.platformCheck.issues.map((i) => i.detail), thread: t || undefined };
    }
    if (opt.json) { json(res); break; }
    say(...Object.entries(res).map(([p, r]) => p.padEnd(10) + (r.pass ? "fits" : "needs work") + (r.thread ? " (" + r.thread.length + "-post thread)" : "") + (r.blocks.length ? "\n  blocks: " + r.blocks.join("; ") : "") + (r.issues.length ? "\n  issues: " + r.issues.join("; ") : "")),
      "Rewrite natively per platform; do not cross-post the same text.");
    break;
  }
  case "thread": {
    const parts = E.toThread(readText(), Number(opt.limit || 280), { number: !opt["no-number"] });
    const lint = E.threadLint(parts);
    if (opt.json) { json({ parts, weighted: parts.map((p) => E.xWeightedLength(p)), lint }); break; }
    say(...parts.map((p) => "[" + E.xWeightedLength(p) + "] " + p), "lint:", fmtIssues(lint));
    break;
  }
  case "reel": {
    needPlatform(["instagram", "youtube", "linkedin", "x"]);
    const r = E.reelBeats(readText(), { platform, target: opt.target, wps: opt.wps ? Number(opt.wps) : undefined });
    process.exitCode = r.pass ? 0 : 2;
    if (opt.json) { json(r); break; }
    say(platform + ": " + r.total + " s, " + r.words + " words at " + r.wps + " words/s" + (r.target ? " (target " + r.target.seconds + " s, " + (r.target.delta >= 0 ? "+" : "") + r.target.delta + ")" : ""),
      ...r.beats.map((b) => "  " + String(b.start).padStart(5) + "-" + String(b.end).padEnd(5) + " " + b.label.padEnd(4) + " " + b.text),
      "flags:", fmtIssues(r.flags));
    break;
  }
  case "title": {
    const r = E.titleLint(typeof opt.title === "string" ? opt.title : readText().trim(), typeof opt.thumb === "string" ? opt.thumb : "");
    if (opt.json) { json(r); break; }
    say("title score " + r.score + " (" + r.chars + " chars) " + (r.formula ? r.formula + " " + r.formulaName : "unclassified"), "mobile shows: " + r.mobileVisible, fmtIssues(r.issues), r.good.length ? "good: " + r.good.join(", ") : "", r.pairing ? "pairing: " + r.pairing : "");
    process.exitCode = r.pass ? 0 : 2; break;
  }
  case "chapters": {
    const r = E.chapterCheck(readText(), { duration: opt.duration ? Number(opt.duration) : undefined });
    process.exitCode = r.pass ? 0 : 2;
    if (opt.json) { json(r); break; }
    say("chapters " + (r.pass ? "VALID" : "INVALID") + " (" + r.chapters.length + ")", fmtIssues(r.issues), r.rules || ""); break;
  }
  case "outliers": {
    const rows = E.parseCSV(readText());
    const list = E.outliers(rows, Number(opt.threshold || 3), { minPosts: opt["min-posts"] ? Number(opt["min-posts"]) : 5, platform });
    const summary = E.outlierSummary(list);
    if (opt.json) { json({ summary, rows: list }); break; }
    say(summary.rows + " rows, " + summary.accounts + " accounts, " + summary.signals + " signals (>= " + (opt.threshold || 3) + "x own median)",
      summary.thinAccounts.length ? "thin (not ranked): " + summary.thinAccounts.join(", ") : "",
      ...list.filter((r) => r.signal).slice(0, 25).map((r) => "  " + String(r.multiple).padStart(6) + "x  " + r.account + "  " + (r.formula ? r.formula + " " : "") + (r.text || r.url || "").slice(0, 70)),
      "formulas among signals: " + (Object.entries(summary.formulasAmongSignals).map(([k, v]) => k + " " + v).join(", ") || "none"), summary.note);
    break;
  }
  case "pain": {
    const r = E.painThemes(E.parseCSV(readText()), { months: opt.months ? Number(opt.months) : undefined });
    if (opt.json) { json(r); break; }
    const show = (t) => "  " + t.theme.padEnd(14) + " score " + t.score + ", " + t.count + " items (" + t.share + "%), " + t.sources.length + " sources" + (t.thin ? " THIN" : "") + "\n" + t.quotes.map((q) => "      \"" + q.quote + "\" " + q.url).join("\n");
    say(r.items + " items (" + r.duplicates + " duplicates, " + r.dropped + " dropped)", ...r.warnings.map((w) => "WARNING: " + w), "complaints:", ...r.complaints.map(show), "requests:", ...r.requestThemes.map(show), r.readByHand.length ? "read these by hand: " + r.readByHand.length : "", r.note);
    break;
  }
  case "log": {
    const f = typeof opt.log === "string" ? opt.log : DEFAULT_LOG;
    const head = E.LOG_HEADER.join(",");
    if (!existsSync(f)) writeFileSync(f, head + "\n");
    else {
      // migrate an older header in place (adds the new trailing columns; rows are untouched)
      const cur = readFileSync(f, "utf8"); const nl = cur.indexOf("\n"); const first = (nl < 0 ? cur : cur.slice(0, nl)).replace(/\r$/, "");
      if (first !== head && head.startsWith(first)) writeFileSync(f, head + (nl < 0 ? "\n" : cur.slice(nl)));
      else if (cur.length && !cur.endsWith("\n")) appendFileSync(f, "\n");
    }
    const { record, line } = E.logRow(readText(), platform, opt);
    appendFileSync(f, line + "\n");
    if (opt.json) json({ logged: f, record }); else say("logged to " + f, Object.entries(record).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => k + "=" + v).join(" | "));
    break;
  }
  case "stats": {
    const f = typeof opt.log === "string" ? opt.log : DEFAULT_LOG;
    const r = E.stats(readLog(f), { platform: opt.platform });
    if (opt.json) { json(r); break; }
    const sec = (name, g) => [name + ":", ...Object.entries(g).map(([k, v]) => "  " + k.padEnd(28) + "n=" + v.posts + " ER " + (v.engagementRate ?? "-") + "% median ER " + (v.medianER ?? "-") + " reach " + (v.medianReach ?? "-") + (v.warning ? "  (" + v.warning + ")" : ""))];
    say(r.posts + " posted rows", ...r.warnings.map((w) => "WARNING: " + w), ...sec("by platform", r.byPlatform), ...sec("by formula", r.byFormula), ...sec("by format", r.byFormat), ...sec("by length", r.byLength), r.note);
    break;
  }
  case "caps": {
    const f = typeof opt.log === "string" ? opt.log : DEFAULT_LOG;
    const r = E.capsUsage(readLog(f), { date: typeof opt.date === "string" ? opt.date : undefined });
    if (opt.json) { json(r); break; }
    say("caps for " + r.date + " (" + r.timezone + ")", ...Object.entries(r.report).map(([p, acts]) => "  " + p.padEnd(10) + Object.entries(acts).map(([a, v]) => a + " " + v.used + "/" + (v.cap ?? "-") + (v.atCap ? " AT CAP" : "")).join(", ")),
      r.atCap.length ? "STOP for today: " + r.atCap.join(", ") : "no caps reached");
    process.exitCode = r.atCap.length ? 2 : 0; break;
  }
}
