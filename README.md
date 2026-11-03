# Stack Rush

Tap to drop the sliding block onto the tower. Land it dead-center for a **PERFECT**: it keeps your block's full width, builds a combo, and after a few in a row the block grows back. Overhang falls away. Miss completely and you lose. The higher you climb, the faster it gets.

Single static page, `index.html`, plus a few small files. No build step, no runtime dependencies. Works on phones, tablets and desktop (Space/Enter also drops).

> **Status:** playable and tested in emulation, **not yet tested on real devices** (see [Known limitations](#known-limitations)). License: all rights reserved (see `LICENSE`).

## Playing
The big **PLAY** button starts the mode you played last in one tap. Under it, a mode switcher (‹ Classic ›) changes the mode without opening any list, and **More game modes** opens the full picker with descriptions. A thumb-reach bar at the bottom holds Campaign, Themes, Awards and Settings, and the tower behind the menu builds itself as a live preview. First-time players are offered a short **practice round** (skippable, shown once, replayable from Settings). New players also get a **timing assist** (slightly wider perfect window and slower blocks) for their first 6 games; it can be set to Always/Off in Settings. The first time you open a mode you get a one-line tip.

## It gets faster
Every mode except Zen and Practice speeds up as the tower grows: ×1.4 at 10 blocks, ×1.7 at 20, ×2.0 at 30, flattening out toward ×2.4. A speed badge (`×1.7`) sits under the coin counter, turns orange from ×2, and a **SPEED UP** cue flashes each time you cross a step. Campaign ramps at 60% of that. Tuning lives in `CFG` (`rampMax`, `rampTau`, `rampStart`).

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
- a faint dashed outline of your best tower shows behind your stack (Settings → *Best-run outline* hides it),
- a **BEST** line marks the height you need to beat,
- a live "+N vs best" readout compares your score to the same point in your best run.

## Themes (15)
Sunset (free), Neon, Ocean, Forest, Desert, Ice, Candy, Lava, Sakura, Retro, Deep Sea, Winter Night, plus premium Gold Rush, Galaxy and Cyber City. Many have their own ambient effects (snow, fireflies, embers, petals, bubbles, sand, digital rain); Retro uses pixel blocks and scanlines. Unlock by level, by coins, or (premium) by purchase. Tap any theme to preview it live before you equip, unlock or buy it.

## Languages (13)
English, Español, Português, Français, Deutsch, Italiano, Bahasa Indonesia, Türkçe, Русский, हिन्दी, 日本語, 한국어, 中文 (简体). The game picks the phone's language on first launch (**Settings → Language → Automatic**), you can choose another one, and it falls back to English if a language file is missing. Language packs are small JSON files in `lang/`, cached for offline play.

How it works: the English text is the key (`tr('Reach {n} blocks',{n:5})`), static HTML text is translated in place, and numbers/brand names stay as they are. To change or add text:
1. Edit the English in `index.html`.
2. `npm run keys` finds the new strings and **appends** them to `tools/i18n-keys.json` (existing line numbers never change) and prints their line numbers.
3. Add a line `N|translation` for each new string to `tools/i18n-src/<code>.txt` in every language (N = the line number from step 2).
4. `npm run lang` builds `lang/*.json` and checks that every language has every string, placeholders like `{n}` match, and nothing is empty. CI fails if any step was skipped.

**All translations were written by an AI and have not been reviewed by native speakers.** Treat them as a good first draft, especially the store texts. Traditional Chinese phones get Simplified Chinese.

## Phones, tablets and iPad
- **Short phones** (iPhone SE, 360×640, 360×740): the menu tightens up so everything fits without scrolling.
- **Tablets** (iPad, Android tablets, foldables) are detected automatically: an iPad is recognised even though iPadOS reports itself as a Mac (it has touch points). The game becomes a centred column no wider than 3:4 and the whole interface is scaled up (up to ×1.5) with larger blocks, so it is not a tiny phone in a big screen. In landscape you get the column with dark sides. Tablets are never asked to "rotate your phone". Split View windows are handled (narrow windows behave like a phone).
- **iPhone/iPad Safari** has no vibration API, so the Vibration setting is hidden there.
- **No white bars:** `html`/`body` have a solid dark `background-color` under the gradient and `color-scheme: dark` (a gradient-only background reads as "no colour" to Safari's translucent bars), `viewport-fit=cover` with safe-area padding for the notch/Dynamic Island and home indicator, and `apple-touch-startup-image` launch screens for every current iPhone and iPad size so a Home Screen launch does not start on a white screen. Regenerate those with `npm run splash`.

## Progression and retention
- **Levels** from total blocks stacked; each level-up gives bonus coins.
- **26 achievements** with coin rewards, plus a stats page (Awards screen).
- **Share card:** the game-over screen has a Share button that makes a score image and opens the phone's share sheet.
- **Pause** (button, Esc/P, and automatically when you leave the app), with a 3-2-1 countdown after resuming.
- **Settings:** sound effects, music, vibration, reduce shake/flashes (follows the phone's reduce-motion setting by default), **best-run outline** (hide the dashed ghost tower; the BEST line and the "+N vs best" readout stay), language, timing assist, replay practice, and a **save code** to copy progress to another device (imported codes are validated field by field, so a malicious code cannot inject anything).
- **Next-unlock hints** on the menu and game-over screen show your closest locked theme.
- **Music:** a quiet generative background loop (key follows your theme); toggle in Settings or mute everything with the speaker button.
- **Premium finish:** touch targets are at least 44px (most 48-50px), springy press animations, tap ripples, light haptics where supported, staggered screen transitions. All motion respects the reduce-motion setting.
- **Performance mode:** if frames drop on a slow phone, glow, particles and blur are reduced automatically; the menu idles at 30fps to save battery. If the game ever throws repeatedly, a friendly reload screen appears instead of a frozen page. An "Update ready" button appears when a new version has been downloaded.
- **Icons:** all UI icons are a custom inline SVG set, so the game looks the same on every device.
- **Accessibility:** screen-reader announcements for perfects and results, labelled buttons, visible keyboard focus.
- **Daily reward** with a streak, and a **daily challenge** (12 perfect drops).
- **Revive** once per run in Classic, Lives and Hazard (40 coins).
- Purchases are cosmetic only: no random paid items, no timers, no fake scarcity.

## Setting up purchases (web)
1. In Square, create a $1 one-time payment link for each premium theme (`gold`, `galaxy`, `cyber`).
2. Set each link's post-payment redirect to `https://<your-site>/?unlock=gold` (or `galaxy`, `cyber`).
3. Paste the links into `SQUARE_LINKS` near the top of the script in `index.html`.

Card details are entered on Square's page; the game never sees them. Until the links are set, tapping a premium theme says "Store is not connected yet".

**Limitation:** unlocks are stored in the browser, so anyone can add `?unlock=gold` to the URL. That is fine for a first test but is not real enforcement. Verifying purchases properly needs a small backend that checks Square webhooks.

## Home-screen install and offline
`manifest.json` and `icons/` make it installable: on iPhone/iPad use Safari's Share > Add to Home Screen; on Android use Chrome's menu > Install app. The icon source is `icons/icon.svg`; the PNGs were rendered from it.

`sw.js` is a service worker: after the first online visit the game (and all language packs) works offline. Pages are fetched network-first, so updates arrive as soon as you're online. If you change `icons/` or add new files that must work offline, add them to `CORE` in `sw.js` and bump `VERSION`.

## Tests
```
npm install            # once (Playwright)
npx playwright install chromium
npm test               # everything, about 10 minutes
node tests/run.js speed            # one file
node tests/run.js i18n "play-through"   # one test
```
Browser tests (headless Chromium, through the `#debug` hook): `game` (every mode, shield, revive, ghost, campaign, pause), `speed` (the ramp), `ux` (tutorial, assist, settings, save code, themes, 44px targets, short phones, music, accessibility), `i18n` (translation files, all 13 languages on every screen with no clipped text, the picker, fallbacks, no untranslated strings during play), `devices` (tall iPhones, tablets, iPad detection, safe areas, no white edges, launch images, desktop), `security` (hostile save codes, debug hook off the public site) and `offline`. GitHub Actions runs them on every push (`.github/workflows/test.yml`).

## Store assets and promo video
All generated from the real game (a bot plays it on a virtual clock), so they stay in sync with the UI. Needs Playwright; the video also needs `ffmpeg`. For Hindi/Korean/Japanese/Chinese pictures, install fonts such as `fonts-noto-cjk` and `fonts-noto-core`.
```
npm run assets                       # store/screenshots/<lang>/*.jpg (1080x1920) + store/feature-graphic/<lang>.jpg (1024x500)
node tools/make-store-assets.js --lang en,es --only gameplay,menu
npm run video                        # store/promo/stack-rush-promo.mp4 (30 s, 1080x1920, with the game's own sound)
node tools/make-promo-video.js --dry # fast low-res preview that prints the timeline
npm run listing                      # store/listing/<lang>.md (title, short and full description, release notes; limits checked)
npm run splash                       # iOS launch images in splash/ and the <link> tags in index.html
```
Captions in the pictures and the video, and the listing texts, are machine-written (see Languages). The Play Console takes the promo video as a YouTube link, so upload the MP4 to YouTube first.

## Android / Google Play
Not done yet. The plan is to wrap this page (Trusted Web Activity or Capacitor) and sell the premium themes through **Google Play Billing**. Google requires Play Billing for digital goods in apps, so the Square links above are for the web version only. A Play developer account is a $25 one-time fee.

## Before publishing to Google Play
- [ ] Put a real contact email in `privacy.html` (it currently has a placeholder) and host it at a public URL. The policy is English only.
- [ ] Create a Google Play developer account ($25 one-time).
- [ ] Wrap the site (Trusted Web Activity / Bubblewrap or Capacitor) and add Google Play Billing for premium themes. Do not use Square links inside the Android app.
- [ ] Upload `store/screenshots/<lang>/*`, `store/feature-graphic/<lang>.jpg`, the 512px icon (`icons/icon-512.png`) and the texts from `store/listing/` (have natives check them first).
- [ ] Complete the Data safety form (this version collects no data) and the content rating questionnaire.
- [ ] Check the name "Stack Rush" is not already a registered trademark or an existing Play Store title.
- [ ] Test on a real Android phone, including install, offline, share, vibration and purchases.

## Known limitations
- **Not tested on real devices.** All testing is headless Chromium with emulated phones/iPads. iOS Safari (WebKit) behaves differently in places: the white-bar fix and the iPad layout are based on how WebKit is documented to behave and could not be checked on an iPhone here.
- **Translations are unreviewed machine output.** Plural forms are avoided rather than handled (e.g. "days" is abbreviated in Russian).
- **Purchases are not enforced** on the web version (see above) and the Play Billing version does not exist yet.
- No cloud save: progress lives in the browser; the save code is the only transfer method. Clearing site data erases it.
- Android's back button is not handled yet in the wrapped app.
- Difficulty numbers in `CFG` are first guesses and need real-player testing.

## Tuning
Difficulty lives in the `CFG` object at the top of the script (`baseSpeed`, `rampMax`, `perfectPx`, `regrowAfter`, `bombChance`, ...).

## Testing hook
Open the page with `#debug` in the URL to expose `window.__sr` for automated tests and the tools. This only works on `localhost`, `127.0.0.1` or a local file, never on the public site (a test checks that).
