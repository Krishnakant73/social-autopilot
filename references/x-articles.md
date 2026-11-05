# X Articles (long form)

X Articles is a long-form editor on x.com (Premium tier; X has changed which tiers get it, check the user's account). There is no API endpoint for Articles. The skill drafts and checks; the user pastes into the editor and publishes. No browser automation, no Playwright, no clipboard scripting of x.com (X automation rules forbid non-API website automation).

## When to use
Reference material someone will bookmark and come back to: a teardown, a how-to with screenshots, a research summary, 1,500-5,000 words with 3+ sections. One argument without sections -> long post (`platforms/x.md` section 8). Under 600 words -> thread or single post.

## Draft structure (Markdown)
```
# Headline                      <- becomes the Article title (removed from body)
![cover](images/cover.jpg)      <- first image = cover
Opening paragraph: the payoff in 2-3 sentences. What the reader gets, for whom, from what evidence.
## Section (H2, native)          <- 3-7 sections, each one claim + proof
Short paragraphs (1-4 sentences). **Bold** for the one line per section a skimmer must see.
![alt](images/02-step.png)      <- body image on its own line, after the paragraph it proves
---                             <- divider (inserted via the editor menu, not pasted)
## Closing section: the short version + one next step or real question
```
- Headline: <= 100 chars, concrete noun or number, says what the reader gets. Same rules as an X hook (gate, no "Ultimate guide", no clickbait it cannot pay off). Write 5 headlines, rank with `node scripts/cli.mjs hooks --platform x --file headlines.txt`.
- Cover: 5:2 landscape works in the editor crop (e.g. 1500x600); keep text inside the centre 60% because X crops differently in feed and article view. Original image or rights-checked asset only (record source, licence, attribution).
- Sections: H2 for every section (H3 support is unconfirmed; avoid). Each section opens with its claim, not a setup sentence.
- Formatting that pastes natively: H2, bold, italic, links, bulleted and numbered lists, blockquotes. Not supported: tables and Mermaid (render to PNG first, ask before installing any tool), code blocks (paste as blockquote or an image of the code), `---` (insert Divider from the editor menu).
- Images: jpg/png/gif/webp. Field-observed (single author, not official): the body stops accepting media after ~25 items, so keep body media <= 24; some PNGs upload without creating a block (convert to JPG, quality 90-95); large GIFs fail (convert to MP4: `ffmpeg -y -i in.gif -movflags +faststart -c:v libx264 -crf 25 -pix_fmt yuv420p -an out.mp4`). Never crop screenshots to fit; pad instead.

## Workflow
1. Material and voice as in SKILL.md. Every number traces to notes; unknowns stay `[ADD: ...]` / `[CONFIRM: ...]`.
2. Write `article.md` in the structure above. Save images next to it in `images/`, named in order (`01-...`, `02-...`). Never auto-search Downloads/Desktop for images.
3. Check the text: `node scripts/cli.mjs audit --platform x --file article.md`, then `node scripts/cli.mjs gate --platform x --file article.md --evidence firsthand` (or `--evidence external --source URL` per claim, `--notes notes.md`). Exit 2 = blocked. The 280 limit does not apply to an Article body; ignore length-only warnings for the body but keep the headline and opening paragraph clean.
4. Teaser post: write a single post that works without the click (the claim + one proof), `check` and `gate` it. Link to the Article in a reply or in the post only if the user wants clicks.
5. Build the handoff package (the model writes it; it is plain text):
   - Title (copy line)
   - Cover file path
   - Body in paste order with every image and divider replaced by a marker `[[IMAGE 02: images/02-step.png | alt text]]` / `[[DIVIDER]]`
   - Insertion checklist, bottom-up: "After the paragraph ending '...<last 6-10 words>' insert images/07-....png". Bottom-up order keeps earlier positions valid. Use anchors of 6+ distinctive words, never "for example".
6. User pastes: open x.com -> Articles -> Create; upload cover; type title; paste body; delete each marker and insert the listed image or divider from the bottom up; save draft.
7. Preview audit (user ticks): cover present; image count in body = checklist count; each image sits right after its anchor paragraph (verify by position, not count); no "Something went wrong" blocks; no leftover `[[` markers; links open; headline matches the teaser.
8. User publishes. Log: `node scripts/cli.mjs log --platform x --file article.md --status posted --url U`, then metrics at 24 h and 7 d (views, likes, replies, reposts, bookmarks).

## Repurpose
An Article can come from a LinkedIn post series, a YouTube script or a long thread. Re-hook for X, cut repetition, add the section structure, re-gate. A thread that grew past 12 posts usually wants to be an Article plus a 1-post teaser.