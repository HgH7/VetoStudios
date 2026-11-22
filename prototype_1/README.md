# VETO — Prototype One

A local, front-end-only Next.js prototype for **VETO**, a three-belt streetwear label.

## Run locally

```bash
cd prototype
npm install
npm run dev
```

Open `http://localhost:3000`. Create a production build with `npm run build`.

## What is included

- **Entry screen** — preloads the three supplied belt images, animates the red belt as the loading bar, then reveals Enter.
- **Belt range** — distinct RED, BLACK, and WHITE belt sections with image treatments and a size-finder action.
- **Outfit switcher** — changes between STREET, CLUB, ROOFTOP, and NIGHT scenes; three CSS placeholder outfits; and all three belt variants. Each outfit's belt placement is data-defined in `data/outfits.json`.
- **Size finder** — accepts centimetres or inches, returns a suggested size and highlighted hole. The editable placeholder chart is `data/size-chart.json`.
- **Drop module** — countdown and decreasing remaining-units mock, sourced from `data/drops.json` through `lib/data.ts`.
- **Member wall** — shows fake number-and-initial entries, plus a local-only join form and opt-out checkbox.
- **Language switcher** — English and Arabic interface text with RTL document direction.
- **Payment options** — non-functional cash-on-delivery, card, and mobile-wallet display.

## Folder map

| Folder / file | Purpose |
| --- | --- |
| `app/` | Next.js application entry point and global xerox-style CSS. |
| `components/` | The client-side VETO prototype interface. |
| `data/` | Editable JSON for outfits, sizes, drops, and members. |
| `lib/` | Small data-access boundary for future backend replacement. |
| `public/belts/` | The belt assets used by the site. |
| `temp_assets/` | Original supplied image assets, retained for reference. |
| `NOTES.md` | Asset inventory, placeholder list, and implementation assumptions. |

## Design and content notes

The visual system uses a grayscale paper/ink base, one red accent (`--red`), condensed display type, mono utility type, a fixed noise overlay, and contrast treatments on the provided transparent WebP belt assets. Model, outfit, and scene visuals are deliberately labeled CSS placeholders because no corresponding image assets were supplied.

The size chart and drop information are prototype data and should be replaced with real production values before launch. No backend, accounts, payments, or persistent member storage are implemented.
# VetoStudios
