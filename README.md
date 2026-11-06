# divPointers — Swarm AI Pointers

> **Swarm AI cursor agents that rebuild any web page live.** A multi-agent swarm
> of pointers erases the page, then works together like AI agents to redraw it.

**Keywords:** swarm AI · AI swarm · swarm pointers · swarm agents · multi-agent ·
AI agents · AI cursor · cursor animation · Chrome extension · browser extension

A browser extension that erases any web page down to nothing, then has a crew of
cursors put it back together live: crosshair-drawn boxes, typed text, pen-tool
lines, ruler guides and ⌥-drag duplicates, until the page looks just like it did
before — complete with a synthesized soundtrack, one-click video recording (WebM
or MP4), and a cursor look you can switch between flat solid and a soft outer
glow.

Author: Nitin.

## Install (unpacked)

1. Open `chrome://extensions` (or `arc://extensions` in Arc) and turn on
   **Developer mode** (top right).
2. Click **Load unpacked** and choose this folder — the one with
   `manifest.json` directly inside it.
3. Pin it (puzzle icon → pin).

## Use

- Click the toolbar icon or press **Ctrl+Shift+D** on any page.
- The page fades out and the cursors orbit the site's favicon, then fan out and
  start building.
- **Scroll** and the cursors chase you, with more agents joining the faster you go —
  this works in any scrollable container on the page (a sidebar, an inner panel),
  not just the page's own main scroller.
- The real page underneath keeps working the whole time: click into a real search
  box or form field and type into it normally, exactly as if the rebuild weren't
  there. The rebuild is purely visual — it never blocks the page's own inputs or
  scrolling.
- **Tour** auto-scrolls at the pace it can keep up with. Good for recordings.
- **1× / 2× / 3×** changes build speed.
- **Cursor look** button (or **Ctrl+Shift+L**) switches the cursors between a flat
  solid fill and a soft glow — each cursor radiates a halo of its own color, like
  light reflecting outward from it.
- **Record** (or **Ctrl+Shift+V**) captures the whole rebuild as a video: a one-time
  browser share-picker appears (pick "this tab," tick "share tab audio" to include
  the soundtrack), then click again to stop and download the file. Clicking
  **Replay** mid-recording doesn't cut it off — one recording can span several
  rebuilds. A **WebM / MP4** switch sits right next to it, in the same control (a
  fixed width, so switching labels never nudges the rest of the bar), when your
  browser can mux MP4 (most current Chrome/Edge) — pick whichever your other tools
  prefer. (True `.mov` isn't something a browser can produce without extra
  server-side or WASM tooling, so the real choice on the web platform is WebM vs.
  MP4.)
- The **?** button opens a small shortcuts legend right above itself.
- **Sound** is on by default (speaker icon in the toolbar, or **Ctrl+Shift+S**). If
  the page hasn't been clicked yet, Chrome keeps audio locked and the button says
  **Tap for sound**; one click anywhere starts it.
- **The toolbar can be moved or tucked away.** Drag it from any blank spot on the
  bar, or by the chevron icon itself, to reposition it anywhere on screen — it
  remembers where you left it. That chevron (or **Ctrl+Shift+H**) collapses it
  down to a small nub when you want it out of the way entirely; since collapsing
  hides every other button, the nub is still draggable by the same icon, so a
  tucked-away bar never gets stuck in an inconvenient spot. Click the nub, or the
  same shortcut, to bring it back. Position, collapsed state, and orientation
  (see next) all persist across rebuilds.
- **The toolbar can lay itself out vertically.** The icon next to Sound flips it
  between a row and a column — handy if you'd rather it sit flush against the
  left or right edge of the screen instead of the top or bottom.
- Every letter shortcut (**L**, **V**, **S**, **H**) needs **Ctrl+Shift** held — the
  exact same combo on Windows and Mac, no relabeling needed, since both keys are
  physical keys named the same thing on every keyboard. (The letters themselves
  aren't the first letter of what they do — Cursor/Record/Mute/Hide would have been
  C/R/M/H, but Chrome itself reserves Ctrl+Shift+C/R/M as browser shortcuts —
  inspect element, hard reload, and browse-as-guest — so L/V/S/H were picked
  instead, specifically because Chrome has no binding for any of them on either
  platform.) None of them fire at all while a real input, textarea or editable
  element on the page has focus — so typing normally into a form while the rebuild
  plays never gets mistaken for a shortcut, whether or not you're holding anything.
