import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import * as E from "../scripts/engine.mjs";

const CLI = new URL("../scripts/cli.mjs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const cli = (args, input) => { try { return { code: 0, out: execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8", input }) }; } catch (e) { return { code: e.status, out: (e.stdout || "") + (e.stderr || "") }; } };
const slop = "In today's fast-paced landscape, we must leverage cutting-edge AI to unlock seamless synergy.\n\nHere's the thing: it's not about tools, it's about mindset.\n\nThoughts? 🚀🚀✨";

// ---------- data contract ----------
test("data files follow the contract and every regex compiles", () => {
  const want = { linkedin: [21, "LI"], x: [21, "X"], shortform: [26, "SF"], youtube: [21, "YT"] };
  for (const [k, [n, pre]] of Object.entries(want)) {
    const b = E.HOOK_BANKS[k]; assert.ok(b.version && Array.isArray(b.rules) && b.rules.length);
    assert.ok(b.hooks.length >= n, k);
    b.hooks.slice(0, n).forEach((h, i) => assert.equal(h.id, pre + "-" + String(i + 1).padStart(2, "0")));
    for (const h of b.hooks) {
      for (const f of ["id", "name", "template", "example", "best_for", "goal", "trap", "match"]) assert.ok(h[f], h.id + " " + f);
      assert.ok(["saves", "shares", "comments", "follows", "clicks", "watch"].includes(h.goal), h.id);
      for (const m of h.match) new RegExp(m, "iu");
    }
    assert.equal(new Set(b.classify_order).size, b.hooks.length, k + " classify_order covers every hook once");
  }
  assert.ok(E.HOOK_BANKS.youtube.hooks.every((h) => h.pairing));
  for (const k of ["forensic", "strict", "linkedin_layer", "idioms_2026", "grammar_regex", "structural_regex", "replacements"]) assert.ok(E.SLOP[k], k);
  assert.ok(E.PLATFORMS.linkedin.video && E.PLATFORMS.linkedin.caps.connect === 10 && E.PLATFORMS.linkedin.caps.dm === 5);
});
test("doc-cited hook ids resolve to the cited names", () => {
  for (const [id, name] of [["SF-01", "Cost Confession"], ["SF-09", "The Steal"], ["SF-16", "The Verbatim Question"], ["YT-03", "The Mistake"], ["YT-08", "I Tried It"], ["YT-15", "The Receipt"], ["X-01", "Contrarian Take"], ["X-20", "Open Question"]]) assert.equal(E.hookById(id).name, name);
});

// ---------- audit / panel / scrub ----------
test("panel: weakest-link verdict, burstiness n/a on short text", () => {
  const short = E.humanPanel("Shipped it on Tuesday. It broke on Thursday.");
  assert.equal(short.checks.burstiness.score, null); assert.ok(short.judged < 5);
  const p = E.humanPanel(slop + " " + slop);
  assert.ok(p.checks.slop.score < 30); assert.notEqual(p.verdict, "PASS");
  const vals = Object.values(p.checks).map((c) => c.score).filter((x) => x !== null);
  assert.equal(p.overall, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 0.6 + Math.min(...vals) * 0.4));
});
test("audit catches new structural tells and suggests replacements", () => {
  const t = "Not only did we ship faster, but also cheaper.\n\nThis isn't about speed. It's about trust.\n\nIn summary, we leverage robust tooling.";
  const r = E.humanAudit(t); const rules = r.issues.map((i) => i.rule);
  assert.ok(rules.includes("not-only")); assert.ok(rules.includes("isnt-about") || rules.includes("negative-parallelism")); assert.ok(rules.includes("in-summary"));
  assert.ok(r.suggestions.some((s) => s.word === "leverage"));
});
test("audit flags hollow triads and ing-openers but not real lists", () => {
  assert.ok(E.humanAudit("We want growth, impact, and value this year.").issues.some((i) => i.rule === "hollow-triad"));
  assert.ok(!E.humanAudit("We tested Postgres, Redis, and Kafka this year.").issues.some((i) => i.rule === "hollow-triad"));
  assert.ok(E.humanAudit("Leveraging our new stack, the team shipped it.").issues.some((i) => i.rule === "ing_opener"));
});
test("'As an AI engineer' is not forensic, 'as an AI language model' is", () => {
  assert.ok(!E.humanAudit("As an AI engineer I check sources first.").issues.some((i) => i.rule === "forensic"));
  assert.ok(E.humanAudit("As an AI language model, I cannot do that.").issues.some((i) => i.rule === "forensic"));
});
test("scrub removes tag chars and hard spaces, keeps emoji ZWJ and URLs", () => {
  const s = E.scrub("dev 👨‍💻 ok\u{E0041}\u00A0now https://a.b/x—y “quoted”");
  assert.ok(s.includes("👨‍💻")); assert.ok(!/\u{E0041}/u.test(s)); assert.ok(!s.includes("\u00A0")); assert.ok(s.includes("https://a.b/x—y")); assert.ok(s.includes('"quoted"'));
});
test("auditCompare reports delta and fixed rules", () => {
  const r = E.auditCompare(slop, "I cut our deploy time from 40 to 12 minutes in March. The fix was a cache key.");
  assert.ok(r.score.delta > 0); assert.ok(r.fixed.includes("engagement-bait"));
});

