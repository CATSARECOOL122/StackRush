# Stack Rush

Tap to drop the sliding block onto the tower. Land it dead-center for a **PERFECT**: it keeps your block's full width, builds a combo, and after a few in a row the block grows back. Miss and the overhang falls away. Miss completely and it's over.

Single static file, `index.html`. No build step, no dependencies. Works on phones and desktop (Space/Enter also drops).

## What's in it
- **Game feel:** squash on landing, perfect-drop ring and sparkles, combo counter with a rising musical scale, screen shake and haptics on Android, tumbling cut-off pieces, height milestones every 25 blocks. All sound is synthesized (no audio files); there's a mute button.
- **Look:** glossy blocks drawn in code, parallax hills, sky that fades into starfield as you climb, six themes.
- **Progression:** levels from total blocks stacked; themes unlock at levels (Neon at 3, Ocean at 5) or with coins (Candy, 150).
- **Retention loop:** daily reward with a streak, a daily challenge (12 perfect drops), coins earned every run, and a one-time **Revive** per run (40 coins).
- **Purchases:** two premium cosmetic themes (Gold Rush, Galaxy, $1 each). Purely cosmetic, no random paid items, no timers or fake scarcity.

## Setting up purchases (web)
1. In Square, create a $1 one-time payment link per premium theme.
2. Set each link's post-payment redirect to `https://<your-site>/?unlock=gold` (or `galaxy`).
3. Paste the links into `SQUARE_LINKS` near the top of the script in `index.html`.

Card details are entered on Square's page; the game never sees them.

**Limitation:** unlocks are stored in the browser, so anyone can add `?unlock=gold` to the URL. That is fine for a first test but is not real enforcement. Verifying purchases properly needs a small backend that checks Square webhooks.

## Android / Google Play
Not done yet. The plan is to wrap this page (Trusted Web Activity or Capacitor) and sell the premium themes through **Google Play Billing**. Google requires Play Billing for digital goods in apps, so the Square links above are for the web version only. A Play developer account is a $25 one-time fee.

## Tuning
Difficulty lives in the `CFG` object at the top of the script (`baseSpeed`, `ramp`, `perfectPx`, `regrowAfter`, ...). These are first guesses and need real-player testing.

## Testing hook
Open the page with `#debug` in the URL to expose `window.__sr` for automated tests.
