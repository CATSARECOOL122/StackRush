# Stack Rush

Tap to drop the sliding block onto the stack. Land it exactly for a bonus. Miss and it's over.

Single static file: `index.html`. No build step. Host on GitHub Pages, Netlify, or Cloudflare Pages.

## Cosmetic themes
Themes are cosmetic only. Set the Square payment link for each theme in `SQUARE_LINKS`, with the post-payment redirect set to `<your-site>/?unlock=<theme>`.

Unlocks are stored in the browser, so this is a soft paywall: anyone can add `?unlock=ocean` to the URL. Fine for a test; real enforcement needs a backend that verifies payments.