// ---------- hooks ----------
test("classifyHook names formulas per bank", () => {
  assert.equal(E.classifyHook("$18,000 is what not having a contract cost me.", "linkedin").id, "LI-03");
  assert.equal(E.classifyHook("Writing posts used to take me 5 hours. It now takes 20 minutes.", "linkedin").id, "LI-17");
  assert.equal(E.classifyHook("Nobody tells you the second product is harder to sell.", "x").id, "X-06");
  assert.equal(E.classifyHook("Steal this 3-line prompt. It took me a month.", "instagram").id, "SF-09");
  assert.equal(E.classifyHook("I let an AI run my channel for 30 days.", "youtube").id, "YT-08");
  assert.equal(E.classifyHook("Some thoughts on the industry and where it is heading these days, broadly speaking.", "linkedin").id, null);
});
test("hookScore keeps weakest-link and adds dealbreakers, formula, trap", () => {
  const h = E.hookScore("I cut proposal time from 5 hours to 20 minutes with one template.");
  assert.equal(h.formula, "LI-17"); assert.ok(h.trap); assert.ok(h.fix);
  const bad = E.hookScore("Hey everyone, a thread on growth #ai", "x");
  assert.ok(bad.dealbreakers.length >= 2); assert.ok(bad.score < h.score);
});

// ---------- X / fold / thread ----------
test("X weighted length: URL 23, emoji 2, CJK 2", () => {
  assert.equal(E.xWeightedLength("hello"), 5);
  assert.equal(E.xWeightedLength("see https://example.com/a/very/long/path?x=1"), 4 + 23);
  assert.equal(E.xWeightedLength("👨‍💻"), 2); assert.equal(E.xWeightedLength("🇮🇳"), 2); assert.equal(E.xWeightedLength("日本"), 4);
  assert.ok(E.platformCheck("😀".repeat(141), "x").issues.some((i) => i.severity === "block"));
  assert.ok(!E.platformCheck("😀".repeat(140), "x").issues.some((i) => i.severity === "block"));
});
test("foldPreview classifies cut points", () => {
  assert.equal(E.foldPreview("Short post.", "linkedin").cuts[0].status, "clean");
  const mid = E.foldPreview("a".repeat(10) + " " + "word".repeat(60), "linkedin").cuts[0];
  assert.equal(mid.status, "mid-word"); assert.ok(mid.visible.endsWith("see more"));
  assert.equal(E.foldPreview("x ".repeat(200), "x").cuts.length, 1);
});
test("thread prefers paragraphs and lints", () => {
  const t = E.toThread("First idea here.\n\nSecond idea here.\n\n" + "A long sentence that goes on. ".repeat(20));
  assert.ok(t[0].startsWith("First idea here.")); assert.ok(t.every((p) => E.xWeightedLength(p) <= 280)); assert.match(t[0], /1\/\d+$/);
  assert.ok(E.threadLint(["one", "two"]).some((i) => i.rule === "count"));
});

// ---------- evidence ----------
test("evidence gate blocks markers even with firsthand", () => {
  const r = E.evidenceCheck("We saved [ADD: hours] last month.", [], "firsthand");
  assert.equal(r.pass, false); assert.deepEqual(r.markers, ["[ADD: hours]"]);
  assert.equal(E.gate("I think [CONFIRM: release date] matters.\n\nMore text here for length.", "linkedin", { evidenceKind: "firsthand" }).pass, false);
});
test("--notes: every number in the draft must be in the notes", () => {
  const d = "Accuracy rose from 81% to 92% across 300 questions.";
  assert.equal(E.evidenceCheck(d, [], "firsthand", { notes: "baseline 81%, after 92%, n=300" }).pass, true);
  const r = E.evidenceCheck(d, [], "firsthand", { notes: "baseline 81%, after 92%" });
  assert.equal(r.pass, false); assert.deepEqual(r.missingNumbers, ["300"]);
  assert.equal(E.evidenceCheck("1. Define it.\n2. Test it.", [], "", { notes: "" }).pass, true, "list numbering is not a claim");
});

