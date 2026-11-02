# Stack Rush

Tap to drop the sliding block onto the tower. Land it dead-center for a **PERFECT**: it keeps your block's full width, builds a combo, and after a few in a row the block grows back. Overhang falls away. Miss completely and you lose.

Single static file, `index.html`. No build step, no dependencies. Works on phones and desktop (Space/Enter also drops).

## Playing
The big **PLAY** button starts the mode you played last in one tap. Under it, a mode switcher (‹ Classic ›) changes the mode without opening any list, and **More game modes** opens the full picker with descriptions. A thumb-reach bar at the bottom holds Campaign, Themes, Awards and Settings, and the tower behind the menu builds itself as a live preview. First-time players are offered a short **practice round** (skippable, shown once, replayable from Settings). New players also get a **timing assist** (slightly wider perfect window and slower blocks) for their first 6 games; it can be set to Always/Off in Settings.

## Modes
| Mode | Rules |
|---|---|
| **Classic** | One life. Climb as high as you can. |
| **Timed Rush** | 60 seconds, clock starts on your first tap. Perfect drops add +2s, a full miss costs -3s. |
| **Lives** | 3 lives. Only a full miss costs one; partial overhangs are fine. |
| **Hazard** | 3 lives plus **bomb blocks**. Don't drop on a bomb. Let it slide past for +2 bonus points; drop on it and you lose a life. |
| **Zen** | No speed-up and no fail state. A full miss just respawns the block. No coins. Tap *Finish* to end. |
| **Daily Twist** | A new rule every day (Narrow Start, Swift, Bomb Squad, Windy, Exact, No Regrow). Score 40 for +60 coins. |
| **Campaign** | 24 stages in 4 worlds with goals (reach a height, land perfects, score, dodge bombs, hit a combo). 3 lives per stage; more lives left means more stars (1-3). Each stage unlocks after the last; clearing a world pays a bonus. |

Each mode keeps its own best score.

## Power-up: Shield
Land 8 perfects in a row and you earn a **shield** (shown under the score and as a glow on your tower). It automatically absorbs your next full miss or bomb hit. Earned only by playing, never sold.

## Ghost run
Your best run in each mode is saved. Next time you play it:
- a faint dashed outline of your best tower shows behind your stack,
- a **BEST** line marks the height you need to beat,
- a live "+N vs best" readout compares your score to the same point in your best run.

## Themes (15)
Sunset (free), Neon, Ocean, Forest, Desert, Ice, Candy, Lava, Sakura, Retro, Deep Sea, Winter Night, plus premium Gold Rush, Galaxy and Cyber City. Many have their own ambient effects (snow, fireflies, embers, petals, bubbles, sand, digital rain); Retro uses pixel blocks and scanlines. Unlock by level, by coins, or (premium) by purchase.

## Progression and retention
- **Levels** from total blocks stacked; each level-up gives bonus coins.
- **26 achievements** with coin rewards, plus a stats page (🏆 Awards screen).
- **Share card:** the game-over screen has a Share button that makes a score image and opens the phone's share sheet.
- **Pause** (button, Esc/P, and automatically when you leave the app), with a short grace period after resuming.
- **Settings:** sound effects, music, vibration, reduce shake/flashes (follows the phone's reduce-motion setting by default), timing assist, replay practice, and a **save code** to copy progress to another device.
- **Theme preview:** tap any theme to see it live in the game before you equip, unlock or buy it.
- **Next-unlock hints** on the menu and game-over screen show your closest locked theme.
- **Music:** a quiet generative background loop (key follows your theme); toggle in Settings or mute everything with the speaker button.
- **Icons:** all UI icons are a custom inline SVG set (sprite at the top of `index.html`, used via `I('name')` in code), so the game looks the same on every device instead of depending on the phone's emoji font.
- **Accessibility:** screen-reader announcements for perfects and results, labelled buttons, visible keyboard focus, 44px tap targets.
- **Daily reward** with a streak, and a **daily challenge** (12 perfect drops).
- **Revive** once per run in Classic, Lives and Hazard (40 coins).
- Purchases are cosmetic only: no random paid items, no timers, no fake scarcity.

## Setting up purchases (web)
1. In Square, create a $1 one-time payment link for each premium theme (`gold`, `galaxy`, `cyber`).
2. Set each link's post-payment redirect to `https://<your-site>/?unlock=gold` (or `galaxy`, `cyber`).
3. Paste the links into `SQUARE_LINKS` near the top of the script in `index.html`.

Card details are entered on Square's page; the game never sees them.

**Limitation:** unlocks are stored in the browser, so anyone can add `?unlock=gold` to the URL. That is fine for a first test but is not real enforcement. Verifying purchases properly needs a small backend that checks Square webhooks.

## Home-screen install and offline
`manifest.json` and `icons/` make it installable: on iPhone use Safari's Share > Add to Home Screen; on Android use Chrome's menu > Install app. The icon source is `icons/icon.svg`; the PNGs were rendered from it.

`sw.js` is a service worker: after the first online visit the game works offline. Pages are fetched network-first, so updates arrive as soon as you're online. If you change `icons/` or add new files, add them to `CORE` in `sw.js` and bump `VERSION`.

## Android / Google Play
Not done yet. The plan is to wrap this page (Trusted Web Activity or Capacitor) and sell the premium themes through **Google Play Billing**. Google requires Play Billing for digital goods in apps, so the Square links above are for the web version only. A Play developer account is a $25 one-time fee.

## Before publishing to Google Play
- [ ] Put a real contact email in `privacy.html` (it currently has a placeholder) and host it at a public URL.
- [ ] Create a Google Play developer account ($25 one-time).
- [ ] Wrap the site (Trusted Web Activity / Bubblewrap or Capacitor) and add Google Play Billing for premium themes. Do not use Square links inside the Android app.
- [ ] Fill in the store listing: screenshots, short and long description, icon (512px, `icons/icon-512.png`), feature graphic.
- [ ] Complete the Data safety form (this version collects no data) and the content rating questionnaire.
- [ ] Test on a real Android phone, including install, offline, share, vibration and purchases.

## Tuning
Difficulty lives in the `CFG` object at the top of the script (`baseSpeed`, `ramp`, `perfectPx`, `regrowAfter`, `bombChance`, ...). These are first guesses and need real-player testing.

## Testing hook
Open the page with `#debug` in the URL to expose `window.__sr` for automated tests.
