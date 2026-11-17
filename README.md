# Stack Rush

Tap to drop the sliding block onto the tower. Land it dead-center for a **PERFECT**: it keeps your block's full width, builds a combo, and after a few in a row the block grows back. Overhang falls away. Miss completely and you lose. The higher you climb, the faster it gets.

Single static page, `index.html`, plus a few small files. No build step, no runtime dependencies. Works on phones, tablets and desktop (Space/Enter also drops).

> **Status:** playable and tested in emulation, **not yet tested on real devices** (see [Known limitations](#known-limitations)). License: all rights reserved (see `LICENSE`).

## Playing
The big **PLAY** button starts the mode you played last in one tap. Under it, a mode switcher (‹ Classic ›) changes the mode without opening any list, and **More game modes** opens the full picker with descriptions. A thumb-reach bar at the bottom holds Campaign, Shop, Awards and Settings, and the tower behind the menu builds itself as a live preview. First-time players are offered a short **practice round** (skippable, shown once, replayable from Settings). New players also get a **timing assist** (slightly wider perfect window and slower blocks) for their first 6 games; it can be set to Always/Off in Settings. The first time you open a mode you get a one-line tip.

## It gets faster
Every mode except Zen and Practice speeds up as the tower grows: ×1.4 at 10 blocks, ×1.7 at 20, ×2.0 at 30, flattening out toward ×2.4. A speed badge (`×1.7`) sits under the coin counter, turns orange from ×2, and a **SPEED UP** cue flashes each time you cross a step. Campaign ramps at 60% of that. Tuning lives in `CFG` (`rampMax`, `rampTau`, `rampStart`).

## Modes
| Mode | Rules |
|---|---|
| **Classic** | One life. Climb as high as you can. |
| **Timed Rush** | 30 seconds, clock starts on your first tap. Perfect drops add +2s, a full miss costs -3s. The **Extra Time** boost gives 30 more seconds when the clock runs out. |
| **Lives** | 3 lives. Only a full miss costs one; partial overhangs are fine. |
| **Hazard** | 3 lives plus **bomb blocks**. Don't drop on a bomb. Let it slide past for +2 bonus points; drop on it and you lose a life. Later in the tower come **ice**, **glue** and **gusts** (see below). |
| **Zen** | No speed-up and no fail state. A full miss just respawns the block. No coins. Tap *Finish* to end. |
| **Daily Twist** | A new rule every day (Narrow Start, Swift, Bomb Squad, Windy, Exact, No Regrow). Score 40 for +60 coins. |
| **Campaign** | 24 stages in 4 worlds with goals (reach a height, land perfects, score, dodge bombs, hit a combo). 3 lives per stage; more lives left means more stars (1-3). Each stage unlocks after the last; clearing a world pays a bonus. The last stage of every world is a **boss** (see below). |

Each mode keeps its own best score.

### Ice, glue and gusts
Hazard mode (and the boss stages) have three more hazards. Each one is introduced by a one-time tip the first time it shows up.
- **Ice** (from a tower height of 6): a frosted block that **slides on** after your tap, 0.12 seconds of travel, so tap a little early.
- **Glue** (from 10): a green dripping block that is **pulled back** by the same 0.12 seconds, so tap a little late.
- **Gusts** (from 14, at least 8 blocks apart): the **whole tower leans and sways** (up to ±7% of the width, about half a second per sway) for roughly 4 seconds, with wind streaks and a GUST! banner. A drop is judged against where the top block is *now*; the new block rides with the tower. The moving block is not pushed.
- They never replace a bomb. Like the bombs they depend only on the round's seed and the height, never on how often you tapped, so a friend challenge gives both players the same ones. A block you are handed again after a miss is always plain. Zen, Practice, Classic and the other modes have none. With *Reduce shake/flashes* on the wind streaks are switched off, but the tower still sways, because the sway changes where you have to aim.

### Boss stages
The last stage of each campaign world (6, 12, 18, 24) is a boss: a crown in the stage picker, a red vignette and a BOSS STAGE banner, **+60 coins the first time**, and a hazard of its own from low down: world 1 gusts, world 2 ice (and the world's speed), world 3 glue (and its bombs), world 4 all three on a narrow start. Honest note: there are no boss fights or health bars; a boss is a harder stage with a signature hazard and a bigger goal.

## Friend challenges
After a Classic, Timed Rush, Lives or Hazard round, **Share** sends a link. Opening it shows "A friend scored N in Classic. Can you beat it?"; **Accept** starts that mode with **the same round**: the bombs of Hazard appear at the same heights for both players (the luck of a round is a function of its seed and the height, never of how you tapped), and the friend's tower is the dashed outline to beat. **Boosts and timing assist are off in a challenge**, and a round that used a boost or timing assist cannot start one, so both scores were earned the same way. The result line says who won (a tie counts as a tie). AGAIN replays the same challenge; the menu ends it.

The link is `?c=<mode>.<score>.<seed>.<tower>`: nothing is stored on a server. The tower is two bytes per block (position and width) in base64url, so a link is a few hundred characters. Links come from strangers, so parsing is strict (plain digits, a fixed list of modes, a size limit, the tower must decode to whole pairs) and anything odd is ignored without a trace; the address is cleaned afterwards so a reload does not offer the challenge again. Without a share sheet (desktop) the image is saved and the link is copied.

**Ghost race:** a link made by this version also carries *when* each block landed and what it scored (`?c=mode.score.seed.tower.seconds.points`, about 800 characters for a long run). Opening it, you play the same round while the friend's tower **builds itself next to yours as a faded cyan ghost**, block by block at the pace they built it, with a live **Friend N** score on the HUD (green when you lead). Older links (no timing) still work with the dashed outline. The **Friend race** tile (beside Zen on *Game modes*) explains the three steps, sends the link of your last raceable round (share sheet, or copied if sharing is unavailable) and has **Paste a friend's challenge**, which takes a whole link, a `?c=` part or the bare code, so a link sent in any chat can be pasted. It is not simultaneous play: for live play with a short join code a small server would be needed.

## Weekly missions
Three missions a week (Awards screen), picked from six by the ISO week number: **Stack 250 blocks**, **Land 100 perfect drops**, **Finish 15 rounds**, **Reach 25 blocks high in one round**, **Hit a ×12 combo**, **Score 60 in one round**. The set always mixes long hauls (totals that add up over the week) with skill goals (your best round). When all three are done the **weekly chest** opens once for **400 coins and 2 of that week's boost**. A new set starts every Monday (progress and the chest reset). Zen and Practice do not count (they could be farmed), a Revive takes the round back with the rest of its payout, and a ready chest shows a dot on Awards and a line on the menu. Progress is kept on the device (and travels with the save code).

## Tower museum
Awards → **Tower museum** shows the best tower of each mode (Classic, Timed Rush, Lives, Hazard), drawn again exactly as it looked when you built it: the theme, block style, colour set, scenery and topper (a cat, a flag or a star) are saved with the run. **Share** makes a 1080×1350 picture with the mode and score and opens the share sheet (or saves the picture). Towers saved before this version have no recorded look and are drawn in your current theme.

## Power-up: Shield
Land 8 perfects in a row and you earn a **shield** (shown under the score and as a glow on your tower). It automatically absorbs your next full miss or bomb hit. Earned only by playing, never sold.

## Ghost run
Your best run in each mode is saved. Next time you play it:
- a faint dashed outline of your best tower shows behind your stack (Settings → *Best-run outline* hides it),
- a **BEST** line marks the height you need to beat,
- a live "+N vs best" readout compares your score to the same point in your best run.

## Themes (16)
Sunset (free), Neon, Ocean, Forest, Desert, Ice, Candy, Lava, Sakura, Retro, Deep Sea, Winter Night, Flower Field (a bright meadow with drifting blossoms), plus premium Gold Rush, Galaxy and Cyber City. Many have their own ambient effects (snow, fireflies, embers, petals, bubbles, sand, digital rain); Retro uses pixel blocks and scanlines. Unlock by level, by coins, or (premium) by purchase. Tap any theme to preview it live before you equip, unlock or buy it.

## Shop, boosts and coins
**Coins sheet:** tapping the coin counter on the menu (it has a + on it) opens a sheet with the ways to earn coins and where you stand today (play rounds, the daily reward which can be claimed right there, the daily challenge, Daily Twist, weekly missions, awards, campaign), and in the Android app the coin packs and Starter pack. On the web it says packs are Android-only. The 7-tap layout info card moved to the sheet's title. The **shop tabs** are one horizontally scrolling strip with an icon on each tab; the active tab is gold and scrolled into view, and the strip stays at the top while you scroll the cards.
The old Themes screen is now a **Shop** with nine tabs. Everything can be previewed live in the game before you pay for it.

| Tab | What is in it |
|---|---|
| Themes | the 16 themes above |
| Blocks | block styles: Classic, Flat, Glass, Neon, Pixel, and the premium **Foil** |
| Colors | colour sets that replace the theme's block colours: Rainbow, Pastel, Mono, Ember, Frost |
| Scenes | the scenery of any theme you own, on any theme (mix Lava blocks with the Ocean) |
| Sounds | sound-effect packs (Classic, Retro, Soft) |
| Music | music styles (Classic, Chill, Chiptune); a separate tab from Sounds so only one card is ever shown as Equipped |
| Extras | landing effects (Sparkle, Confetti, Stars), a **tower topper** (seven cats drawn with shaded fur, ears, whiskers, shining eyes and a swaying tail: Black, Orange tabby, Siamese, Tuxedo, Calico, Grey tabby, White, plus a Flag, a Star and the premium Golden cat; it stands in front of the sliding block so it is always in view) and the **app colour** that tints the buttons |
| Boosts | buy boosts with coins, 1 or 3 at a time |
| Coins | coin packs and the Starter pack (Android app only, see below) |

**Boosts** (four, picked from the bolt button on the menu, at most two per round). **You choose when to use them**: in a round a small bolt handle sits in the bottom-left corner (where a thumb that is dropping blocks rarely lands; Settings > Auto-use boosts removes it) (with the count in hand; for the first four rounds it also says *Swipe up for boosts*). **Tap it or swipe up from it** (or press **B** on a keyboard) and the game **eases to a stop**, dims, and a menu slides up that lists **only the boosts you picked for this round**, each with how many you have. Tap one to use it and the game eases back to full speed; *Keep playing* (or Back, Escape, a tap outside) closes the menu without using anything. A card that cannot be used right now says why. While the menu is open nothing moves and taps on the field do nothing.
- **Shield**: puts a shield up now that blocks your next miss or bomb. It is only used up when it actually saves you.
- **Slow-Mo**: slows the blocks to ×0.6 for 6 drops, starting now.
- **Regrow**: restores the full starting width of the top block (and the block in your hand) now. Only when your tower is thinner than its starting width, at most twice a round.
- **Extra Time** (Timed Rush only): adds 30 seconds now (once the clock is running). The handle glows when the clock is under 6 seconds and you hold one.

**App colour preview:** previewing an app colour (Shop > Extras) shows a sample card with real buttons in that colour instead of the tower, because the colour only tints the buttons. **Awards:** 38 in all; the newer ones cover long combos, boss stages and worlds, bombs, shields, rounds played and beating a friend in a friend race. **Unlock code row (Settings):** Copy is only there in a browser where something premium was bought; in the Home Screen app the row only pastes. The "Empty strip" tip never appears while the keyboard is open (it used to, because a keyboard also makes the page short).

**Speed-ups** (Shop > Boosts): **+10** (1,000 coins), **+20** (1,600) and **+100** (10,000) add that many free, perfectly placed blocks to the tower, and the same number of points, in a quick burst (about half a second to a second and a half), then the moving block comes back. The free blocks do **not** speed the game up: the speed only follows the blocks you place yourself. They are picked and used like any boost (bolt menu). A Speed-up is always your call, even with *Auto-use boosts* on; they do not work in campaign stages, and the welcome gift does not include them. A round that used one is a boosted round (own best, no awards, cannot be shared as a challenge). A **Speed-up pack** (5 x +10, $4.99) is in the Boosts tab; until a store is connected it says so, like the coin packs. **Starting a race:** *Game modes > Friend race* has a mode picker (Classic, Timed Rush, Lives, Hazard), the Speed-up rows and **Start my round**; that round allows only the equipped Speed-ups, and the game-over screen says *Tap Share to challenge a friend*. A round with Speed-ups from this flow can be shared (the link carries the tower with its free blocks, so the friend's ghost shows it). **Accepting:** the challenge card has a *Speed-up* row for each size with - / + to equip some for that race; + buys one with coins when none are spare. Only Speed-ups work in a friend race (no Shield, Slow-Mo, Regrow, timing assist), and the result line says the score is boosted, so a weaker player can close the gap and both know it.

**Auto-use boosts** (Settings, off by default) keeps the old way for people who would rather not think about it: nothing in hand, no handle; the Shield is up from the start, Slow-Mo kicks in once the speed passes about ×1.5, Regrow when the tower gets thinner than 55% of its starting width, Extra Time when the clock hits zero, and each is only used up when it actually helps. They are not available in Daily Twist, Zen, Practice or a friend's challenge. **A round in which a boost was used keeps its own best score** (and does not count for height, combo or score awards).

Everything except the premium cosmetics (3 themes, Foil, Golden cat) can be bought with coins you earn by playing. Prices live in the `SHOP`, `THEMES` and `BOOSTS` tables in `index.html`.

**Coins are deliberately slow:** a round pays `floor(score / 5) + floor(perfects / 2)` coins, the daily reward is 20-80, and a theme or cosmetic costs about 300-1400 (a boost 120-500, Revive 60), roughly twice the old prices and a fifth less income than before. The test `economy` pins the numbers so changing them is a deliberate act.

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
- **No dead strip at the bottom of the iPhone Home Screen app (iOS 26):** the page asks for the **opaque** status bar (`apple-mobile-web-app-status-bar-style` = `black`). On iOS 26 a Home Screen app that uses the translucent bar together with `viewport-fit=cover` gets a web view that stops about one status-bar height (about 64 points on an iPhone 15 Pro Max) short of the bottom of the screen ([WebKit bug 301108](https://bugs.webkit.org/show_bug.cgi?id=301108), reported by several developers); nothing the page draws can reach that strip, which is what cut the tower off. **iOS only reads the status bar style when the app is added to the Home Screen, so an icon added earlier keeps the bug: remove it and add the game again.** For icons added earlier the game also tries stretching the page to the screen height and, if the page is still short, shows a one-time hint saying exactly that (at most 4 times). History: this project used the translucent bar from the start, the first "white bars" report was this strip showing the page's then-transparent background, and the first two fixes (a dark background colour, then painting the canvas under the strip) could not work. **I could not test any of this on a real iPhone** (Chromium only). If a strip is still visible after re-adding the icon, open the menu and tap the coin counter 7 times quickly: a **layout info card** shows the screen, viewport and safe-area numbers, and a screenshot of it shows what iOS is doing.
- **Top of the screen:** the score is placed below the notch / Dynamic Island and the soft blur iOS 26 draws under the status bar (it used to start 44px from the top whatever the phone).

## The Back button
The Android Back button (and a browser's Back, and an iPhone's swipe from the edge) steps out of the game the way the on-screen arrows do instead of closing the app: **in a run it pauses** (the next Back resumes with the 3-2-1), **on a screen it closes that screen** (Language → Settings → menu, Museum → Awards → menu, Stages → Modes → menu, the shop opened from the game-over screen → game over → menu, the boosts sheet, a friend's challenge card, the practice offer, the layout card) and **only from the plain menu does Back leave**. How: the page keeps one extra history entry whenever it is not on the plain menu; Back uses it up, the game puts it back while you are still somewhere deeper, and takes it away when you arrive at the menu (by Back or by an arrow), so that Back on the menu is the browser's own and the Android app closes. The Update button and the crash screen's Reload take that entry away before reloading, so the new page does not sit on top of a stale one.

## Progression and retention
- **Levels** from total blocks stacked; each level-up gives bonus coins.
- **26 achievements** with coin rewards, plus a stats page (Awards screen).
- **Share card:** the game-over screen has a Share button that makes a score image and opens the phone's share sheet.
- **Pause** (button, Esc/P, and automatically when you leave the app), with a 3-2-1 countdown after resuming.
- **Settings:** sound effects, music, **sound in silent mode** (iPhone/iPad only, see below), vibration, reduce shake/flashes (follows the phone's reduce-motion setting by default), **best-run outline** (hide the dashed ghost tower; the BEST line and the "+N vs best" readout stay), language, timing assist, replay practice, and a **save code** to copy progress to another device (imported codes are validated field by field, so a malicious code cannot inject anything).
- **Next-unlock hints** on the menu and game-over screen show your closest locked theme.
- **Music:** a quiet generative background loop (key follows your theme) that **builds with your perfect streak**: an off-beat tick from about a 5-streak, a high arpeggio from about 9 and a low pulse from about 14, easing back down within a second or two of a miss; toggle in Settings or mute everything with the speaker button.
- **Sound that keeps working:** iPhone/iPad mute Web Audio when the ringer switch is on silent (Bluetooth is not muted, which looks like "only works on Bluetooth"), so the game asks iOS to treat its audio like media playback (`navigator.audioSession`, iOS 16.4+); Settings → *Sound in silent mode* turns that off. A call, Siri, an alarm or the lock screen leaves the audio engine "interrupted" or "suspended": the game wakes it on the next real tap (`pointerup`/`touchend`/`click`, not `pointerdown`), makes a new one if the browser closed it, and never queues sounds while it is stopped.
- **Premium finish:** touch targets are at least 44px (most 48-50px), springy press animations, tap ripples, light haptics where supported, staggered screen transitions. All motion respects the reduce-motion setting.
- **Performance mode:** if frames drop on a slow phone, glow, particles and blur are reduced automatically; the menu idles at 30fps to save battery. If the game ever throws repeatedly, a friendly reload screen appears instead of a frozen page. An "Update ready" button appears when a new version has been downloaded.
- **Icons:** all UI icons are a custom inline SVG set, so the game looks the same on every device.
- **Accessibility:** screen-reader announcements for perfects and results, labelled buttons, visible keyboard focus.
- **Daily reward** with a streak, and a **daily challenge** (12 perfect drops).
- **Revive** once per run in Classic, Lives and Hazard (60 coins).
- **What money buys:** premium cosmetics, coin packs and a Starter pack (Android app). Boosts are single-player aids that cost coins. There are no random paid items (no loot boxes), no timers, no fake scarcity, and nothing is needed to finish the game. Earlier versions of this page said "cosmetic only"; that stopped being true when boosts arrived.

## Setting up purchases (web)
**Unlock code:** an iPhone Home Screen app keeps its own storage, so a purchase made after a Square checkout in Safari is not seen there. After the return address (`?unlock=...`) the game opens Settings; *Unlock code > Copy* gives a 4-character code (`SR-XXXX`, a check inside) listing the premium items owned in that browser, and *Paste* in the app unlocks the same ones. Still an honour system. Android Chrome Home Screen apps share storage with Chrome and need no code.

The web version can sell the five premium cosmetics (themes `gold`, `galaxy`, `cyber`, and the Foil block style and Golden cat topper). Coins, coin packs, the Starter pack and boosts for real money are **Android-only** (Google Play Billing), so the web version never sells them.
1. In Square, create a one-time payment link for each premium item.
2. Set each link's post-payment redirect to `https://<your-site>/?unlock=<key>`, where the key is `gold`, `galaxy`, `cyber`, `style:foil` or `topper:gold` (URL-encode the colon as `%3A` if Square asks).
3. Paste the links into `SQUARE_LINKS` near the top of the script in `index.html`, using the same keys.

Card details are entered on Square's page; the game never sees them. Until the links are set, tapping a premium item says "Store is not connected yet". While no web store exists, the Coins tab is shown as a preview; once you add a Square link it disappears from the web (and stays in the Android app).

**Limitation:** unlocks are stored in the browser, so anyone can add `?unlock=gold` to the URL. That is fine for a first test but is not real enforcement. Verifying purchases properly needs a small backend that checks Square webhooks.

## Home-screen install and offline
`manifest.json` and `icons/` make it installable: on iPhone/iPad use Safari's Share > Add to Home Screen; on Android use Chrome's menu > Install app. The icon source is `icons/icon.svg`; the PNGs were rendered from it.

**Updates while the app stays open:** a phone keeps a Home Screen app alive for days, and the browser only looks for a new version when the app is launched. So the page asks again when you come back to it, after every round, and every 10 minutes (at most once per 5), by asking the service worker to update and by comparing its own code with the one on the server. When there is something newer, the green **Update ready** button appears: never in the middle of a run, always on the game-over screen or the menu. Pressing it saves your progress and reloads; there is no need to close the app. (The service-worker route needs `VERSION` in `sw.js` bumped with every release; the page comparison catches an `index.html`-only change too.)

`sw.js` is a service worker: after the first online visit the game (and all language packs) works offline. Pages are fetched network-first, so updates arrive as soon as you're online. If you change `icons/` or add new files that must work offline, add them to `CORE` in `sw.js` and bump `VERSION`.

## Tests
```
npm install            # once (Playwright)
npx playwright install chromium
npm test               # everything, about 15 minutes
node tests/run.js speed            # one file
node tests/run.js i18n "play-through"   # one test
```
Browser tests (headless Chromium, through the `#debug` hook): `game` (every mode, shield, revive, ghost, campaign, pause), `speed` (the ramp), `ux` (tutorial, assist, settings, save code, themes, 44px targets, short phones, music, accessibility), `i18n` (translation files, all 13 languages on every screen with no clipped text, the picker, fallbacks, no untranslated strings during play), `hazards` (ice, glue and gusts: heights, chances, the slide and the drag, the swaying tower, determinism, sounds), `boss` (the four bosses, the crown, the banner, the bonus), `weekly` (ISO week numbers around New Year, the mission sets, sums and bests, the chest once, Monday rollover, Revive, hostile saves), `challenge` (strict link parsing, the card, fair rounds without boosts or assist, the same bombs at the same heights, link round trip, sharing, who won), `museum` (the screen, every look, sharing, hostile saves), `devices` (tall iPhones, tablets, iPad detection, safe areas, no white edges, launch images, desktop, the iOS 26 dead strip, the layout info card), `update` (the Update ready button after a round, progress kept), `audio` (interrupted/suspended/closed contexts, the iOS silent switch, a 120 s music-scheduler soak), `power` (the boost handle and menu: when it shows, the slow-to-stop, only the picked boosts, swipe up, each boost's effect and reasons, Back/Escape/B/Pause, the Auto-use setting), `shop` (every tab, buying and previewing, hostile saves, every look and sound, the boosts in play, boosted-run records, gifts, and the purchase code against a fake Google Play store), `regress` (bugs found by review and the monkey), `monkey` (a seeded random player on the virtual clock: taps, buttons, keys, tab switches, resizes, languages, themes, modes; `MONKEY_SCALE=5 node tests/run.js monkey` for a long hunt), `security` (hostile save codes, debug hook off the public site) and `offline`. GitHub Actions runs them on every push (`.github/workflows/test.yml`). The layout checks depend on the font: GitHub's runner uses DejaVu Sans, which is wider than Inter, Roboto or SF, so if a test passes on your machine but fails in CI, the font is the first suspect.

## Store assets and promo video
All generated from the real game (a bot plays it on a virtual clock), so they stay in sync with the UI. Needs Playwright; the video also needs `ffmpeg`. For Hindi/Korean/Japanese/Chinese pictures, install fonts such as `fonts-noto-cjk` and `fonts-noto-core`.
```
npm run assets                       # store/screenshots/<lang>/*.jpg (1080x1920) + store/feature-graphic/<lang>.jpg (1024x500)
node tools/make-store-assets.js --lang en,es --only gameplay,menu
npm run video                        # store/promo/stack-rush-promo.mp4 (30 s, 1080x1920, with the game's own sound)
node tools/make-promo-video.js --dry # fast low-res preview that prints the timeline
npm run listing                      # store/listing/<lang>.md (title, short and full description, release notes; limits checked)
npm run products                     # the in-app product ids and prices (for the Play Console)
npm run splash                       # iOS launch images in splash/ and the <link> tags in index.html
```
Captions in the pictures and the video, and the listing texts, are machine-written (see Languages). The Play Console takes the promo video as a YouTube link, so upload the MP4 to YouTube first.

## Android / Google Play
The game is meant to be wrapped as a **Trusted Web Activity** (the same site in a thin Android app). The purchase code for **Google Play Billing** (through the Digital Goods API) is already in `index.html`, but it has only been run against a fake store: **nothing has touched the real Google Play yet**, and the app has not been built. Everything you have to do (accounts, the Bubblewrap build, the web-address/`assetlinks.json` catch, the ten product ids, server-side verification, testing) is in [`android/README.md`](android/README.md). `npm run products` prints the product table. Google requires Play Billing for digital goods inside the app, so the app never opens a Square link.

## Before publishing to Google Play
- [ ] Put a real contact email in `privacy.html` (it currently has a placeholder) and host it at a public URL. The policy is English only.
- [ ] Create a Google Play developer account ($25 one-time).
- [ ] Follow `android/README.md`: build the wrapper, create the ten in-app products, add the verification server, test every purchase in the closed-testing track with licence testers.
- [ ] Upload `store/screenshots/<lang>/*`, `store/feature-graphic/<lang>.jpg`, the 512px icon (`icons/icon-512.png`) and the texts from `store/listing/` (have natives check them first).
- [ ] Complete the Data safety form (this version collects no data) and the content rating questionnaire.
- [ ] Choose the final name. "Stack Rush" is already the title of at least three Play Store apps, and a similar name invites impersonation or trademark complaints. The package id is what identifies the app; the title does not have to be unique, but should be distinctive. Check trademark databases for the name you pick (this project has not done a trademark search).
- [ ] Test on a real Android phone, including install, offline, share, vibration and purchases.

## Known limitations
- **Not tested on real devices.** All testing is headless Chromium with emulated phones/iPads. A band at the bottom of an iPhone was seen on a real phone and the fix above is a best guess. iOS Safari (WebKit) behaves differently in places: the white-bar fix, the iPad layout and the iOS audio fixes (silent switch, interrupted audio) are based on how WebKit is documented to behave and could not be checked on an iPhone here.
- **Translations are unreviewed machine output.** Plural forms are avoided rather than handled (e.g. "days" is abbreviated in Russian).
- **Purchases are not enforced** on the web version (see above). The Play Billing code is written but **untested against the real store**, and there is no server to verify purchase tokens or take back refunds yet (see `android/README.md`).
- **Challenge links are not signed:** the score in a link can be edited by hand. There is no server to check it, and nothing is at stake except bragging rights.
- **Boost and shop balance is a first guess:** prices, the Slow-Mo/Regrow thresholds and the gift schedule have not been tested with real players.
- No cloud save: progress lives in the browser; the save code is the only transfer method. Clearing site data erases it.
- The Back button (see above) has only been tested with `history.back()` in headless Chromium, which is what Android Back does inside the page. Not tried on a real phone.
- Difficulty numbers in `CFG` are first guesses and need real-player testing.

## Tuning
Difficulty lives in the `CFG` object at the top of the script (`baseSpeed`, `rampMax`, `perfectPx`, `regrowAfter`, `bombChance`, ...).

## Testing hook
Open the page with `#debug` in the URL to expose `window.__sr` for automated tests and the tools. This only works on `localhost`, `127.0.0.1` or a local file, never on the public site (a test checks that).


## Campaign World 5: Caverns
Stages 25 to 30 (the last is a boss; stage 25 opens when you clear stage 24): harder than World 4 (narrow start, fast blocks). Caves are **dark**: only the top of the tower is lit by a flickering lantern. **Tremors** (a gust with a shake) rock the tower. **Lava blocks** (glowing, cracked, with rising embers) melt the two blocks under them when they land: the melted blocks run down in glowing drips, the lava block sinks onto what is left and cools, the tower ends one block lower than before, and the base is never melted. Lava is seeded by height like the other hazards. The stage picker, stars and saves handle any number of worlds.

## Campaign Worlds 6 and 7
**World 6, Crystal Depths** (stages 31 to 36): very hard. Some blocks **turn round part-way across** (seeded by height, so it is the same every time you play that stage), together with ice, glue and wind; the boss (36) mixes all three. **World 7, Magma Core** (stages 37 to 42): every hazard together (lava, ice, glue, wind, bombs, darkness) with fast blocks and a narrow start. **The final boss (stage 42) randomly turns the screen upside down for about three seconds, then back** (with a warning banner and a smooth half turn); *Reduce motion* keeps it the right way up. 42 stages, 126 stars in all; each world cleared pays the 100-coin world bonus. These worlds are tuned to be hard: the numbers are first guesses and need play-testing.

## Campaign power-ups and relics (campaign stages only)
Four power-ups that are **earned, never sold**, and only appear in campaign stages (the bolt menu lists any you own; they are used up but do not make the round "boosted"): **Titan** (your block cannot shrink for 10 drops, golden frame with the drops left), **Magnet** (the next 5 near drops snap onto the tower and count as perfect), **Freeze** (the block stands still for 2 seconds) and **Second Wind** (+1 life, up to 5). Earn them from **relics**: some campaign blocks carry a floating cyan gem (seeded by height); land that block perfectly to take it (+6 coins), and every third relic gives a power-up. The first clear of each boss gives two power-ups. The **Every Star** award is the one for 3 stars on every campaign stage.

## Rare awards, exclusive themes and lofi
**Rare awards** (gold frame, a RARE tag, big coins and a free reward): *Cave Diver* (clear World 5, 300 coins, **Crystal Cavern** theme), *Crystal Master* (World 6, 400, **Amethyst**), *Core Conqueror* (World 7, 600, **Obsidian**), *Glowworm Guide* (3 stars on every World 5 stage, 500, **Glowworm**), *Flawless Start* (3 stars on every stage of Worlds 1 to 4, 400, the Stars landing effect), *Untouchable* (beat a boss without losing a life, 350, the Star topper), *Boss Hunter* (all seven bosses, 500, the Flag topper), *Relic Hunter* (50 relics, 300, the Confetti effect) and **Every Star** (3 stars on every campaign stage, 1,000 coins, the **Void Crown** theme). Those themes cannot be bought: in the Shop they show which award unlocks them. **Music:** Lofi Chill, Lofi Rain (more crackle, like rain) and Cave Echo (long notes with echoes), in the Shop > Music tab (600 coins each). They are synthesized in the app, not recordings: each lofi style is a small band of its own (a swung drum loop with kick, snare or rim click and hats, warm electric-piano chords on a four-chord loop, a bass line, a soft melody figure and vinyl hiss or rain), with no random notes. The combo still builds it (more hats, a little louder).

**Race codes:** a friend who already has the app does not need a link. On the game-over screen of a Friend race round (**Copy code**) and on the Friend race sheet (**Copy my code**) the plain race code is copied; the friend pastes it under *Friend race > Paste a friend's challenge*. The Share button (link, "Can you beat it?") and pasting links work exactly as before. The code carries your whole tower, so it is long (hundreds of characters); a really short code (a few letters) would need a server to store the rounds.

**More awards (63 in all):** On Fire (15 in a row), Perfect Machine (5,000 perfects), Stratosphere (200 blocks), Time Lord (100 in Timed Rush), Hooked (500 rounds), Two Weeks Strong / Loyal Fan (14 / 30-day streaks), Master and Legend (levels 15 / 20), Bomb Whisperer (300 bombs), Iron Wall (25 shields), Twist Veteran (10 Daily Twists), Rival Regular (5 friend wins), Gem Spotter (10 relics), Skyline Champion (World 4) and Deep Core Complete (all 42 stages). A round started from the Friend race menu is sent as a code (Copy code); Share (the link) stays for every other round.

## Pass and play (one phone, two players)
*Game modes > Friend race > Pass & play* (pick the mode first). **Player 1** plays a round, then a card says *Player 1 scored N. Pass the phone to Player 2!*; **Player 2** plays **the same round** (same seed, so the same hazards) with Player 1's tower building as the faded ghost, and the result says who won (or a tie). No boosts in pass and play, it does not touch the friend history or the friend-win count, and **AGAIN** is a rematch starting with Player 1. Ordinary coins for the rounds are paid as usual.

## Lava: skipping, Water, and relic limits
**Skip lava:** a lava block that you do not tap **drifts away after about 4 seconds** (it blinks near the end) and the next block comes, with no penalty (it used to slide across the screen for ever, which looked like it was floating). **Water** (a new campaign power-up, earned like the others, and you get 2 free the first time you enter the caves) cools lava for 6 drops: the lava block turns blue and just lands like a normal block, with a blue frame on the tower. **Relics** now appear at most 3 times a round, never again at a height you already took one (going down with lava and up again used to bring the same relic back), and not on stages where you already have 3 stars.

**World 7 music:** the Magma Core stages (37 to 42) have their own track, **Magma Core**: a heavy 104 BPM minor groove with pulsing saw bass, kick, snare and hats, slow-opening dark pads, a Phrygian riff (doubled an octave up on boss stages and when the combo is high), a snare roll every fourth bar and crackling embers. It plays automatically in those stages and is not in the shop.

**Lava, final rule:** tapping a lava block anywhere knocks it off: it falls away, the tower is not touched and no life is lost (even if it is nowhere near the tower). Untouched, it drifts away after about 4 seconds. With **Water** active it turns blue and lands like a normal block instead.

## Hazard difficulty
Tapping **Hazard** on Game modes asks for a level: **Beginner** (bombs only at first, ice and glue late and rare, no wind, slower blocks, coins x0.8), **Medium** (the original Hazard), **Advanced** (ice, glue and wind from the start, more often, more bombs, faster, a narrower start, coins x1.2) and **ULTRA** (lava on top of everything, tremors, blocks that turn round, the upside-down screen, the narrowest start, the fastest blocks, coins x1.5). Each level keeps its own best score (the best-run outline is only for Medium). Friend races and pass and play in Hazard always use Medium so both players get the same round.

**Sheet buttons:** every sheet (Boosts, Coins, Friend race, Hazard difficulty, the in-game boost menu) keeps its bottom buttons (Done, Close, Keep playing) pinned at the bottom of the card, and sheets now sit above the menu's bottom bar (in performance mode the bar used to paint over the sheet and hide the Done button). A test opens each sheet on phones and iPads, with performance mode on, and checks the bottom button can be tapped without scrolling.

**Fixes (campaign):** the Crystal Depths / Magma Core "blocks that turn round part-way across" were removed (a block bouncing off nothing in the middle of the screen looked like a glitch); those stages are as hard as before through speed, hazards and the narrow start. **Lava, final rule:** a lava block that lands on your tower melts the 2 blocks under it; tap it while it is **not over the tower** and it is knocked off safely (SKIPPED, nothing lost); leave it and it drifts away; Water cools it.

**Hazard difficulty on PLAY:** the main PLAY button asks for the Hazard level whenever Hazard is the selected mode (the Game modes tile does too); AGAIN keeps the level you just played.

**Ice and Revive + Regrow:** an ice block slides on after the tap and now **settles in place**: if the slide carries it over the tower it stops aligned (a perfect), instead of sailing past and being chopped off; tapped too early to reach the tower it still falls. On the game-over screen a second button, **Revive + Regrow (120 coins)**, carries on exactly like Revive (60) but with the tower back at its full width.

**Now playing:** while the game makes sound, a car stereo, Bluetooth speaker or lock screen shows **Stack Rush** (title, artist and album, with the app icon) instead of the web address, through the Media Session API; a stereo's pause button pauses the round.

## Special events (Aurora Peak, 14 Nov to 14 Dec 2026; then Ember Throne, 14 Jan to 14 Feb 2027)
An ultra-rare, one-off map. While an event is on, a glowing card with a live countdown sits on the menu. **Entering costs 20,000 coins, once, no refunds.** The map is the same very hard stage every attempt (fixed seed, every hazard, no boosts); you get **100 attempts** and the goal is **1,000 score**. A big segmented progress bar shows your best, with **milestone chests at 250, 500 and 750** (coins and items: the consolation prizes, 9,000 coins in all). At 1,000 you can **hatch the egg**: press and hold for about 15 seconds while it shakes, cracks and glows (letting go loses almost nothing), then it bursts with a celebration and the rewards are revealed one by one: 5,000 coins, an exclusive **theme**, an exclusive **super rare topper** and **super rare awards** (gold-violet glowing). Event items cannot be bought and never come back; each event has different ones (Aurora Peak: the Aurora Peak theme and Aurora Spirit; Ember Throne: Ember Throne and Ember Cat). A **Hall of Eggs** lists the eggs you hatched (and ??? for the ones you did not). Awards: Event Entrant, First Egg, Egg Collector (3 eggs), Aurora Champion, Ember Monarch. Honest limits: dates and the once-only rule are checked on the device (no server), so changing the phone's clock or clearing the app's data can get around them.

**Event extras:** while you are in the event: **+100 attempts for 5,000 coins** (as many times as you like) and an **Easier map for 9,000 coins** (once: speed-up and hazard chances halved, hazards start later, a wider start, no tremors or upside-down screen). **Power-ups work in the event** (Shield, Slow-Mo, Regrow and the campaign power-ups such as Water and Titan) but not the Speed-ups, since free score would buy the egg. **Reminders:** a big glowing banner the first time the app opens with **10, 5 and 3 days left**, and a red **LAST DAY!!** one, each once (a reminder that was skipped is not shown late); tapping it opens the event, and it never stays over a round. The event sheet has a floating egg that cracks as you get closer, chest and egg markers on the progress bar, and a Keep going section for the two purchases. Tests run on a fixed date with no event, so they do not depend on today's date.

**Event bonus and fixes:** hatching the egg within the first 100 attempts, without buying extra attempts, pays a **50,000 coin bonus** on top (the rules, the progress screen and the hatch reveal say so; buying the first +100 asks for a second tap because it gives the bonus up). Tapping Enter without 20,000 coins now shows, inside the sheet, how many coins are missing with a Get coins button (it used to show a message hidden behind the sheet); messages now always appear above sheets.

## More sounds, songs, themes and 3D Blocks
**Sound packs** (Shop > Sounds): besides Classic, Retro and Soft there are **Marimba, Kalimba, Music Box, Piano and Bubble Pop** (600 to 800 coins). They play the game's musical sounds (perfects, rewards, taps) on an instrument voice and stay an octave lower, so a long perfect streak no longer climbs into shrill notes; a miss or a bomb keeps its own (softened) sound. **Songs** (Shop > Music): **Jazz Café** (swung jazzy chords with drums), **Dreamscape** (slow, sparse, echoing) and **Synthwave** (four-on-the-floor kick, saw bass, arpeggio). **Themes**: Midnight Drive, Autumn, Coral Reef, Matcha. **3D Blocks** (Shop > Blocks, 25,000 coins): every block is drawn as a solid box with a lit top and a shaded side; it is a 3D look on the same game, not a separate 3D engine.

**Feel and polish:** the screen edges glow in the theme's colour as the combo grows (from x3, pulsing), a sweep of light runs up the tower at every 10th perfect in a row (both off with Reduce motion), the menu items rise in one by one, the logo shimmers, and levelling up gives confetti bursts and a pop on the game-over screen.

**Daily missions and the login strip** (Awards screen): three small missions a day (picked by the date: perfects, blocks, rounds, height, combo, score), each paying coins the moment it is done, plus 40 coins when all three are done; they reset every day. Above them a **7-day login strip** shows today's reward in the streak (the daily bonus itself is still claimed on the menu).

**Pets:** the animal on top of your tower now reacts: it hops and wiggles at a perfect (higher the longer the combo, off with Reduce motion) and flinches, shuts its eyes and squashes at a miss or a bomb. New toppers in the Shop (900 to 1,100 coins): **Bunny, Puppy, Panda, Teddy bear and Fox**.

**Accessibility** (Settings): **Colour-blind colours** (blocks run blue to violet in clear light and dark bands, no red and green; ice, glue and lava are also told apart by their patterns), **Bigger text** (menus and screens zoomed up) and **One-handed mode** (a Back button at the bottom-left of every sub-screen, within thumb reach). All remembered.

**Boss Rush** (Game modes, unlocked once you clear the first campaign boss): the seven campaign bosses back to back with your lives carried over (+1 after each boss, up to 5). Beating all seven pays 500 coins on top of 60 per boss; losing pays 60 per boss beaten. It never changes your campaign stars or progress. Your best count is shown on the tile.

**Photo mode** (pause screen): a framed picture of your tower right now (gold, neon or clean frame) with the title and your score at the top, to save or share. **Your best runs** (Awards): your ten best rounds across Classic, Timed Rush, Lives, Hazard and the Daily Twist, best first, with mode, height and date.

## 3D Mode

Blocks tab → **View** → **3D Mode** (50,000 coins). It is a real perspective camera, not a drawing trick: every block is a solid box with a lit top and shaded sides, the camera looks down at the tower from an angle and drifts slowly around it (faster with a big combo), blocks shrink with distance, and the tower stands on a grid floor with a shadow. Ice, glue, lava, bombs, relics, falling pieces, rings, the friend's race tower and your tower topper all work in 3D, and two thin guide lines show where the moving block would land. The rules, taps and scoring are identical to the flat view; Reduce motion stops the camera drifting. Flat view stays free and is the default.

### 3D scenes

With 3D Mode unlocked, Blocks tab → **3D Scene** swaps the grid floor for a whole world behind your tower (6,000 coins each; tapping one in the shop previews it in 3D first):

- **Deep Ocean** – sunbeams, drifting fish in three depth layers, a school of silver fish, glowing jellyfish, bubbles, a distant shark, and a seabed with coral and seaweed. As you climb you rise from the dark deep towards the bright surface.
- **Golden Sunset** – a huge sun over a glittering sea with a gold path on the water, lit clouds and birds. The sun sinks as your tower grows, through magenta dusk into a starry night.
- **Mountain Lake** – layered snow-capped peaks, mist, pines and a still lake that reflects them. As you climb you rise through the clouds to a starry sky with an aurora.

- **Outer Space** – a ringed planet, nebulae, three layers of twinkling stars and shooting stars over a cratered moon; climb and the sky fills with stars.
- **Neon City** – a rainy cyberpunk skyline with lit windows, neon signs and flying cars over a wet street.
- **Desert Dunes** – noon sun, pyramids and layered dunes; the light turns gold and then a starry desert night as you climb.
- **Aurora Tundra** – ribbons of northern lights over snowy pines and a frozen lake that reflects them; more ribbons as you climb.

Scenes are drawn in code (no image files), calm down with Reduce motion, and use fewer effects in performance mode.

## Boss Rush: the Gauntlet

Boss Rush now has **37 bosses**: the seven campaign bosses, then a **Gauntlet of 30 more bosses that exist only here** (rising speed from 1.75× to 2.35×, rotating mixes of lava, ice, glue, wind, bombs, tremors, darkness and the upside-down screen). Lives carry over (+1 after each boss, up to 5). Every 10th boss is a **checkpoint**: after a loss the end screen offers *Resume · Boss N*.

Pay (all coins are paid when the run ends): 60 per campaign boss, 100 per Gauntlet boss, 250 at each checkpoint, +500 for the first seven, **+5,000 for all 37**. Awards: *Rush Survivor* (all seven, 150 coins), *Gauntlet Runner* (reach boss 20, 400 coins, Rare) and *Rush Legend* (all 37, 2,500 coins, Super Rare, unlocks the exclusive **Champion Cat** topper). Nothing here changes your campaign progress.

## Season Pass

Tap **Season** on the menu. A season lasts two months (Frost, Blossom, Sunburst, Ocean, Harvest, Midnight; they return every year). Every round earns season XP (and finishing daily missions adds more); every 200 XP is a tier, 30 tiers in all. The **free track** pays coins and boosts on every tier plus the season's colour palette at tier 10. The **Premium track** (8,000 coins, one season) adds a second reward on every tier: coins, boosts, Mystery Boxes, and a season-only cat at tier 15. Tap a reward to claim it, or **Claim all**. Anything you earned but did not claim is collected for you when the season ends, so nothing is lost. Zen and Practice do not give season XP. (Premium is bought with coins for now; paying real money for it needs the store connection.)

## Mystery Boxes

Shop → **Boxes**. 1,500 coins for one, 6,750 for five (also found on Premium tiers). Every box holds **one cosmetic** (cat toppers, colour palettes, block styles, effects, sounds, songs, app colours; never anything that helps you win). The odds are listed in the shop: Common 55%, Uncommon 28%, Rare 11%, Epic 5%, Legendary 1%. Every item in a rarity is equally likely, a Rare or better is **guaranteed within 10 boxes**, and a duplicate pays coins back (150 / 400 / 900 / 2,000 / 4,000). **Coin prizes:** an Epic box has a 35% chance (1.75% of all boxes) of being a coin prize of 2,000 to 5,000 coins instead of an item, and a Legendary box a 25% chance (0.25% of all boxes) of a 10,000 to 20,000 coin jackpot. Box-only items include Mochi, Storm, Mint and Shadow cats (Rare), Nebula, Crystal and Inferno cats and the Prism palette (Epic), and the Cosmic Cat (Legendary).

**Season pass, the exciting version:** a tier ring and shimmering banner, a "Next up" preview of the next free and premium rewards, milestone rows (every 5 tiers) with item pictures, a Premium card that shows exactly what you would unlock, a +50 XP bonus on your first round of each day, sparkle bursts when you claim, and a "Jump to my tier" button. **Coin prizes:** Epic and Legendary boxes can also pay coins (see Mystery Boxes). **iPad:** all ten shop tabs now fit on screen (no sideways scrolling) and items use three columns.

## Split screen: 2 players at once

Modes → **Split screen** (a one-time introduction pops up the first time you open the game after the update). Two players, one device, playing **at the same time**: the screen is cut in two and each half is its own copy of the game, so both players have their own taps.

- **iPhone:** the top half is upside down so you can sit face to face. **iPad / computer:** choose **Face to face** (top half upside down, great flat on a table) or **Side by side** (both halves upright).
- **Rounds:** best of 1, 3 or 5. A round is one Classic run each (one life, same speed). It ends when both players are out, or **as soon as the player still going passes the one who is out**. The taller tower wins the round, a draw is played again, and each half shows its own "YOU WIN!" / "YOU LOSE" the right way up. After the match: Rematch or Menu.
- 3-2-1-GO before every round, a pause button in the middle (also the Back button), and each half shows the other player's live score. If someone stops tapping, they are counted out after 25 seconds, and if the other player is already out, the quiet one loses after 15 seconds, so a round can never stall.
- Split screen never touches your coins, best scores, awards or save (each half is a guest game that saves nothing).

**Event map changes:** the speed on the special event map is now capped at **x2** (the normal speed-up, the map's own x1.6 and wind included). After an attempt ends you can pay **1,500 coins** to **continue from where you fell**: the same map, with your tower and score as they were. It uses up one of your attempts, so the attempt limit still means something. A continued attempt gets its top block back at full width and runs 0.5x slower than normal (a x1.5 limit). Your tower is also saved when an attempt ends or when you leave the event mid-run (the deepest one is kept, and it survives other modes and closing the game), so later you can open the event and choose **Continue where you left off** for **2,500 coins**. It is only offered on the event map, while you have attempts left.

**Attempts and Resizes on the event map:** the number of attempts you have left is shown under the score during every attempt (a continue counts as one). When your tower reaches **150 blocks** you are told and automatically get **3 Resizes**: open your power-ups (the bolt button) and use one to put your top block back to full width. They only exist inside that attempt (they are not in the shop or your saved boosts), they are given once per attempt, and a tower you continue from past 150 blocks starts with them.

## Event: harder, TRIPLE OR NOTHING, next event

- **Difficulty:** the event map is hard again (a little harder than the first version, with no speed cap).
- **TRIPLE OR NOTHING** (after you hatch the egg, and only if you have more than 30,000 coins): pay **85% of your coins** (a second tap confirms), then beat the same hard map in **under 25 attempts** (24, counted separately, no extra attempts, continues or easier map). Win and you get **3x the coins you had** (+360,000 if you had 120,000); run out of attempts and the stake is gone. One go per event.
- **Next event (Ember Throne):** entry costs **35% of your coins** (never less than 20,000); the goal is **2,000 instead of 1,000 only if you hatched the Aurora Peak egg** (chests move with it); the map is harder; the chests also pay Mystery Boxes (10 / 20 / 30) and the egg pays 15,000 coins and **100 Mystery Boxes**.