// ---------- video / youtube ----------
test("reelBeats flags long hook, CTA not last, and target miss", () => {
  const r = E.reelBeats("So today I want to talk to you about something that has been on my mind for a long time now.\nFollow for more.\nAnd that is the whole idea.", { platform: "instagram", target: 30 });
  const rules = r.flags.map((f) => f.rule);
  assert.ok(rules.includes("hook-length")); assert.ok(rules.includes("cta-last")); assert.ok(rules.includes("target")); assert.equal(r.pass, false);
  const ok = E.reelBeats("$18,000 is what one clause cost me.\nThe contract had no payment date.\nNow every contract has one line: net 15.\nSave this before your next $18,000 invoice.", { platform: "linkedin" });
  assert.equal(ok.beats[0].label, "HOOK"); assert.ok(ok.loopWords.length); assert.ok(ok.pass, JSON.stringify(ok.flags));
});
test("titleLint: mobile cut, thumbnail overlap, caps", () => {
  const r = E.titleLint("I Tried Posting Every Day For 30 Days And Here Is What Happened To My Channel", "posting every day");
  assert.ok(r.issues.some((i) => i.rule === "desktop-cut")); assert.ok(r.issues.some((i) => i.rule === "duplicate")); assert.ok(r.mobileVisible.length <= 41);
  assert.ok(E.titleLint("THIS IS INSANE AND CRAZY").issues.some((i) => i.rule === "caps"));
  assert.equal(E.titleLint("x".repeat(101)).pass, false);
});
test("chapterCheck enforces 0:00, >= 3, >= 10 s", () => {
  assert.equal(E.chapterCheck("0:00 Intro\n0:45 Setup\n2:10 Fix").pass, true);
  const bad = E.chapterCheck("0:05 Intro\n0:10 Setup");
  assert.ok(bad.issues.some((i) => i.rule === "first-zero")); assert.ok(bad.issues.some((i) => i.rule === "min-count"));
  assert.ok(E.chapterCheck("0:00 A\n0:05 B\n1:00 C").issues.some((i) => i.rule === "min-length"));
});

// ---------- research ----------
test("outliers classify formulas, compute reach, list thin accounts", () => {
  const rows = [10, 12, 11, 9, 13, 60].map((v, i) => ({ account: "a", url: "u" + i, views: v * 100, followers: 1000, text: i === 5 ? "$18,000 is what one clause cost me." : "update" }))
    .concat([{ account: "thin", url: "t", views: 5 }]);
  const r = E.outliers(rows, 3, { platform: "linkedin" });
  assert.equal(r[0].formula, "LI-03"); assert.equal(r[0].reach, 6); assert.ok(r[0].signal);
  const s = E.outlierSummary(r); assert.ok(s.thinAccounts[0].startsWith("thin")); assert.equal(s.formulasAmongSignals["LI-03 Mistake Confession"], 1);
});
test("painThemes ranks verbatim linked quotes and warns on small samples", () => {
  const rows = [
    { source: "reddit", url: "https://r/1", text: "Way too expensive for what it does." },
    { source: "yt", url: "https://y/2", text: "The pricing is not worth it. I wish there was a free tier." },
    { source: "reddit", url: "https://r/3", text: "Subscription is overpriced." },
    { source: "yt", url: "https://y/4", text: "It keeps crashing on export." },
    { source: "none", url: "", text: "no link, dropped" },
    { source: "reddit", url: "https://r/1b", text: "Way too expensive for what it does." },
  ];
  const r = E.painThemes(rows);
  assert.equal(r.complaints[0].theme, "pricing"); assert.equal(r.dropped, 1); assert.equal(r.duplicates, 1);
  assert.ok(r.complaints[0].quotes.every((q) => rows.some((x) => x.text.includes(q.quote) && x.url === q.url)));
  assert.ok(r.warnings[0].includes("direction, not a ranking")); assert.ok(r.requests.length);
});
test("commentOverlap detects thread duplication at 0.72", () => {
  assert.ok(E.commentOverlap("Cache keys broke our deploys twice last month", ["Our deploys broke twice last month because of cache keys"]).duplicate);
  assert.ok(!E.commentOverlap("Ship the eval set first", ["Love the design system work"]).duplicate);
});