- **The toolbar also resets itself if you leave the page and come back** (e.g. the
  browser's Back button restoring it from its "frozen tab" cache): rather than
  resuming a now-stale, possibly glitchy rebuild, it just goes back to the plain
  live page, the same as clicking the icon to turn it off — click it again for a
  fresh, correct rebuild of whatever's there.
- **It follows you around a single-page app — full route changes and in-page tab
  or panel switches alike.** Clicking a link on a site with client-side routing
  (React Router, Next.js, etc.) doesn't reload the page — it swaps the content
  under you, and so does switching tabs within an already-loaded page without
  changing the URL at all. divPointers notices (the app's own Back/Forward, a
  route swap from clicking a link, or a smaller in-page content swap — even one
  that only toggles an existing panel's visibility rather than adding or
  removing anything) and automatically restarts against whatever's on screen
  now — quietly, and selectively: it compares the new snapshot against the one
  it's replacing, and anything that's genuinely unchanged (the nav bar, a
  sidebar, whatever didn't move) just appears instantly, exactly as it already
  looked — only the content that's actually new or different gets drawn by the
  cursors. This covers repeated patterns too (a row of nav links, a sidebar
  list, a grid of cards) — including a sidebar row whose "selected" styling
  moves to a different row between restarts, which still carries over instead
  of redrawing just because of that. A real, full page navigation to a
  different URL is different — that's a fresh load, so click the icon again
  there. (Pressing **Replay** yourself still gets the full show, everything
  freshly drawn — only these automatic catch-up restarts are quiet and
  selective.)
- **Typing into a search box or anything with live, DOM-churning results (an
  autocomplete dropdown, a filtered list) doesn't interrupt itself anymore.**
  That kind of churn crosses the same threshold a real route change does, so it
  used to restart the rebuild mid-keystroke; now a restart that would fire while
  a real field has focus waits until you're actually done and focus moves on.
- When it's done, the cursors flock to your mouse. **Go live** fades back to the
  real, clickable page; **Replay** builds it again.
- **Esc**, **✕**, or clicking the icon again exits at any time (and still saves an
  in-progress recording first). Esc needs no modifier and always works, including
  while focused on a real field.

There's a self-contained test page in [`demo/index.html`](demo/index.html) (an
inner-scrolling app shell with floats, forms, cards and media). Opening local files
needs **Allow access to file URLs** enabled for the extension.

## How it works

1. **Snapshot.** [`engine.js`](engine.js) walks the live DOM,
   including open shadow roots, and turns it into a blueprint:
   - boxes with fills, borders, radii, shadows, gradients, masks and backdrop blur → **rects**
   - text blocks → **text layers**, cloned with their computed styles (fonts, links, inline code, icons, `::before`/`::after`)
   - single-side borders and `<hr>` → **pen-tool lines**
   - `<img>`, `<svg>`, `<video>`, `<canvas>`, iframes → **media**. WebGL canvases, playing video and cross-origin iframes are cropped from a screenshot taken at click time while only those elements are visible.
   - repeated siblings (nav links, cards, list rows, logos) → one **master** plus **duplicates**
   - shared left edges and baselines → **ruler guides** that text snaps to
2. **Blank.** A full-viewport layer, isolated from the page's CSS in a shadow root,
   covers the page with its own background color. A quick hidden scroll pass first
   triggers lazy images and reveal-on-scroll content.
3. **Rebuild.** Each cursor runs a small generator script per task. Tasks unlock
   top-down as you scroll, children wait for their parent box, and duplicates wait
   for their master:
   - **rect / media:** crosshair drag with a live `W × H` badge and a gray placeholder, then the real fill fades in (images sweep top to bottom)
   - **text:** drag a text box, type with an I-beam and a blinking caret; big headings start at 18px and step up
   - **lines:** pen tool, anchor points, rubber band to the cursor
   - **guides:** Figma-style rulers slide in, a red guide is dragged out, and text snaps onto it
   - **duplicates:** select the master, ⌥-drag a copy with red spacing measurements, then retype its text, swap its image or restyle it
   - **physics:** orbiting, alignment and mouse-avoiding flocking (boids-style) for the intro and the finale
4. **Sound.** Synthesized live with the Web Audio API (no audio files), mostly
   clicky, a little musical:
   - typing is a mechanical keyboard (a sharp click over a short thock, deeper on spaces), and every mouse press is a press-and-release click
   - guides snap with a crisp click, and growing headings tick up in pitch
   - boxes, images and duplicates add a sparse, quiet glass-piano note from the E major pentatonic, on an eighth-note grid: big sections play low, small things high, pitch rises left to right, every sound panned to its cursor
   - an airy swell as the page dissolves, a short arpeggio as it fans out, a soft chord when the page is done, and a falling sweep for Go live
5. **Cursor glow.** A CSS `drop-shadow` filter in `currentColor`, applied to each
   cursor's own SVG and toggled by adding/removing a `cur-glow` class on the host
   element — the cursor artwork itself (`cursorSVG()`) never changes; only the glow
   around it does. Persisted via `localStorage`.
6. **Recording.** `getDisplayMedia` + `MediaRecorder`, entirely client-side — no
   new browser permission, no server. Format (WebM/MP4) is chosen via
   `MediaRecorder.isTypeSupported` and remembered across sessions. See
   `App.startRecord`/`stopRecord`/`saveRecording`/`cycleFormat` in `engine.js`.
7. **Pass-through to the real page.** The full-viewport overlay host has
   `pointer-events: none`; only the HUD and the shortcuts panel opt back into
   `pointer-events: auto`. Every click, scroll and keystroke elsewhere falls
   straight through to the real DOM underneath, so its own inputs stay focusable
   and typable and any of its scrollable containers keep scrolling natively — no
   custom forwarding code needed. A `document`-level capture-phase `scroll`
   listener (not just one on the page's main scroller) keeps the rebuild's own
   view in sync with wherever the user actually scrolled.

### Files

| Path | What it is |
| --- | --- |
| `manifest.json` | Manifest V3; permissions are `activeTab` and `scripting` only |
| `background.js` | Toolbar click → media-only screenshot → inject `engine.js` (or toggle off) |
| `engine.js` | Snapshot, renderer, swarm engine, cursor glow and recording (one dependency-free content script) |
| `icons/` | Toolbar/store PNGs (`icon16/32/48/128.png`) plus their SVG sources (`icon.svg`, and `icon-small.svg` for the simplified 16/32px version) |
| `demo/index.html` | Edge-case test page |
| `store/` | Chrome Web Store listing copy and screenshots (for if/when this is ever published) |
| `scripts/package.sh` | Builds the zip to upload to the Web Store |

## Limits

- Browsers don't let extensions run on `chrome://` pages, the Web Store or the PDF
  viewer. The icon shows a red × there.
- It's a visual rebuild, not a clone: what you see is a drawn copy layered on top
  of the real page, not the page itself. The real page stays live underneath —
  its inputs and scrolling keep working — but "Go live" is still what fades the
  drawn copy away and lets you see it directly. Animations freeze at the moment
  you click, decorative pseudo-elements are skipped when their position can't be
  worked out, and canvases, videos and iframes below the first screen become
  placeholders.
- Web components are rebuilt as plain styled elements, so none of the page's scripts
  run inside the rebuild layer.
- Very long pages are capped at about 4,000 layers / 40,000px.
- Recording needs a browser that supports `getDisplayMedia`/`MediaRecorder`
  (any current Chrome/Arc/Edge does); MP4 recording further needs a browser whose
  `MediaRecorder` can mux it (Chrome/Edge on most platforms) — otherwise only WebM
  is offered.
- `Ctrl+Shift+D` is the suggested shortcut, but it can collide with a browser's own
  default binding (e.g. Chrome's "bookmark all tabs"). If it doesn't fire, rebind it
  at `chrome://extensions/shortcuts`.

## Publishing

`./scripts/package.sh` writes `dist/divpointers-<version>.zip` for the
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole),
if this is ever published there. Listing text and assets are in [`store/`](store),
and the privacy policy is [`PRIVACY.md`](PRIVACY.md) — note it currently has no
publicly hosted URL, which the Web Store requires before a real submission.

## Background

An earlier pass added a theme system and a "write mode," both since removed: the
theme system didn't land well visually, and write mode (keystrokes revealing the
page's own captured text) turned out not to be what was wanted — the real ask was
the pass-through behavior described above, under "How it works." See
`CHANGELOG-v2.md` for the full history.
