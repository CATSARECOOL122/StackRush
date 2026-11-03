# Stack Rush on Google Play (Android wrapper)

**Honest status:** this folder is a checklist plus templates. Nothing in it has been run against Google Play, and the purchase code in
`index.html` (`playBuy`, `finishPurchase`, `syncPurchases`, `loadPlayPrices`) was written from the documentation and only exercised
against a **fake** store in `tests/shop.test.js`. That proves the game's own logic (grant once, consume or acknowledge, restore, prices)
but not that the real store behaves the same. Plan for a round of testing in Play's closed-testing track before anything goes public.

The wrapper is a **Trusted Web Activity (TWA)**: a thin Android app that opens this same website full screen in Chrome. There is no second
codebase: when you update the site, the Android app updates with it (no new Play release needed unless the wrapper itself changes).

## 1. What you need first

| Thing | Notes |
|---|---|
| Google Play developer account | One-time fee. Verify your identity. A **merchant (payments) profile** is needed to sell in-app products. |
| Closed test before launch | Personal accounts created after November 2023 had to run a closed test with at least 12 testers for 14 days before production. Check the current rule in the Play Console, it changes. |
| Android developer verification | Google is rolling out mandatory developer verification (some countries from September 2026, more later). Check the current dates. |
| A final name | The **package id** below is permanent once uploaded; the display name is not. See the naming notes in the project README. |
| Node.js and a JDK | For Bubblewrap (below). Or use [PWABuilder](https://www.pwabuilder.com), which produces the same kind of package from a web address with no install. |

## 2. The web address (read this, it trips people up)

A TWA is only trusted full-screen if the website *proves* it belongs to the app, with a file at
`https://<host>/.well-known/assetlinks.json` (Digital Asset Links). That file has to be at the **root of the host**.

The game is currently served from a GitHub Pages **project** site, `https://catsarecool122.github.io/StackRush/`. The root of that host,
`https://catsarecool122.github.io/`, belongs to a *different* repository named exactly `catsarecool122.github.io` (a "user site"). So pick one:

1. **Create the user-site repo** `catsarecool122.github.io`, put `.well-known/assetlinks.json` in it (GitHub Pages serves dot-folders only when the
   repo contains an empty `.nojekyll` file), and keep the game at `/StackRush/`. Cheapest, no purchase.
2. **Use a custom domain** for the game (a domain costs money per year) and put the file in the game repo. Cleaner, and lets you rename the game
   without the address ever changing.

If you launch under a different address later, the Android app has to be rebuilt and re-released. The address is baked into it.

`assetlinks.template.json` (next to this file) is the file to publish. Replace the fingerprint with the SHA-256 of the **app signing key**.
If you let Play manage signing (the default and the recommendation), that is the key shown in *Play Console, Test and release, App integrity*,
**not** the upload key you sign with locally.

## 3. Building the Android package with Bubblewrap

```bash
npm install -g @bubblewrap/cli
mkdir stackrush-android && cd stackrush-android
bubblewrap init --manifest https://catsarecool122.github.io/StackRush/manifest.json
```

Answers worth knowing (the tool asks interactively and writes `twa-manifest.json` itself; field names change between versions, so let it
generate the file rather than copying one from here):

* **Application ID / package name:** `io.github.catsarecool122.stackrush` (any reverse-domain you own or the GitHub convention above). Permanent.
* **Host:** `catsarecool122.github.io`, **Start URL:** `/StackRush/` (or your custom domain).
* **Display name / launcher name:** the final game name (30 characters max on Play).
* **Orientation:** portrait. **Theme and background colours:** `#14102b`.
* **Icon:** `icons/icon-512.png`. It is full-bleed art with the tower in the middle, which suits a maskable icon, but the sparkle in the corner is
  close to the edge of the safe circle; if it gets clipped on your phone, make a version with a little more margin.
* **Enable Play Billing: yes.** (In recent Bubblewrap versions this is the `playBilling` feature and needs the "alpha dependencies" option.)
* **Signing key:** create one and **back it up somewhere safe** (lose it and you cannot update the app).

```bash
bubblewrap build        # produces app-release-bundle.aab (upload this) and an .apk (install on your phone to try it)
bubblewrap fingerprint  # prints the SHA-256 of your local key
```

Install the `.apk` on a real phone first. Check: it opens full screen with no address bar (if there is one, `assetlinks.json` is not
reachable or the fingerprint is wrong), portrait only, sound works, the shop opens.

## 4. Play Console checklist

* **Store listing:** text from `store/listing/<language>.md`; screenshots from `store/screenshots/<language>/`; feature graphic from
  `store/feature-graphic/<language>.jpg`; promo video `store/promo/stack-rush-promo.mp4` (upload it to YouTube and paste the link).
* **Privacy policy URL:** `https://catsarecool122.github.io/StackRush/privacy.html`. Update the page first: it must mention purchases, and the contact
  address in it is still a placeholder.
* **Data safety form:** the game keeps everything on the device and has no ads, analytics or accounts. Purchases are processed by Google Play.
  If you add anything that sends data off the device, update this form and the policy.
* **Content rating questionnaire** and **target audience**: answer honestly. If the audience includes children, stricter Families rules apply.
* **In-app products** (next section), then **licence testers** (Settings, License testing) so you can buy for free while testing.
* **Name:** titles on Play do not have to be unique (the package id is the identity), but another app can still file an impersonation or
  trademark complaint against a confusingly similar name, so pick something distinctive. See the project README.

## 5. In-app products

Create each as an **In-app product** in *Monetize with Play, Products, In-app products*, with **exactly** this product id. Prices are suggestions;
Play converts them to local currencies and the game then shows the local price (it asks Play for it through the Digital Goods API, the dollar
amounts in the code are only a fallback). Generate this table any time with `node tools/list-products.js` (a test keeps it in sync with the code).

| Product id | Type | Price (USD) | Title |
|---|---|---|---|
| `item_coins_s` | consumable | $0.99 | 600 coins |
| `item_coins_m` | consumable | $2.99 | 1800 coins |
| `item_coins_l` | consumable | $4.99 | 4000 coins |
| `item_coins_xl` | consumable | $9.99 | 9000 coins |
| `item_starter` | one-time | $2.99 | Starter pack |
| `item_gold` | one-time | $1.00 | Gold Rush theme |
| `item_galaxy` | one-time | $1.00 | Galaxy theme |
| `item_cyber` | one-time | $1.00 | Cyber City theme |
| `item_style_foil` | one-time | $0.99 | Foil block style |
| `item_topper_gold` | one-time | $0.99 | Golden cat tower topper |

"Consumable" means the app *consumes* the purchase after granting coins so the player can buy again; "one-time" items are acknowledged and
can only be bought once per account (the Starter pack is one-time on purpose).

What is in a Starter pack: 1000 coins, 2 of each boost, the Neon block style and the Black cat topper.

## 6. How the app uses the store

* **Only inside the Android app.** The code treats the page as "in the app" when `document.referrer` starts with `android-app://` and
  `getDigitalGoodsService` exists. In that case every purchase goes through Play Billing and **never** to a web checkout (Google requires Play
  Billing for digital goods in the app). On the open web the same buttons use a Square link if you set one in `SQUARE_LINKS` (cosmetics only), or
  say "Store is not connected yet".
* **Coins and boosts are sold in the app only.** The Coins tab is shown in the Android app; on the web it is a preview until you set up a web store, and
  then it disappears.
* **A purchase is granted once per purchase token** (the last 40 tokens are kept in the save), then consumed (coin packs) or acknowledged (the rest).
  So if the app is closed or offline between "paid" and "consumed", the next start-up sync finishes the job without giving the coins twice.
* **Restore:** on start-up (silently) and from the "Restore purchases" button, the game asks Play what the player owns and gives it back **without
  switching what they have equipped**.
* **Google refunds a purchase that is not acknowledged within 3 days.** The code acknowledges right after granting, and again on the next start-up
  sync. I could not load the current Chrome documentation from the build environment, so **check that `acknowledge()` is still how the
  Digital Goods API wants it** (the code skips it if the method does not exist). If it does not exist, confirm Chrome acknowledges for you, or
  acknowledge from your server (below).

## 7. Not done yet (do these before launch)

1. **Server-side verification.** Today the app trusts the purchase result on the device. For a single-player game with no online scores that is a
   small risk (a player can already edit their own save), but without a server you also cannot see refunds. The proper version: a tiny
   server (a Cloud Function is enough) that receives `purchaseToken`, checks it with the Google Play Developer API
   (`purchases.products.get`), acknowledges it, and only then tells the app to grant. There is a `TODO` at that spot in `playBuy`.
2. **Real-store testing** in the closed-testing track with licence testers: buy each product, cancel mid-way, buy with no connection, reinstall and
   restore, buy a coin pack twice in a row, change the phone language.
3. **Refunds** are not taken back by the app (needs the server above).
4. **Policy re-check.** The rules above come from secondary sources, because Google's own pages could not be reached from the build environment.
   Read the current Play policies for in-app purchases, families/children, and impersonation before you submit.

## 8. After launch

The Android app shows whatever the website serves, so shipping a fix is just pushing to the site (the service worker updates the installed app on
its next start). You only publish a new Android release to change the wrapper itself (icon, name, package settings, target SDK; Google asks for a
newer target SDK about once a year, so expect to rebuild with the latest Bubblewrap annually).
