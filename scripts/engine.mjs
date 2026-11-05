// social-autopilot engine v2. Zero dependencies. Used by scripts/cli.mjs.
// Deterministic checks only: the agent's model writes, this file measures. Data lives in ../data/*.json.
import { readFileSync } from "node:fs";

const DATA_DIR = new URL("../data/", import.meta.url);
const load = (f) => JSON.parse(readFileSync(new URL(f, DATA_DIR), "utf8"));
const PF = load("platforms.json");
export const SLOP = load("slop.json");
export const HOOK_BANKS = {
  linkedin: load("hooks-linkedin.json"), x: load("hooks-x.json"),
  shortform: load("hooks-shortform.json"), youtube: load("hooks-youtube.json"),
};
export const PLATFORMS = Object.fromEntries(["linkedin", "x", "instagram", "youtube"].map((k) => [k, PF[k]]));
export const TIMEZONE = PF.timezone || "Asia/Kolkata";
export const DATA = { platforms: PF, slop: SLOP, hooks: HOOK_BANKS };

// ---------- helpers ----------
const rx = (src, flags = "giu") => { try { return new RegExp(src, flags); } catch { return new RegExp(src, flags.replace("u", "")); } };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const termRe = (t) => rx("(?<![\\p{L}\\d])" + esc(t).replace(/\s+/g, "\\s+") + "(?![\\p{L}\\d])", "giu");
const words = (t) => (t.toLowerCase().match(/[a-z0-9'’$%-]+/g) || []);
const paragraphs = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const countMatches = (t, re) => (t.match(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g")) || []).length;
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const pstdev = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
export const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const scale = (v, human, machine) => clamp(((v - machine) / (human - machine)) * 100);
const firstLine = (t) => t.trim().split("\n")[0] || "";

const FORENSIC = SLOP.forensic.map((s) => rx(s, "gi"));
const PLACEHOLDER = rx(SLOP.placeholder, "g");
const MARKERS = rx(SLOP.evidence_markers, "gi");
// Cf/format characters, plus the explicit invisible set (incl. tag chars E0000-E007F). ZWJ inside emoji and flag tags are protected in scrub.
const INVISIBLE = /[\u200B-\u200F\u2060-\u2064\uFEFF\u00AD\u180E\u061C\u202A-\u202E\u2066-\u2069\u{E0000}-\u{E007F}]/gu;
const HARD_SPACE = /[\u00A0\u202F\u2009\u2007\u2003\u2002\u2005\u2006\u2008\u200A]/g;
const MARKER_TERMS = [...new Set([...SLOP.strict, ...SLOP.decaying])].map((t) => ({ t, re: termRe(t) }));
const LAYER = [...SLOP.linkedin_layer, ...SLOP.idioms_2026].map((s) => ({ t: s, re: rx(s, "giu") }));
const SINCERITY = SLOP.sincerity.map((s) => rx(s, "gim"));
const OPENERS = SLOP.openers.map((s) => rx(s, "i"));
const CLOSERS = SLOP.closers.map((s) => rx(s, "gim"));
const AI_EMOJI = new RegExp("[" + SLOP.ai_emoji.join("") + "]", "gu");
// v1 rules kept verbatim so v1 behaviour is unchanged.
const REVEAL_BRIDGE = /\b(here'?s the (thing|kicker|truth|catch)|the (result|truth|kicker|catch|best part)\?|but here'?s|let that sink in|read that again|spoiler:|plot twist)\b/gi;
const NEG_PARALLEL = /\b(it'?s not (just )?(about )?[^.,;]{1,40}[,;]\s*it'?s|this isn'?t [^.,;]{1,40}[,;—-]\s*(it'?s|this is)|not because [^.,;]{1,40}, but because|it'?s not [^.]{1,30}\. it'?s)/gi;
const BAIT = /\b(thoughts\?|agree\?|comment ['"]?yes['"]?|like if you|repost if|tag someone|follow for more|drop a 🔥|link in bio)(?!\w)/gi;
const CLICHE_OPEN = { test: (s) => OPENERS.some((r) => r.test(s.trim())) };
const STRUCT = Object.entries(SLOP.structural_regex).map(([id, v]) => ({ id, ...v, re: rx(v.re, v.flags || "giu") }));
const SCRIPT = Object.entries(SLOP.script_regex).map(([id, v]) => ({ id, ...v, re: rx(v.re, "gimu") }));
const GRAMMAR = Object.entries(SLOP.grammar_regex).map(([id, v]) => ({ id, ...v, re: rx(v.re, "gu") }));
// structural ids already covered by a v1 rule (no double penalty)
const COVERED = { "not-just": "negative-parallelism", "isnt-about": "negative-parallelism", "this-isnt-this-is": "negative-parallelism", "the-result": "reveal-bridge", "plot-twist": "reveal-bridge", "thread-label": "cliche-opener" };
const SEV_PEN = { high: 10, medium: 5, low: 2 };
const HOLLOW = new Set([...SLOP.hollow.adjectives, ...SLOP.hollow.nouns]);

function markerHits(p) {
  const hits = [];
  for (const { t, re } of MARKER_TERMS) { re.lastIndex = 0; if (re.test(p)) hits.push(t); }
  for (const { t, re } of LAYER) { re.lastIndex = 0; const m = p.match(re); if (m) hits.push(m[0].trim().toLowerCase()); }
  // drop a term contained in a longer hit ("delve" inside "delve into")
  return [...new Set(hits)].filter((h, _, all) => !all.some((o) => o !== h && o.includes(h)));
}
const sentencesOf = (t) => (t.match(/[^.!?\n]+[.!?]*/g) || []).map((s) => s.trim()).filter((s) => words(s).length > 2);

// ---------- five-check human panel (port of Jakeschincariol detect.py) ----------
export function humanPanel(text) {
  const wl = text.match(/[A-Za-z']+/g) || []; const wc = wl.length; const checks = {};
  const sents = sentencesOf(text);
  if (wc >= 40 && sents.length >= 4) {
    const lens = sents.map((s) => words(s).length); const cv = pstdev(lens) / (mean(lens) || 1);
    checks.burstiness = { score: scale(cv, 0.7, 0.22), value: +cv.toFixed(2), target: "CV 0.55+", fix: "Vary sentence length: join two short ones or split a long one." };
  } else checks.burstiness = { score: null, value: null, note: "n/a under 40 words or 4 sentences" };
  if (wc >= 25) {
    const nums = (text.match(/\b\d[\d,.]*%?\b|\$\d/g) || []).length;
    const proper = new Set();
    for (const m of text.matchAll(/\b([A-Z][a-z]{2,}|[A-Z]{2,}[a-z]?)\b/g)) {
      const before = text.slice(0, m.index).replace(/[ \t"“‘(]+$/, "");
      if (!before || /[.!?:\n]$/.test(before)) continue; proper.add(m[1]);
    }
    const d = ((nums + proper.size) / wc) * 100;
    checks.specificity = { score: scale(d, 6, 0.5), value: +d.toFixed(2), target: "4+ numbers/names per 100 words", fix: "Add one real number with its referent, a named tool/company/place, or a dated fact. Ask the user; never invent." };
  } else checks.specificity = { score: null, value: null, note: "n/a under 25 words" };
  const lex = paragraphs(text).reduce((a, p) => a + markerHits(p).length, 0) + SINCERITY.reduce((a, r) => a + countMatches(text, r), 0);
  const sd = (lex / Math.max(wc, 1)) * 100;
  checks.slop = { score: scale(sd, 0, 4), value: +sd.toFixed(2), target: "0 lexicon hits per 100 words", fix: "Rewrite the paragraphs that carry the flagged words in plain words." };
  const fp = countMatches(text, INVISIBLE) * 4 + countMatches(text, /—/g) * 2 + countMatches(text, /[‘’“”]/g) * 0.25 + countMatches(text, /…/g) + countMatches(text, HARD_SPACE);
  const fk = (fp / Math.max(text.length, 1)) * 1000;
  checks.fingerprint = { score: scale(fk, 0, 12), value: +fk.toFixed(2), target: "few em dashes, no invisible chars", fix: "Run scrub; cut em dashes to the cap." };
  const tells = STRUCT.reduce((a, s) => a + countMatches(text, s.re), 0) + countMatches(text, REVEAL_BRIDGE) + countMatches(text, NEG_PARALLEL) + countMatches(text, BAIT);
  if (wc >= 25) {
    const c = ((text.match(/\b\w+['’](s|t|re|ve|ll|d|m)\b/gi) || []).length / wc) * 100;
    const p = ((text.match(/\b(i|me|my|mine|we|us|our|you|your)\b/gi) || []).length / wc) * 100;
    let v = scale(c, 3, 0) * 0.35 + scale(p, 8, 1) * 0.35 + clamp(100 - 22 * tells) * 0.3;
    const bullets = text.split("\n").filter((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l)).map((l) => words(l).length);
    if (bullets.length >= 3 && pstdev(bullets) < 1.6) v -= 12;
    checks.voice = { score: clamp(v), value: { contractionsPer100: +c.toFixed(1), pronounsPer100: +p.toFixed(1), tells }, target: "contractions and I/you/we present, no stock structures", fix: "Write it the way the user talks: first person, contractions, one opinion." };
  } else checks.voice = { score: clamp(100 - 50 * tells), value: { tells }, note: "short text: tells only" };
  const judged = Object.entries(checks).filter(([, v]) => v.score !== null);
  const vals = judged.map(([, v]) => v.score); const min = Math.min(...vals);
  const overall = clamp(mean(vals) * 0.6 + min * 0.4);
  const weakest = judged.sort((a, b) => a[1].score - b[1].score)[0][0];
  const verdict = overall >= 70 && min >= 55 ? "PASS" : overall >= 50 ? "REVIEW" : "FLAGGED";
  return { overall, verdict, weakest, fix: checks[weakest].fix, judged: vals.length, checks };
}

// ---------- human audit: penalties + panel ----------
export function humanAudit(text, platform = "linkedin", opts = {}) {
  const issues = [];
  const add = (severity, rule, detail, penalty) => issues.push({ severity, rule, detail, penalty });
  const wc = words(text).length || 1;
  for (const re of FORENSIC) { re.lastIndex = 0; const m = text.match(re); if (m) add("block", "forensic", `model leakage: "${m[0].slice(0, 50)}"`, 40); }
  const ph = text.match(PLACEHOLDER); if (ph) add("block", "placeholder", `unfilled: ${[...new Set(ph)].join(", ")}`, 30);
  const inv = countMatches(text, INVISIBLE); if (inv) add("high", "invisible-chars", `${inv} zero-width/format/tag characters (run scrub)`, 15);

  const dashes = countMatches(text, /—|--/g);
  const dashCap = Math.max(1, Math.floor(wc / 100));
  if (dashes > dashCap) add("high", "em-dash-density", `${dashes} em dashes, cap ${dashCap} for ${wc} words`, 6 * (dashes - dashCap));

  const found = new Set();
  paragraphs(text).forEach((p, i) => {
    const hits = markerHits(p); hits.forEach((x) => found.add(x));
    if (hits.length >= 3) add("high", "slop-cluster", `paragraph ${i + 1}: ${hits.join(", ")} (rewrite paragraph)`, 12);
    else if (hits.length === 2) add("medium", "slop-pair", `paragraph ${i + 1}: ${hits.join(", ")} (replace the weaker one)`, 5);
  });
  const fired = new Set();
  for (const [re, rule, pen] of [[REVEAL_BRIDGE, "reveal-bridge", 8], [NEG_PARALLEL, "negative-parallelism", 10], [BAIT, "engagement-bait", 10]]) {
    const m = text.match(re); if (m) { fired.add(rule); add(rule === "reveal-bridge" ? "medium" : "high", rule, [...new Set(m.map((x) => x.trim()))].join(" | "), pen * Math.min(m.length, 3)); }
  }
  const sinc = SINCERITY.flatMap((r) => text.match(r) || []);
  if (sinc.length) add("medium", "sincerity-marker", [...new Set(sinc.map((x) => x.trim()))].join(" | "), 6 * Math.min(sinc.length, 3));
  if (!fired.has("engagement-bait")) {
    const cl = CLOSERS.flatMap((r) => text.match(r) || []);
    if (cl.length) add("high", "engagement-bait", [...new Set(cl.map((x) => x.trim()))].join(" | "), 10 * Math.min(cl.length, 3));
  }
  const first = firstLine(text);
  if (CLICHE_OPEN.test(first)) { fired.add("cliche-opener"); add("high", "cliche-opener", first.slice(0, 80), 12); }
  for (const s of STRUCT) {
    if (COVERED[s.id] && fired.has(COVERED[s.id])) continue;
    const m = text.match(s.re); if (m) add(s.severity, s.id, `"${m[0].trim().slice(0, 60)}": ${s.fix}`, SEV_PEN[s.severity] * Math.min(m.length, 2));
  }
  if (platform === "instagram" || platform === "youtube" || opts.script) {
    for (const s of SCRIPT) { const m = text.match(s.re); if (m) add(s.severity, s.id, `"${m[0].trim().slice(0, 60)}": ${s.fix}`, SEV_PEN[s.severity]); }
  }
  for (const g of GRAMMAR) {
    const m = text.match(g.re) || [];
    if (g.id === "nominalisation" ? m.length >= 2 : m.length) add(g.id === "nominalisation" ? "low" : "medium", g.id, `${m.length}x "${m[0].trim().slice(0, 50)}": ${g.fix}`, g.id === "nominalisation" ? 2 * (m.length - 1) : 4);
  }
  const triads = [...text.matchAll(/\b([\w'-]+), ([\w'-]+),? and ([\w'-]+)\b/g)];
  if (triads.length >= 3) add("medium", "stacked-triads", `${triads.length} lists of three`, 4 * (triads.length - 1));
  const hollow = triads.filter((m) => [m[1], m[2], m[3]].every((w) => HOLLOW.has(w.toLowerCase())));
  if (hollow.length) add("medium", "hollow-triad", `"${hollow[0][0]}": three abstractions with no receipt; use 2 or 4 concrete items`, 6);
  const emoji = countMatches(text, AI_EMOJI);
  if (emoji >= 3) add("medium", "ai-emoji-signature", `${emoji} rocket/sparkle/pointing emoji`, 3 * emoji);

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const fragments = lines.filter((l) => words(l).length <= 4 && /[.!]$/.test(l)).length;
  if (fragments >= 4) add("medium", "staccato-stack", `${fragments} one-to-four word lines`, 3 * (fragments - 3));
  else if (fragments === 3 && wc >= 60) add("low", "fragment-cap", "3 fragment lines; keep 2 or fewer per post", 2);
  const lens = text.split(/(?<=[.!?])\s+/).map((s) => words(s).length).filter((n) => n > 0);
  if (lens.length >= 5 && wc >= 40) {
    const sd = pstdev(lens);
    if (sd < 3.5) add("medium", "flat-rhythm", `sentence lengths too uniform (sd ${sd.toFixed(1)})`, 6);
  }
  // machine-flat paragraph: 4+ sentences, all within +-3 words of the paragraph mean
  paragraphs(text).forEach((p, i) => {
    const ls = sentencesOf(p).map((s) => words(s).length);
    if (ls.length >= 4 && ls.every((n) => Math.abs(n - mean(ls)) <= 3)) add("low", "flat-paragraph", `paragraph ${i + 1}: ${ls.length} sentences of near-equal length; join one with because/which/when`, 3);
  });
  if (wc >= 300 && dashes === 0 && platform === "linkedin") add("info", "over-scrubbed", "0 em dashes in 300+ words can read as scrubbed; fine if that is the user's style", 0);

  const panel = humanPanel(text);
  const suggestions = [...found].filter((w) => SLOP.replacements[w]).map((w) => ({ word: w, suggestion: SLOP.replacements[w] }));
  const score = clamp(100 - issues.reduce((a, i) => a + i.penalty, 0));
  return { score, pass: score >= 80 && !issues.some((i) => i.severity === "block"), wordCount: wc, issues, panel, weakest: panel.weakest, suggestions,
    note: "Local heuristics, not a detector. Never claim 'undetectable'." };
}

export function auditCompare(before, after, platform = "linkedin") {
  const a = humanAudit(before, platform), b = humanAudit(after, platform);
  const checks = Object.fromEntries(Object.keys(b.panel.checks).map((k) => [k, { before: a.panel.checks[k].score, after: b.panel.checks[k].score, delta: a.panel.checks[k].score === null || b.panel.checks[k].score === null ? null : b.panel.checks[k].score - a.panel.checks[k].score }]));
  const ra = new Set(a.issues.map((i) => i.rule)), rb = new Set(b.issues.map((i) => i.rule));
  return {
    score: { before: a.score, after: b.score, delta: b.score - a.score },
    panel: { before: a.panel.overall, after: b.panel.overall, delta: b.panel.overall - a.panel.overall, verdictBefore: a.panel.verdict, verdictAfter: b.panel.verdict },
    checks, fixed: [...ra].filter((r) => !rb.has(r)), introduced: [...rb].filter((r) => !ra.has(r)),
    voiceDropped: (checks.voice.delta ?? 0) < 0, before: a, after: b,
  };
}

// ---------- scrub: safe mechanical fixes only ----------
const URL_RE = /https?:\/\/\S+|www\.\S+|\S+@\S+\.\S+/g;
export function scrub(text) {
  const keep = [];
  const stash = (s) => { keep.push(s); return "\uE000" + (keep.length - 1) + "\uE001"; };
  let out = text.replace(URL_RE, stash);
  // protect emoji ZWJ sequences and subdivision flags before removing format chars
  out = out.replace(/\p{Extended_Pictographic}\uFE0F?(?:[\u{1F3FB}-\u{1F3FF}])?(?:\u200D\p{Extended_Pictographic}\uFE0F?(?:[\u{1F3FB}-\u{1F3FF}])?)+/gu, stash);
  out = out.replace(/\u{1F3F4}[\u{E0020}-\u{E007E}]+\u{E007F}/gu, stash);
  out = out.replace(HARD_SPACE, " ").replace(INVISIBLE, "").replace(/\p{Cf}/gu, (c) => (c === "\uE000" || c === "\uE001" ? c : ""));
  for (const re of FORENSIC) { re.lastIndex = 0; out = out.replace(re, ""); }
  out = out.replace(/[‘’′]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...").replace(/(\d)\s*–\s*(?=\d)/g, "$1-").replace(/\s+–\s+/g, ", ");
  const wc = words(out).length || 1; const cap = Math.max(1, Math.floor(wc / 100)); let seen = 0;
  out = out.replace(/\s*(—|--)\s*/g, () => (++seen <= cap ? " — " : ", "));
  out = out.replace(/,\s*([,.;:!?])/g, "$1").replace(/,\s*\n/g, "\n");
  out = out.replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return out.replace(/\uE000(\d+)\uE001/g, (_, i) => keep[+i]);
}

// ---------- hook formulas ----------
const BANK_FOR = { linkedin: "linkedin", x: "x", instagram: "shortform", youtube: "youtube", shortform: "shortform", shorts: "shortform" };
const COMPILED = Object.fromEntries(Object.entries(HOOK_BANKS).map(([k, b]) => [k, b.hooks.map((f) => ({ ...f, res: f.match.map((m) => rx(m, "iu")), rank: b.classify_order.indexOf(f.id) }))]));
export function hookBank(platform = "linkedin") { return HOOK_BANKS[BANK_FOR[platform] || "linkedin"]; }
export function hookById(id) {
  for (const b of Object.values(HOOK_BANKS)) { const f = b.hooks.find((x) => x.id === id); if (f) return f; }
  return null;
}

// Name the formula of a hook (or of a post: its first two lines). Most regex hits wins; ties go to the bank's classify_order.
export function classifyHook(text, platform = "linkedin", opts = {}) {
  const bank = BANK_FOR[opts.bank || platform] || "linkedin";
  const lines = String(text).trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const l1 = lines[0] || ""; const head = lines.slice(0, 2).join(" ");
  const scored = [];
  for (const f of COMPILED[bank]) {
    const hits = f.res.filter((re) => re.test(l1) || re.test(head)).length;
    if (hits) scored.push({ id: f.id, name: f.name, goal: f.goal, trap: f.trap, hits, rank: f.rank < 0 ? 999 : f.rank });
  }
  scored.sort((a, b) => b.hits - a.hits || a.rank - b.rank);
  if (!scored.length) return { id: null, name: "unclassified", trap: "No formula matched: usually a summary, not a hook. Unclassified hooks are also where new formulas hide.", goal: null, hits: 0, confidence: "none", alternatives: [] };
  const top = scored[0];
  const confidence = top.hits >= 2 ? "high" : scored.length > 1 && scored[1].hits === top.hits ? "low" : "medium";
  return { id: top.id, name: top.name, goal: top.goal, trap: top.trap, hits: top.hits, confidence, alternatives: scored.slice(1, 3).map((s) => s.id + " " + s.name) };
}

const DEALBREAKERS = [
  [/https?:\/\/|www\./i, "link in hook"], [/(^|\s)#[\p{L}\d_]+/u, "hashtag in hook"],
  [/^\s*(hey|hi|hello|gm|good morning|what'?s up|welcome)\b/i, "greeting opener"], [/\bstop scrolling\b/i, "stop-scrolling opener"],
  [/^\s*((a |quick )?thread\b|🧵)/iu, "thread label opener"], [/\b(in this (thread|video|post)|i'?m going to show you)\b/i, "preamble"],
  [/^\s*\d+\/\d+\b/, "thread counter first"],
];
const HOOK_FIX = {
  fold: "Cut line 1 until it fits the fold.", specificity: "Add a real number, name or date (ask the user; never invent).",
  brevity: "Aim for 5-18 words.", tension: "Add the stake: a cost, a mistake, a 'but', or what changed.",
  voice: "Say it in first person if it happened to the user.", clean: "Remove the cliche opener, bait question or slop word.",
};
export function hookScore(hook, platform = "linkedin") {
  const spec = PLATFORMS[platform] || PLATFORMS.linkedin;
  const h = hook.trim(); const w = words(h); const panel = {};
  const len = platform === "x" ? xWeightedLength(h) : [...h].length;
  panel.fold = len <= spec.fold ? 20 : len <= spec.fold * 1.5 ? 10 : 0;
  panel.specificity = clamp(4 + (/\b(most|every|only|never|isn't|aren't|doesn't|won't|not)\b/i.test(h) ? 4 : 0) + ((/\d/.test(h) ? 10 : 0) + (/[$₹%]|\b(hours?|days?|weeks?|months?|years?|minutes?)\b/i.test(h) ? 5 : 0) + (/\b[A-Z][a-z]+[A-Z]?\w*\b/.test(h.slice(1)) ? 5 : 0)), 0, 20);
  panel.brevity = w.length >= 5 && w.length <= 18 ? 15 : w.length <= 25 ? 8 : 0;
  panel.tension = /\b(but|instead|wrong|stopped|never|nobody|mistake|cost|failed|quit|without|actually|why)\b/i.test(h) ? 15 : 5;
  panel.voice = /\b(i|we|my|our)\b/i.test(h) ? 10 : 5;
  panel.clean = 20 - (CLICHE_OPEN.test(h) ? 12 : 0) - (/\?$/.test(h) && w.length < 7 ? 6 : 0) - (new RegExp(BAIT.source, "i").test(h) ? 10 : 0) - (markerHits(h).length ? 6 : 0);
  // Weakest-link weighting (Jakeschincariol hookscore.py): 60% mean + 40% weakest, each property normalised to 0-100; -15 per dealbreaker.
  const max = { fold: 20, specificity: 20, brevity: 15, tension: 15, voice: 10, clean: 20 };
  const norm = Object.fromEntries(Object.entries(panel).map(([k, v]) => [k, clamp((Math.max(0, v) / max[k]) * 100)]));
  const vals = Object.values(norm); const m = mean(vals);
  const weakest = Object.entries(norm).sort((a, b) => a[1] - b[1])[0];
  const dealbreakers = DEALBREAKERS.filter(([re]) => re.test(h)).map(([, d]) => d);
  const score = clamp(0.6 * m + 0.4 * weakest[1] - 15 * dealbreakers.length);
  const formula = classifyHook(h, platform);
  return { hook: h, score, verdict: score >= 70 && weakest[1] >= 55 && !dealbreakers.length ? "STRONG" : score >= 50 ? "OK" : "WEAK",
    panel: norm, weakest: weakest[0], fix: HOOK_FIX[weakest[0]], dealbreakers, chars: len, foldLimit: spec.fold,
    formula: formula.id, formulaName: formula.name, trap: formula.trap };
}

export function rankHooks(hooks, platform) {
  return hooks.filter((h) => h.trim()).map((h) => hookScore(h, platform)).sort((a, b) => b.score - a.score);
}

// ---------- X weighted length (twitter-text v3) ----------
const X_URL = /(?:https?:\/\/[^\s]+|\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|ai|dev|app|co|me|ly|gg|tv|xyz|in|uk|us|de|fr|jp|edu|gov|info|biz|so|sh|to|fm|news|blog|tech|site|online|store|page|link|club|design|studio|cloud)(?:\/[^\s]*)?)/gi;
const SEG = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("en", { granularity: "grapheme" }) : null;
const lightCp = (cp) => (cp >= 0 && cp <= 4351) || (cp >= 8192 && cp <= 8205) || (cp >= 8208 && cp <= 8223) || (cp >= 8242 && cp <= 8247);
const isEmojiCluster = (g) => /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/u.test(g);
export function xWeightedLength(text, opts = {}) {
  const urlW = opts.urlWeight ?? PLATFORMS.x.urlWeight ?? 23;
  let t = String(text).normalize("NFC"); let n = 0;
  t = t.replace(X_URL, () => { n += urlW; return ""; });
  const graphemes = SEG ? [...SEG.segment(t)].map((s) => s.segment) : [...t];
  for (const g of graphemes) {
    if (isEmojiCluster(g)) { n += 2; continue; }
    for (const ch of g) n += lightCp(ch.codePointAt(0)) ? 1 : 2;
  }
  return n;
}
const graphemeSlice = (text, n) => { const g = SEG ? [...SEG.segment(text)].map((s) => s.segment) : [...text]; return g.slice(0, n).join(""); };

// ---------- fold preview ----------
const FOLDS = { linkedin: [["mobile", 140], ["desktop", 210]], x: [["show-more", 280]], instagram: [["feed", 125]], youtube: [["description", 150]] };
export function foldPreview(text, platform = "linkedin") {
  const t = text.trim(); const cuts = FOLDS[platform] || [["fold", PLATFORMS[platform]?.fold || 140]];
  const weighted = platform === "x";
  const total = weighted ? xWeightedLength(t) : [...t].length;
  return { platform, length: total, cuts: cuts.map(([name, n]) => {
    if (total <= n) return { name, at: n, status: "clean", fits: true, visible: t };
    let vis;
    if (weighted) { let lo = 0; const g = SEG ? [...SEG.segment(t)].map((s) => s.segment) : [...t]; let acc = ""; for (const s of g) { if (xWeightedLength(acc + s) > n) break; acc += s; lo++; } vis = acc; }
    else vis = graphemeSlice(t, n);
    const rest = t.slice(vis.length); const prev = vis.slice(-1), next = rest.slice(0, 1);
    const status = /[.!?:]["')]?$/.test(vis.trimEnd()) && (/\s/.test(next) || next === "") || next === "\n" || /\n\s*$/.test(vis) ? "clean"
      : /[\p{L}\d]/u.test(prev) && /[\p{L}\d]/u.test(next) ? "mid-word" : "mid-idea";
    const firstLineFits = (weighted ? xWeightedLength(firstLine(t)) : [...firstLine(t)].length) <= n;
    return { name, at: n, status, fits: false, firstLineFits, visible: vis + "… see more" };
  }) };
}

// ---------- platform rules ----------
const ASKS = [/\bcomment ['"]?[A-Z]{3,}['"]?\b/, /\bdm me\b/i, /\bsave (this|it)\b/i, /\bshare (this|it)\b/i, /\bfollow (me|for)\b/i, /\blink in (bio|comments?)\b/i, /\b(swipe|tap)\b/i, /\b(tell me|which one)\b/i];
export function platformCheck(text, platform = "linkedin", opts = {}) {
  const spec = PLATFORMS[platform]; if (!spec) throw new Error("unknown platform " + platform);
  const issues = []; const len = platform === "x" ? xWeightedLength(text) : [...text].length;
  const max = opts.premium && spec.premiumMaxChars ? spec.premiumMaxChars : spec.maxChars;
  if (len > max) issues.push({ severity: "block", rule: "length", detail: len + (platform === "x" ? " weighted" : "") + " chars, limit " + max });
  else if (len < spec.idealMin) issues.push({ severity: "low", rule: "length", detail: len + " chars, working range " + spec.idealMin + "-" + spec.idealMax });
  else if (len > spec.idealMax && !(platform === "x" && opts.premium)) issues.push({ severity: "medium", rule: "length", detail: len + " chars, working range " + spec.idealMin + "-" + spec.idealMax });
  const tags = text.match(/(^|\s)#[\p{L}\d_]+/gu) || [];
  if (platform === "youtube" && tags.length > (spec.hashtagIgnoreAbove || 15)) issues.push({ severity: "high", rule: "hashtags", detail: tags.length + " hashtags: over 15 and YouTube ignores all of them (official)" });
  else if (tags.length > spec.maxHashtags) issues.push({ severity: "medium", rule: "hashtags", detail: tags.length + " hashtags, max " + spec.maxHashtags });
  const links = text.match(/https?:\/\/\S+/g) || [];
  if (links.length && spec.linkInBody === "warn") issues.push({ severity: "medium", rule: "link-in-body", detail: "outbound links: put in first comment/reply (reach penalty is folklore; cheap hedge)" });
  if (links.length && spec.linkInBody === "dead") issues.push({ severity: "high", rule: "link-in-body", detail: "links are not clickable in captions; use bio/story/DM keyword" });
  const first = firstLine(text);
  const firstLen = platform === "x" ? xWeightedLength(first) : [...first].length;
  if (spec.lineBreaks && paragraphs(text).some((p) => p.split("\n").join(" ").length > 320)) issues.push({ severity: "medium", rule: "wall-of-text", detail: "a paragraph exceeds ~320 chars; break it up" });
  if (firstLen > spec.fold) issues.push({ severity: "medium", rule: "hook-fold", detail: "line 1 is " + firstLen + " chars; fold is ~" + spec.fold });
  if (platform === "x") {
    if (firstLen > (spec.hookMaxWeighted || 110) && firstLen <= spec.fold) issues.push({ severity: "low", rule: "first-line", detail: "line 1 is " + firstLen + " weighted; keep it <= ~110" });
    if (/https?:\/\/|(^|\s)[#@]\w/.test(first)) issues.push({ severity: "medium", rule: "first-line", detail: "link, hashtag or @ in line 1" });
    if (len > 280) { const at = text.search(/(^|\s)@\w/); if (at >= 0 && xWeightedLength(text.slice(0, at)) > 280) issues.push({ severity: "medium", rule: "mentions", detail: "a mention sits past weighted char 280; it will not notify" }); }
    if (/—|--/.test(text)) issues.push({ severity: "low", rule: "em-dash", detail: "em dash on X reads as AI to many readers; use a comma or period" });
  }
  if (platform === "instagram") {
    if (/^\s*[#@]/.test(text) || !first.trim()) issues.push({ severity: "high", rule: "first-line", detail: "line 1 is blank or starts with #/@" });
    const filler = tags.map((t) => t.trim().toLowerCase()).filter((t) => (spec.fillerTags || []).includes(t));
    if (filler.length) issues.push({ severity: "medium", rule: "filler-tags", detail: "filler hashtags: " + filler.join(" ") });
    if (tags.some((t) => text.indexOf(t.trim()) < spec.fold)) issues.push({ severity: "low", rule: "tag-placement", detail: "hashtag inside the visible caption window" });
    const asks = ASKS.filter((r) => r.test(text)).length;
    if (asks > 1) issues.push({ severity: "medium", rule: "one-ask", detail: asks + " different asks; keep one" });
    const em = (text.match(/\p{Extended_Pictographic}/gu) || []).length;
    if (em / Math.max(len, 1) * 100 > (spec.emojiPer100Max || 4)) issues.push({ severity: "low", rule: "emoji-density", detail: em + " emoji in " + len + " chars" });
  }
  return { length: len, weighted: platform === "x", hashtags: tags.length, links: links.length, issues };
}

// ---------- evidence ----------
const NUM_RE = /(?<![\w/])[$₹€£]?\d[\d,]*(?:\.\d+)?(?:%|x\b|k\b)?/gi;
const normNum = (s) => s.toLowerCase().replace(/[$₹€£,]/g, "").replace(/\.0+$/, "").replace(/(%|x|k)$/, "");
export function numbersIn(text) {
  const out = [];
  const clean = text.replace(/https?:\/\/\S+/g, " ");
  for (const line of clean.split("\n")) {
    const l = line.replace(/^\s*\d+[.)]\s+/, " ").replace(/\b\d+\/\d+\b/g, " ");
    for (const m of l.match(NUM_RE) || []) out.push(m);
  }
  return out;
}
// Claims with numbers need a source or first-hand label; [CONFIRM:]/[ADD:] markers always block; with notes, every number must appear in the notes.
export function evidenceCheck(text, sources = [], kind = "", opts = {}) {
  const claims = (text.match(/[^.\n]*\b\d[\d,.]*\s*(%|x|percent|million|billion|k\b|users|hours|days|\$)[^.\n]*/gi) || []).map((s) => s.trim());
  const markers = [...new Set(text.match(MARKERS) || [])];
  let missingNumbers = [];
  if (opts.notes != null) {
    const have = new Set(numbersIn(opts.notes).map(normNum));
    missingNumbers = [...new Set(numbersIn(text))].filter((n) => !have.has(normNum(n)));
  }
  const sourced = !claims.length || sources.length > 0 || kind === "firsthand";
  const ok = sourced && !markers.length && !missingNumbers.length;
  const why = [];
  if (!sourced) why.push("numeric claims without a source or firsthand label");
  if (markers.length) why.push("unresolved markers: " + markers.join(", "));
  if (missingNumbers.length) why.push("numbers not found in notes: " + missingNumbers.join(", "));
  return { claims, sources, kind, markers, missingNumbers, notesChecked: opts.notes != null, pass: ok, detail: ok ? "ok" : why.join("; ") };
}

export function gate(text, platform = "linkedin", opts = {}) {
  const human = humanAudit(text, platform, opts);
  const plat = platformCheck(text, platform, opts);
  const hook = hookScore(firstLine(text), platform);
  const evidence = evidenceCheck(text, opts.sources || [], opts.evidenceKind || "", { notes: opts.notes });
  const blocks = [
    ...human.issues.filter((i) => i.severity === "block").map((i) => i.detail),
    ...plat.issues.filter((i) => i.severity === "block").map((i) => i.detail),
    ...(evidence.pass ? [] : [evidence.detail]),
  ];
  const minHuman = opts.minHuman ?? 80, minHook = opts.minHook ?? 60;
  if (human.score < minHuman) blocks.push("human score " + human.score + " < " + minHuman);
  const warnings = [];
  const p = human.panel;
  // Panel blocks only on the lexical checks (slop, fingerprint). Burstiness, voice and specificity are style signals:
  // calibration on the user's 12 published human posts (formal register, no contractions) scored them FLAGGED, so they warn.
  const lexWeak = ["slop", "fingerprint"].filter((k) => p.checks[k].score !== null && p.checks[k].score < 55);
  if (p.verdict === "FLAGGED" && lexWeak.length) blocks.push("human panel FLAGGED (" + p.overall + "): weak " + lexWeak.join(", ") + ". " + p.checks[lexWeak[0]].fix);
  else if (p.verdict !== "PASS") warnings.push("human panel " + p.verdict + " (" + p.overall + "): weakest is " + p.weakest + ". " + p.fix);
  if (hook.score < (opts.blockHook ?? 45)) blocks.push("hook score " + hook.score + " < " + (opts.blockHook ?? 45));
  else if (hook.score < minHook) warnings.push("hook score " + hook.score + " < " + minHook + ": weakest is " + hook.weakest);
  if (hook.dealbreakers.length) warnings.push("hook dealbreakers: " + hook.dealbreakers.join(", "));
  if (hook.formula) warnings.push("formula " + hook.formula + " " + hook.formulaName + ": check the trap, " + hook.trap);
  return { platform, pass: blocks.length === 0, blocks, warnings, weakest: p.weakest, human, platformCheck: plat, hook, evidence };
}

// ---------- X thread ----------
// Split priority: explicit '---' lines, then paragraphs, then sentences, words only as a last resort. Returns string[] (v1 contract).
export function toThread(text, limit = 280, opts = {}) {
  const number = opts.number !== false; const reserve = number ? 7 : 0; const room = limit - reserve;
  const L = (s) => xWeightedLength(s);
  const blocks = /^\s*---\s*$/m.test(text) ? text.split(/^\s*---\s*$/m) : text.split(/\n\s*\n/);
  const units = [];
  for (const b of blocks.map((x) => x.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean)) {
    if (L(b) <= room) { units.push(b); continue; }
    for (const s of b.split(/(?<=[.!?])\s+/)) {
      if (L(s) <= room) { units.push(s); continue; }
      let cur = ""; for (const w of s.split(/\s+/)) { if (L((cur + " " + w).trim()) > room - 1) { units.push(cur + "…"); cur = w; } else cur = (cur + " " + w).trim(); }
      if (cur) units.push(cur);
    }
  }
  const parts = []; let cur = "";
  for (const u of units) { const joined = cur ? cur + " " + u : u; if (L(joined) <= room) cur = joined; else { if (cur) parts.push(cur); cur = u; } }
  if (cur) parts.push(cur);
  if (parts.length <= 1 || !number) return parts;
  return parts.map((p, i) => p + " " + (i + 1) + "/" + parts.length);
}
export function threadLint(parts) {
  const issues = []; const n = parts.length;
  if (n < 3) issues.push({ severity: "low", rule: "count", detail: n + " posts: that is a post, not a thread" });
  if (n > 15) issues.push({ severity: "medium", rule: "count", detail: n + " posts; over 15 loses readers" });
  parts.forEach((p, i) => { const l = xWeightedLength(p); if (l > 280) issues.push({ severity: "block", rule: "length", detail: "post " + (i + 1) + " is " + l + " weighted" }); });
  if (/^\s*((a |quick )?thread\b|🧵)/iu.test(parts[0] || "") || xWeightedLength(firstLine(parts[0] || "")) > 110) issues.push({ severity: "medium", rule: "post-1", detail: "post 1 opens with a label or line 1 is over ~110 weighted" });
  if (parts.slice(0, -1).some((p) => /https?:\/\//.test(p))) issues.push({ severity: "low", rule: "links", detail: "link before the last post" });
  if (parts.some((p) => /…\s*\d+\/\d+$/.test(p))) issues.push({ severity: "medium", rule: "mid-sentence", detail: "a sentence was split across posts; edit by hand" });
  if (n >= 4 && parts.filter((p) => xWeightedLength(p) >= 238).length / n > 0.6) issues.push({ severity: "low", rule: "pace", detail: "most posts are near the limit; vary length" });
  if (n > 1 && !/\?|follow|bookmark|repost|reply|comment|subscribe|join|try it|steal/i.test(parts[n - 1])) issues.push({ severity: "low", rule: "ending", detail: "last post has no ask or question (fine if it ends on a flat true line)" });
  return issues;
}

// ---------- reel / short / LinkedIn video timing ----------
const STOP = new Set("a an and are as at be but by for from has have i if in is it its it's of on or so that the this to was we were what when with you your my our me they them their there here how why not do does did just than then into about".split(" "));
const CONCRETE_RE = /\$\s?\d|\b\d[\d,.]*\b|(?<!^)\b[A-Z][a-z]{2,}\b/;
const CTA_RE = /\b(follow|save|share|send|comment|subscribe|link in bio|dm me|tell me|try it|steal|grab|download|watch (the|my)|part 2)\b/i;
const spokenWords = (s) => (s.replace(/\[[^\]]*\]|\([^)]*\)/g, " ").match(/[$₹€£]?\d[\d,.]*%?|[\p{L}'’-]+/gu) || []);
export function reelBeats(script, opts = {}) {
  const platform = opts.platform || "instagram";
  const vs = platform === "youtube" ? PLATFORMS.youtube.video.shorts : platform === "linkedin" ? PLATFORMS.linkedin.video : platform === "x" ? PLATFORMS.x.video : PLATFORMS.instagram.video;
  const wps = opts.wps || (opts.wpm ? opts.wpm / 60 : vs.wps || 2.5);
  const hookMax = vs.hookMaxSec || 3, beatMax = vs.beatMaxSec || 4;
  const raw = script.split("\n").map((l) => l.trim()).filter((l) => l && !/^#/.test(l));
  const beats = []; let t = 0;
  const push = (line) => { const n = spokenWords(line).length; const pause = (line.match(/\(beat\)|\(pause\)/gi) || []).length * 0.5; const d = n / wps + pause; beats.push({ text: line, words: n, start: +t.toFixed(2), end: +(t + d).toFixed(2), seconds: +d.toFixed(2), onScreen: (line.match(/\[ON SCREEN:[^\]]*\]/i) || [null])[0] }); t += d; };
  for (const line of raw) {
    const n = spokenWords(line).length;
    if (n / wps <= 6 || !/[.!?]\s/.test(line)) { push(line); continue; }
    let chunk = ""; for (const s of line.split(/(?<=[.!?])\s+/)) { if (chunk && spokenWords(chunk + " " + s).length / wps > beatMax) { push(chunk); chunk = s; } else chunk = (chunk + " " + s).trim(); }
    if (chunk) push(chunk);
  }
  const flags = [];
  if (!beats.length) return { platform, wps, total: 0, beats, flags: [{ severity: "block", rule: "empty", detail: "no script lines" }], pass: false };
  beats.forEach((b, i) => { b.label = i === 0 || b.end <= hookMax ? "HOOK" : i === beats.length - 1 && CTA_RE.test(b.text) ? "CTA" : "MID"; });
  const h = beats[0];
  if (h.seconds > hookMax) flags.push({ severity: "high", rule: "hook-length", detail: "hook runs " + h.seconds + " s; cut to " + Math.floor(hookMax * wps) + " words (<= " + hookMax + " s)" });
  if (!CONCRETE_RE.test(h.text)) flags.push({ severity: "medium", rule: "hook-concrete", detail: "beat 1 has no number, name or price" });
  beats.forEach((b, i) => { if (b.seconds > beatMax) flags.push({ severity: "medium", rule: "beat-gap", detail: "beat " + (i + 1) + " runs " + b.seconds + " s with no new element; cut or add a visual change (<= " + beatMax + " s)" }); });
  let run = 0; beats.forEach((b, i) => { run = CONCRETE_RE.test(b.text) ? 0 : run + 1; if (run === 3) flags.push({ severity: "low", rule: "abstract-run", detail: "beats " + (i - 1) + "-" + (i + 1) + " are abstract; add a number, name or on-screen proof" }); });
  const kw = (s) => new Set(spokenWords(s).map((w) => w.toLowerCase()).filter((w) => w.length > 2 && !STOP.has(w)));
  const a = kw(h.text), z = kw(beats[beats.length - 1].text);
  const loop = [...a].filter((w) => z.has(w));
  if (beats.length > 1 && !loop.length) flags.push({ severity: "low", rule: "loop", detail: "last beat shares no word with the hook; a loop line helps rewatch (craft)" });
  const ctaIdx = beats.map((b, i) => (CTA_RE.test(b.text) ? i : -1)).filter((i) => i >= 0);
  if (ctaIdx.length && ctaIdx[ctaIdx.length - 1] !== beats.length - 1) flags.push({ severity: "medium", rule: "cta-last", detail: "CTA is not the last beat" });
  if (ctaIdx.length > 1) flags.push({ severity: "low", rule: "one-ask", detail: ctaIdx.length + " CTA beats; keep one" });
  const total = +t.toFixed(1);
  let target = null;
  if (opts.target) {
    const T = Number(opts.target); const diff = total - T; const wordsDiff = Math.round(Math.abs(diff) * wps);
    target = { seconds: T, delta: +diff.toFixed(1), withinTenPercent: Math.abs(diff) <= T * 0.1 };
    if (!target.withinTenPercent) flags.push({ severity: diff > 0 ? "medium" : "low", rule: "target", detail: (diff > 0 ? "cut " : "add ") + wordsDiff + " words to hit " + T + " s (short is usually right)" });
  }
  const max = vs.maxSec || vs.recommendedMaxSec;
  if (max && total > max) flags.push({ severity: "high", rule: "max-length", detail: total + " s over the " + max + " s limit for " + platform });
  return { platform, wps, total, words: beats.reduce((s, b) => s + b.words, 0), beats, loopWords: loop, target, flags, pass: !flags.some((f) => f.severity === "high" || f.severity === "block") };
}

// ---------- YouTube title + thumbnail ----------
const TITLE_STOP = new Set("a an the and or of to in on for with is are was my your how why what this that i you it".split(" "));
const VAGUE = /\b(insane|ultimate|secret|game-?changer|amazing|crazy|epic|everything you need|must watch|shocking|unbelievable)\b/i;
export function titleLint(title = "", thumb = "") {
  const yt = PLATFORMS.youtube; const issues = []; const good = []; const t = title.trim(); const n = [...t].length;
  if (n > yt.titleMax) issues.push({ severity: "block", rule: "length", detail: n + " chars, hard limit " + yt.titleMax + " (official)" });
  else if (n > yt.titleDesktop) issues.push({ severity: "medium", rule: "desktop-cut", detail: n + " chars; desktop search cuts near " + yt.titleDesktop });
  else good.push("within " + yt.titleDesktop);
  const mobile = n > yt.titleMobile ? t.slice(0, t.lastIndexOf(" ", yt.titleMobile) > 0 ? t.lastIndexOf(" ", yt.titleMobile) : yt.titleMobile) + "…" : t;
  if (n > yt.titleMobile) issues.push({ severity: "low", rule: "mobile-cut", detail: "mobile feed shows ~\"" + mobile + "\": the subject must be in it" });
  const caps = (t.match(/\b[A-Z]{3,}\b/g) || []).length;
  if (caps > yt.maxCapsWords) issues.push({ severity: "medium", rule: "caps", detail: caps + " all-caps words, max " + yt.maxCapsWords });
  else if (caps) good.push("caps for emphasis");
  if (VAGUE.test(t)) issues.push({ severity: "medium", rule: "vague", detail: "\"" + t.match(VAGUE)[0] + "\": use a number, name or date" });
  if (/\d/.test(t)) good.push("has a figure"); else issues.push({ severity: "low", rule: "no-number", detail: "no number, name-year or date" });
  const w = t.toLowerCase().split(/\s+/).filter(Boolean);
  if (w.length >= 3 && w.slice(0, 3).every((x) => TITLE_STOP.has(x.replace(/[^a-z]/g, "")))) issues.push({ severity: "low", rule: "front-load", detail: "first three words are filler; front-load the subject" });
  if (thumb) {
    const tw = thumb.toLowerCase().match(/[\p{L}\d]+/gu) || [];
    const shared = tw.filter((x) => !TITLE_STOP.has(x) && w.map((y) => y.replace(/[^\p{L}\d]/gu, "")).includes(x));
    if (shared.length) issues.push({ severity: "medium", rule: "duplicate", detail: "thumbnail repeats title words: " + [...new Set(shared)].join(", ") + " (different words, same promise)" });
    else good.push("thumbnail distinct");
    if (tw.length > yt.thumbMaxWords) issues.push({ severity: "medium", rule: "thumb-words", detail: tw.length + " thumbnail words, max " + yt.thumbMaxWords });
  }
  const formula = classifyHook(t, "youtube");
  const score = clamp(100 - 14 * issues.filter((i) => i.severity !== "low").length - 6 * issues.filter((i) => i.severity === "low").length + 4 * good.length);
  return { title: t, thumb, chars: n, mobileVisible: mobile, score, issues, good, formula: formula.id, formulaName: formula.name, pairing: formula.id ? hookById(formula.id).pairing : null, pass: !issues.some((i) => i.severity === "block") };
}

// ---------- chapters ----------
const toSec = (s) => s.split(":").map(Number).reduce((a, b) => a * 60 + b, 0);
export function chapterCheck(text, opts = {}) {
  const rows = [];
  for (const line of text.split("\n")) { const m = line.match(/^\s*[-•*]?\s*\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?\s*[-–—:|]?\s*(.+?)\s*$/); if (m) rows.push({ time: m[1], seconds: toSec(m[1]), title: m[2] }); }
  const issues = [];
  if (!rows.length) return { chapters: [], issues: [{ severity: "block", rule: "none", detail: "no timestamps found" }], pass: false };
  if (rows[0].seconds !== 0) issues.push({ severity: "block", rule: "first-zero", detail: "first chapter must be 0:00, got " + rows[0].time });
  if (rows.length < 3) issues.push({ severity: "block", rule: "min-count", detail: rows.length + " chapters; YouTube needs at least 3" });
  rows.forEach((r, i) => {
    if (i && r.seconds <= rows[i - 1].seconds) issues.push({ severity: "block", rule: "order", detail: r.time + " is not after " + rows[i - 1].time });
    const next = i < rows.length - 1 ? rows[i + 1].seconds : opts.duration;
    if (next != null && next - r.seconds < 10) issues.push({ severity: "block", rule: "min-length", detail: "\"" + r.title + "\" (" + r.time + ") is under 10 s" });
    if (words(r.title).length > 8) issues.push({ severity: "low", rule: "title-length", detail: "\"" + r.title + "\": retitle as the section's promise in 3-5 words" });
  });
  return { chapters: rows, issues, pass: !issues.some((i) => i.severity === "block"), rules: "official: first at 0:00, >= 3, each >= 10 s" };
}

// ---------- research: outliers ----------
// rows: [{account, url, views, text?, format?, followers?}] -> multiple vs the account's own median. Accounts under minPosts are listed as thin.
export function outliers(rows, threshold = 3, opts = {}) {
  const minPosts = opts.minPosts ?? 5; const platform = opts.platform || "linkedin";
  const by = {};
  for (const r of rows) { const v = Number(String(r.views).replace(/,/g, "")); if (!r.account || !Number.isFinite(v)) continue; (by[r.account] ||= []).push({ ...r, views: v }); }
  const out = [];
  for (const [account, list] of Object.entries(by)) {
    const med = median(list.map((r) => r.views)) || 1;
    for (const r of list) {
      const f = Number(String(r.followers ?? "").replace(/,/g, ""));
      const cls = r.text ? classifyHook(r.text, r.platform || platform) : null;
      out.push({ ...r, median: med, multiple: +(r.views / med).toFixed(2), signal: list.length >= minPosts && r.views / med >= threshold, noise: r.views / med < 1.5, sampleSize: list.length, thin: list.length < minPosts,
        reach: Number.isFinite(f) && f > 0 ? +(r.views / f).toFixed(2) : undefined, formula: cls?.id ?? undefined, formulaName: cls?.name ?? undefined });
    }
  }
  return out.sort((a, b) => b.multiple - a.multiple);
}
export function outlierSummary(list) {
  const thin = [...new Set(list.filter((r) => r.thin).map((r) => r.account + " (" + r.sampleSize + ")"))];
  const sig = list.filter((r) => r.signal);
  const formulas = {}; for (const r of sig) { const k = r.formula ? r.formula + " " + r.formulaName : "unclassified"; formulas[k] = (formulas[k] || 0) + 1; }
  return { accounts: new Set(list.map((r) => r.account)).size, rows: list.length, signals: sig.length, thinAccounts: thin, formulasAmongSignals: formulas,
    note: "Outliers are correlation, not proof that the wording caused the views. Unclassified signals are where new formulas hide." };
}

// ---------- research: audience pain (port of Jakeschincariol replica reviews.py) ----------
const PAIN = {
  pricing: /\b(expensive|overpriced|pric(e|es|ey|ing)|paywall|subscription|per (month|seat|user)|free (plan|tier|version)|upgrade to|premium|not worth|cost(s|ly)?)\b/i,
  billing: /\b(charged|refund|cancel\w*|auto.?renew|hidden (fee|charge)|billing|scam|credit card)\b/i,
  bugs: /\b(crash\w*|bugs?|buggy|glitch\w*|freez\w*|broken|(doesn'?t|does not|stopped) work\w*|not working|error)\b/i,
  performance: /\b(slow|lag(gy|s)?|loading|takes forever|battery|sluggish|heavy)\b/i,
  data: /\b(sync\w*|lost (my|all)|disappear\w*|data loss|wiped|backup|duplicat\w*)\b/i,
  ux: /\b(confus\w*|hard to (use|find|navigate|understand)|complicated|cluttered|unintuitive|not intuitive|clunky|too many (steps|clicks|taps)|learning curve|can'?t find)\b/i,
  support: /\b(customer (service|support)|support (team|is|was)|no (response|reply)|never (replied|responded|heard back)|ticket|chat ?bot)\b/i,
  account: /\b(log ?in|sign ?in|password|locked out|verification|2fa|delete (my )?account)\b/i,
  notifications: /\b(notifications?|spam|too many emails|push|reminders?)\b/i,
  ads: /\b(ads|advert\w*|ad.?supported|pop.?ups?)\b/i,
  updates: /\b((new|latest|recent) (update|version|design)|redesign|used to be|bring back|since the update)\b/i,
  privacy: /\b(privacy|tracking|sell(s|ing)? (my )?data|permissions?|creepy)\b/i,
  confusion: /\b(i don'?t (get|understand)|what does .{1,30} mean|how do (i|you)|is there a way|anyone know|explain)\b/i,
  trust: /\b(hype|overhyped|marketing|fake|misleading|clickbait|grift|snake oil|not (true|accurate)|hallucinat\w*|made up)\b/i,
};
const REQUEST = {
  integrations: /\b(integrat\w*|zapier|google (calendar|sheets|drive)|outlook|slack|api|export|import|csv|webhook)\b/i,
  platforms: /\b(offline|android|ipad|tablet|desktop app|mac app|windows|mobile (app|version)|web version)\b/i,
  customisation: /\b(customi[sz]\w*|dark mode|themes?|branding|white.?label|templates?|settings?|option to)\b/i,
  collaboration: /\b(team(s|mates?)?|shar(e|ing)|collaborat\w*|multiple (users|accounts|people)|roles?)\b/i,
  tutorial: /\b(tutorial|walkthrough|step.by.step|example|guide|course|video on)\b/i,
};
const REQ_PAT = /\b(i wish|please add|would be (nice|great|good|helpful)|would love|needs? (a|an|the|to|more)|no way to|there'?s no (way|option)|(can'?t|cannot|unable to) (even )?(add|change|edit|set|choose|export|import|customi[sz]e|connect|undo|delete|turn off)|missing|lacks|lacking|doesn'?t (have|support|let|allow)|if only|feature request|why (can'?t|isn'?t|doesn'?t)|can you (make|do|cover)|do a video on|part 2)\b/i;
export function painThemes(rows, opts = {}) {
  const months = opts.months ?? 18; const now = opts.now ? new Date(opts.now) : new Date();
  const seen = new Set(); let dropped = 0, dupes = 0; const kept = [];
  for (const r of rows) {
    const text = String(r.text || "").trim(); const url = String(r.url || "").trim();
    if (!text || !/^https?:\/\//.test(url)) { dropped++; continue; }
    const key = text.toLowerCase().replace(/\W+/g, " ").trim(); if (seen.has(key)) { dupes++; continue; } seen.add(key);
    const rating = Number(r.rating); const likes = Number(r.likes);
    let w = Number.isFinite(rating) && r.rating !== "" && r.rating != null ? (6 - rating) / 5 : 0.6;
    if (Number.isFinite(likes) && likes > 0) w *= 1 + Math.log10(1 + likes);
    if (r.date && (now - new Date(r.date)) / 864e5 > months * 30.4) w *= 0.5;
    kept.push({ ...r, text, url, weight: w });
  }
  const sentenceAround = (t, re) => { const s = t.split(/(?<=[.!?])\s+|\n+/).find((x) => re.test(x)) || t; return s.length > 220 ? s.slice(0, 217) + "..." : s; };
  const build = (themes) => Object.entries(themes).map(([theme, re]) => {
    const hits = kept.filter((r) => re.test(r.text)); if (!hits.length) return null;
    const sources = [...new Set(hits.map((h) => h.source || "unknown"))];
    return { theme, score: +hits.reduce((a, h) => a + h.weight, 0).toFixed(2), count: hits.length, share: +(100 * hits.length / kept.length).toFixed(1), sources,
      thin: hits.length < 3 || sources.length < 2,
      quotes: hits.sort((a, b) => b.weight - a.weight || a.text.length - b.text.length).slice(0, 3).map((h) => ({ quote: sentenceAround(h.text, re), url: h.url, source: h.source })) };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  const complaints = build(PAIN), requestThemes = build(REQUEST);
  const requests = kept.filter((r) => REQ_PAT.test(r.text)).slice(0, 25).map((r) => ({ quote: sentenceAround(r.text, REQ_PAT), url: r.url }));
  const allRe = [...Object.values(PAIN), ...Object.values(REQUEST)];
  const readByHand = kept.filter((r) => !allRe.some((re) => re.test(r.text))).sort((a, b) => b.weight - a.weight).slice(0, 15).map((r) => ({ text: r.text.slice(0, 220), url: r.url }));
  const warnings = [];
  if (kept.length < 30) warnings.push(kept.length + " items: supports a direction, not a ranking");
  if (dropped) warnings.push(dropped + " rows dropped (no http(s) url or no text)");
  return { items: kept.length, dropped, duplicates: dupes, complaints, requestThemes, requests, readByHand, warnings,
    angle: "For {who} who {top complaint}, {user} {does this instead}. Evidence: {theme}, {n} items across {n} sources.",
    note: "Quotes are verbatim and linked. Commenters are research, never testimonials." };
}

// ---------- thread duplication (user's prior X rubric) ----------
const tokenSet = (s) => new Set(words(s).filter((w) => w.length > 2 && !STOP.has(w)));
export function overlap(a, b) { const A = tokenSet(a), B = tokenSet(b); if (!A.size || !B.size) return 0; let n = 0; for (const x of A) if (B.has(x)) n++; return +(n / Math.min(A.size, B.size)).toFixed(2); }
export function commentOverlap(draft, visible = [], threshold = 0.72) {
  const scores = visible.map((v) => ({ text: v.slice(0, 120), overlap: overlap(draft, v) })).sort((a, b) => b.overlap - a.overlap);
  return { duplicate: !!scores.length && scores[0].overlap >= threshold, threshold, top: scores.slice(0, 3) };
}

// ---------- log, stats, caps ----------
export const LOG_HEADER = ["date", "platform", "status", "hook", "first_line", "url", "impressions", "likes", "comments", "saves", "shares", "action", "formula", "format", "chars", "followers"];
export function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  const t = String(text).replace(/^\uFEFF/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
    if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((x) => x.trim() !== ""));
  if (!nonEmpty.length) return [];
  const head = nonEmpty[0].map((h) => h.trim().toLowerCase());
  return nonEmpty.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}
export const csvRow = (vals) => vals.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",");
export function localDate(d = new Date(), tz = TIMEZONE) { return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d); }
export function logRow(text, platform = "linkedin", opt = {}) {
  const fl = firstLine(text);
  const formula = opt.formula || classifyHook(text, platform).id || "";
  const rec = { date: opt.date || localDate(), platform, status: opt.status || "approved", hook: hookScore(fl, platform).score, first_line: fl.slice(0, 120), url: opt.url, impressions: opt.impressions, likes: opt.likes, comments: opt.comments, saves: opt.saves, shares: opt.shares,
    action: opt.action || "post", formula, format: opt.format || "text", chars: platform === "x" ? xWeightedLength(text) : [...text].length, followers: opt.followers };
  return { record: rec, line: csvRow(LOG_HEADER.map((k) => rec[k])) };
}

const num = (v) => { const n = Number(String(v ?? "").replace(/,/g, "")); return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : null; };
const lengthBucket = (r) => { const c = num(r.chars); if (c == null) return "unknown"; const p = r.platform; const lim = p === "x" ? [100, 200] : p === "instagram" ? [300, 900] : [600, 1300]; return c < lim[0] ? "short (<" + lim[0] + ")" : c <= lim[1] ? "mid (" + lim[0] + "-" + lim[1] + ")" : "long (>" + lim[1] + ")"; };
export function stats(rows, opts = {}) {
  const posted = rows.filter((r) => r.status === "posted" && (r.action || "post") === "post" && (!opts.platform || r.platform === opts.platform));
  const eng = (r) => ["likes", "comments", "saves", "shares"].reduce((a, k) => a + (num(r[k]) || 0), 0);
  const per = posted.map((r) => { const imp = num(r.impressions); const f = num(r.followers); return { ...r, impressions: imp, engagements: eng(r), er: imp ? 100 * eng(r) / imp : null, reach: imp && f ? imp / f : null, commentRatio: num(r.likes) ? (num(r.comments) || 0) / num(r.likes) : null }; });
  const conf = (n) => (n >= 30 ? "medium" : n >= 10 ? "low" : "none");
  const group = (keyFn) => {
    const g = {};
    for (const r of per) { const k = keyFn(r) || "unknown"; (g[k] ||= []).push(r); }
    return Object.fromEntries(Object.entries(g).map(([k, list]) => {
      const imp = list.reduce((a, r) => a + (r.impressions || 0), 0), e = list.reduce((a, r) => a + r.engagements, 0);
      const ers = list.map((r) => r.er).filter((x) => x != null), rs = list.map((r) => r.reach).filter((x) => x != null);
      return [k, { posts: list.length, impressions: imp, engagements: e, engagementRate: imp ? +(100 * e / imp).toFixed(2) : null, medianER: ers.length ? +median(ers).toFixed(2) : null, medianReach: rs.length ? +median(rs).toFixed(2) : null, confidence: conf(list.length), warning: list.length < 10 ? "n=" + list.length + ": cannot show a pattern" : undefined }];
    }).sort((a, b) => (b[1].medianER ?? -1) - (a[1].medianER ?? -1)));
  };
  const warnings = [];
  if (per.length < 10) warnings.push(per.length + " posted rows: any pattern is noise until ~30 (6 posts cannot show a pattern)");
  if (per.some((r) => r.impressions == null)) warnings.push("some posted rows have no impressions; log metrics at 24 h and 7 d");
  const byER = per.filter((r) => r.er != null).sort((a, b) => b.er - a.er);
  const pick = (l) => l.map((r) => ({ date: r.date, platform: r.platform, formula: r.formula, er: +r.er.toFixed(2), first_line: r.first_line }));
  return { posts: per.length, byPlatform: group((r) => r.platform), byFormula: group((r) => r.formula), byFormat: group((r) => r.format), byLength: group(lengthBucket),
    top5: byER.length >= 10 ? pick(byER.slice(0, 5)) : undefined, bottom5: byER.length >= 10 ? pick(byER.slice(-5)) : undefined, warnings,
    note: "Rank by engagement rate and reach multiple (impressions/followers), not raw impressions. Check day/time last." };
}

// null in data/platforms.json = no numeric cap (returned as null); unknown action = 0 (not allowed).
export function capsFor(platform, action, overrides = {}) {
  const o = overrides?.[platform]?.[action]; if (o != null) return o;
  const caps = PLATFORMS[platform]?.caps || {};
  return action in caps ? caps[action] : 0;
}
// Count today's actions (Asia/Kolkata) from log rows. status posted = done; action column defaults to post.
export function capsUsage(rows, opts = {}) {
  const day = opts.date || localDate(opts.now ? new Date(opts.now) : new Date(), opts.tz || TIMEZONE);
  const used = {};
  for (const r of rows) {
    if (r.status !== "posted" || (r.date || "").slice(0, 10) !== day) continue;
    const a = (r.action || "post").toLowerCase(); const p = (r.platform || "").toLowerCase();
    ((used[p] ||= {})[a] = (used[p][a] || 0) + 1);
  }
  const report = {};
  for (const [p, spec] of Object.entries(PLATFORMS)) {
    report[p] = {};
    const acts = new Set([...Object.keys(spec.caps || {}), ...Object.keys(used[p] || {})]);
    for (const a of acts) {
      const cap = (opts.overrides?.[p]?.[a]) ?? spec.caps?.[a] ?? null; const u = used[p]?.[a] || 0;
      report[p][a] = { used: u, cap, left: cap == null ? null : Math.max(0, cap - u), atCap: cap != null && u >= cap };
    }
  }
  return { date: day, timezone: opts.tz || TIMEZONE, report, atCap: Object.entries(report).flatMap(([p, a]) => Object.entries(a).filter(([, v]) => v.atCap).map(([k]) => p + "." + k)) };
}
