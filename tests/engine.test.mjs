import { test } from "node:test";
import assert from "node:assert/strict";
import * as E from "../scripts/engine.mjs";

const human = `I shipped our eval suite on a Tuesday and broke prod by Thursday.

The retriever returned stale docs for 41 of 300 test questions. Nobody noticed because the answers still read well.

We now block a release when grounded accuracy drops below 92% on the frozen set. It took one afternoon to wire up and it has caught two regressions since.

What check would you add before shipping a RAG feature?`;

const slop = `In today's fast-paced landscape, we must leverage cutting-edge AI to unlock seamless synergy.

Here's the thing: it's not about tools, it's about mindset.

Thoughts? 🚀🚀✨`;

test("human draft passes the audit", () => {
  const r = E.humanAudit(human); assert.ok(r.pass, JSON.stringify(r.issues)); assert.ok(r.score >= 80);
});
test("slop draft fails with the expected rules", () => {
  const r = E.humanAudit(slop); const rules = r.issues.map((i) => i.rule);
  assert.ok(!r.pass); for (const k of ["slop-cluster", "reveal-bridge", "engagement-bait", "cliche-opener"]) assert.ok(rules.includes(k), k);
});
test("forensic leakage and placeholders block", () => {
  const r = E.humanAudit("Great result turn0search3 for [Your Company] team.");
  assert.equal(r.pass, false); assert.ok(r.issues.some((i) => i.rule === "forensic")); assert.ok(r.issues.some((i) => i.rule === "placeholder"));
});
test("scrub removes invisible chars and caps em dashes", () => {
  const s = E.scrub("a\u200Bb — c — d — e"); assert.ok(!s.includes("\u200B")); assert.equal((s.match(/—/g) || []).length, 1);
});
test("hooks rank specific above generic", () => {
  const [top, low] = E.rankHooks(["In today's world, AI matters.", "I cut proposal time from 5 hours to 20 minutes with one template."]);
  assert.match(top.hook, /5 hours/); assert.ok(top.score > low.score);
});
test("X length limit blocks, premium lifts it", () => {
  const long = "word ".repeat(80);
  assert.ok(E.platformCheck(long, "x").issues.some((i) => i.severity === "block"));
  assert.ok(!E.platformCheck(long, "x", { premium: true }).issues.some((i) => i.severity === "block"));
});
test("instagram flags dead links", () => {
  assert.ok(E.platformCheck("see https://a.b " + "x".repeat(200), "instagram").issues.some((i) => i.rule === "link-in-body"));
});
test("outliers use the account's own median", () => {
  const rows = [10, 12, 11, 9, 13, 60].map((v, i) => ({ account: "small", url: "u" + i, views: v * 100 }))
    .concat([90, 100, 110, 95, 105, 120].map((v, i) => ({ account: "big", url: "b" + i, views: v * 10000 })));
  const r = E.outliers(rows); assert.equal(r[0].account, "small"); assert.ok(r[0].signal); assert.ok(!r.find((x) => x.account === "big").signal);
});
test("evidence gate needs a source for numeric claims", () => {
  assert.equal(E.evidenceCheck("Usage grew 40% last quarter.").pass, false);
  assert.equal(E.evidenceCheck("Usage grew 40% last quarter.", [], "firsthand").pass, true);
});
test("full gate passes the human draft with firsthand evidence", () => {
  const r = E.gate(human, "linkedin", { evidenceKind: "firsthand" }); assert.ok(r.pass, r.blocks.join("; "));
});
test("thread split respects limit", () => {
  const t = E.toThread("This is a sentence that goes on. ".repeat(30)); assert.ok(t.length > 1); assert.ok(t.every((p) => p.length <= 280));
});