// ---------- log / stats / caps ----------
test("parseCSV handles quotes and commas", () => {
  const r = E.parseCSV('a,b\n"x, y","he said ""hi"""\n');
  assert.deepEqual(r, [{ a: "x, y", b: 'he said "hi"' }]);
});
test("stats groups by formula with sample-size warnings", () => {
  const rows = [1, 2, 3].map((i) => ({ status: "posted", platform: "linkedin", formula: "LI-03", format: "text", chars: "900", impressions: "1000", likes: String(10 * i), comments: "2", followers: "500" }));
  const s = E.stats(rows);
  assert.equal(s.byFormula["LI-03"].posts, 3); assert.ok(s.byFormula["LI-03"].warning); assert.ok(s.warnings.length); assert.equal(s.byFormula["LI-03"].medianReach, 2);
});
test("capsUsage counts today's posted actions in Asia/Kolkata", () => {
  const now = "2026-11-05T20:00:00Z"; // 01:30 on 6 Nov in Kolkata
  const rows = [
    { date: "2026-11-06", platform: "linkedin", status: "posted" },
    { date: "2026-11-06", platform: "linkedin", status: "posted", action: "post" },
    { date: "2026-11-06", platform: "linkedin", status: "approved" },
    { date: "2026-11-06", platform: "x", status: "posted", action: "reply" },
    { date: "2026-11-05", platform: "linkedin", status: "posted" },
  ];
  const r = E.capsUsage(rows, { now });
  assert.equal(r.date, "2026-11-06"); assert.equal(r.report.linkedin.post.used, 2); assert.ok(r.report.linkedin.post.atCap);
  assert.equal(r.report.x.reply.used, 1); assert.equal(r.report.linkedin.reply.cap, null);
  assert.equal(E.capsFor("linkedin", "connect"), 10); assert.equal(E.capsFor("linkedin", "nope"), 0);
});

// ---------- CLI ----------
test("CLI: every contract command has --help", () => {
  for (const c of ["audit", "scrub", "check", "fold", "hooks", "classify", "gate", "repurpose", "thread", "reel", "title", "chapters", "outliers", "pain", "log", "stats", "caps"]) {
    const r = cli([c, "--help"]); assert.equal(r.code, 0, c); assert.ok(r.out.includes(c), c);
  }
});
test("CLI: gate exit codes, reel platforms, log + caps round trip", () => {
  assert.equal(cli(["gate", "--platform", "linkedin", "--text", slop, "--evidence", "firsthand"]).code, 2);
  assert.equal(cli(["reel", "--platform", "linkedin", "--text", "$18,000 is what one clause cost me.\nSave this."]).code, 0);
  assert.equal(cli(["reel", "--platform", "nope", "--text", "x"]).code, 1);
  const dir = mkdtempSync(join(tmpdir(), "sa-")); const log = join(dir, "log.csv");
  try {
    writeFileSync(log, "date,platform,status,hook,first_line,url,impressions,likes,comments,saves,shares\n");
    const today = E.localDate();
    const a = cli(["log", "--platform", "linkedin", "--text", "$18,000 is what one clause cost me.", "--status", "posted", "--url", "https://x.y/1", "--log", log, "--json"]);
    assert.equal(a.code, 0, a.out); const rec = JSON.parse(a.out).record; assert.equal(rec.formula, "LI-03"); assert.equal(rec.date, today);
    cli(["log", "--platform", "linkedin", "--text", "A comment.", "--status", "posted", "--action", "comment", "--formula", "LI-99", "--log", log]);
    const csv = readFileSync(log, "utf8"); assert.ok(csv.startsWith(E.LOG_HEADER.join(","))); assert.ok(csv.includes('"LI-99"'));
    const c = JSON.parse(cli(["caps", "--log", log, "--json"]).out);
    assert.equal(c.report.linkedin.post.used, 1); assert.equal(c.report.linkedin.comment.used, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---------- calibration ----------
const POSTS = "D:\\social post\\linkedin\\posts";
test("calibration: all 12 published LinkedIn posts pass gate --evidence firsthand", { skip: !existsSync(POSTS) && "posts folder not present" }, () => {
  const files = readdirSync(POSTS).filter((f) => f.endsWith(".txt"));
  assert.equal(files.length, 12);
  for (const f of files) {
    const g = E.gate(readFileSync(join(POSTS, f), "utf8"), "linkedin", { evidenceKind: "firsthand" });
    assert.ok(g.pass, f + ": " + g.blocks.join("; "));
  }
});
test("calibration: the slop sample fails the gate", () => {
  const g = E.gate(slop, "linkedin", { evidenceKind: "firsthand" });
  assert.equal(g.pass, false); assert.equal(g.human.panel.verdict, "FLAGGED");
});
