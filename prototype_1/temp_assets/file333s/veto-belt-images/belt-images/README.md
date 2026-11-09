# VETO belt images (rendered, transparent PNG + WebP)

Folders: belt-images/{red,black,white}/  and  builder-belts/

Per color (PNG for editing, WebP for the site):
- belt-<c>-full          flat full belt, buckle left, tip right        (product sections)
- belt-<c>-buckle-half   buckle end, buckle on the left                (product / size section)
- belt-<c>-free-end      free end, 5 holes + tip cap on the right      (size finder, product)
- belt-<c>-entry-left    buckle half MIRRORED: buckle on the RIGHT edge (entry intro, enters from left)
- belt-<c>-entry-right   free end MIRRORED: tip on the LEFT edge        (entry intro, enters from right)
- belt-<c>-buckle-macro  buckle close-up                                (drop section / detail)

builder-belts/worn-<color>-cut-0X.png
  1792x2400 transparent layer = the same box as the outfit image at 2x (outfits are 896x1200).
  Belt is already sized, positioned and masked to the waistband. Draw it at 0,0 over the outfit
  with the same width/height. No scaling, no clip-path, no mask-image needed.

Scale: 1 cm = 100 px in buckle-half/free-end, 40 px in full, 200 px in macro.
Strap width 4 cm, buckle frame 6.4 x 5.7 cm, holes 2.5 cm apart (5 holes, first 17.5 cm from the tip).
Hardware design is original (not your real buckle). engine.py / produce.py regenerate everything.

## Added for the entry intro and the web
- belt-<c>-entry-left-noprong  entry-left WITHOUT the prong (buckle on the right edge)
- entry-prong                 the prong alone, same canvas, color-agnostic silver
- geometry.json               exact pixel positions (bars, keepers, prong pivot/tip, holes) + layer order + alignment formula
- web/<c>/...                 resized WebP copies for the site (entry/half/free-end 2200px wide, full 2400, macro 1400)
  Use web/ in production. The 4500px originals are for editing only.
