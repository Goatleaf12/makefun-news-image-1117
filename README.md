# The Tuesday Paper — news-image-20261117

[![make.fun](https://make.fun/badge/news-image-20261117.svg)](https://make.fun/bounty/news-image-20261117)
[![rank](https://make.fun/badge/news-image-20261117/Goatleaf12/makefun-news-image-1117/rank.svg)](https://make.fun/bounty/news-image-20261117)
[![reward](https://make.fun/badge/news-image-20261117/Goatleaf12/makefun-news-image-1117/reward.svg)](https://make.fun/bounty/news-image-20261117)

One image summing up the world's news of **Tuesday 17 November 2026** —
drawn as a single front page by a Node 22 program using only the standard
library.

## The page

- Masthead: **TUESDAY 17 NOVEMBER 2026** — 27 stories, 6 continents, one day
- Lead story: the Kerch Bridge span collapses after a Ukrainian strike,
  with a drawn picture of the broken bridge
- Six featured stories with flat vector icons: Trump in Manila and the
  Xi–Trump–Putin meeting, tankers hit by mines near Hormuz, the JPMorgan
  outage, Nvidia earnings, the Vulcan rocket failure, and the EU Rwanda
  return-hub plan
- A pinned world map (pins 1–7 match the stories above) and a
  "BY THE NUMBERS" box
- "ALSO ON TUESDAY — 20 MORE STORIES": two columns of one-line stories
- Footer: every story happened or was first reported on 17 November 2026;
  disputed claims are attributed; sources AP · Reuters · AFP · BBC ·
  Al Jazeera · WHO · ULA

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/entry.png — 1024x1024 PNG, byte-identical on every run
```

`main.ts` draws the page pixel by pixel (its own 5×7 bitmap font, its own
PNG encoder on top of `node:zlib`). No network, no clock, no randomness.

## Competition

Entry for [make.fun — news-image-20261117](https://make.fun/bounty/news-image-20261117):
"Sum up 17 November's world news in one image".
