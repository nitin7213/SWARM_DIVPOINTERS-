# Chrome Web Store listing

Copy-paste material for the [Developer Dashboard](https://chrome.google.com/webstore/devconsole), if/when this is published.

## Store listing tab

**Name:** divPointers

**Summary** (132 characters max):

> Erase any page to nothing, then watch a crew of cursors sketch it back into being, live.

**Category:** Fun (alternative: Developer Tools)

**Language:** English

**Description:**

> One click and the page you're on disappears. In its place: a small team of
> cursors, each a different color, converging on the site's logo before fanning
> out across the empty canvas to put everything back — not instantly, but drawn,
> typed and dragged into place as if a design team were building it live in front
> of you:
>
> • Boxes dragged out with a crosshair and a live size badge, then filled in
> • Headlines and paragraphs typed out with a blinking caret
> • Borders drawn with the pen tool
> • Ruler guides dragged in, with text snapping onto them
> • Cards, nav links and list rows ⌥-dragged into place and retyped
>
> It sounds like it looks: a soft mechanical-keyboard clatter and mouse clicks,
> with quiet glass-piano notes as each piece lands (press M to mute).
>
> Switch the cursors between a flat look and a soft outer glow, and capture the
> whole thing as a video with one click — WebM or MP4, whatever your browser can
> produce — no extra software needed.
>
> Keep scrolling and the crew follows, pulling in reinforcements the faster you
> go. Tour mode scrolls for you, at a pace built for a clean recording. Once
> everything's back in place, the cursors gather at your mouse and "Go live"
> fades the drawing away to reveal the real, working page underneath.
>
> Privacy: nothing is collected or sent anywhere. The extension only runs on the tab
> you click, when you click it.

**Graphics:**

| Asset | File |
| --- | --- |
| Store icon (128×128) | `icons/icon128.png` |
| Screenshots (1280×800) | *(replace `screenshot-*.png` with new ones showing write mode/recording — the existing ones are from an earlier version)* |
| Small promo tile (440×280) | *(replace — existing one is from an earlier version)* |

## Privacy practices tab

**Single purpose:**

> Animate a rebuild of the current web page: when the user clicks the icon, the page
> is replaced by a canvas on which animated cursors redraw its layout, text and
> images, with an optional recording of that rebuild.

**Permission justifications:**

- `activeTab`: needed to run on the page the user explicitly invokes the extension
  on, and to capture that tab once so canvases, videos and iframes can be redrawn.
  No access to any other tab or site.
- `scripting`: needed to inject the bundled animation script into the active tab,
  and to briefly apply CSS that leaves only media visible for the one screenshot.

**Remote code:** No. All JavaScript is included in the package.

**Data usage:** Collects no user data. Tick none of the data-type boxes and certify
the three disclosures (no selling, no unrelated use, no creditworthiness use).

**Privacy policy URL:** *(needs to be hosted somewhere public before submission —
`PRIVACY.md` in this folder is the content, but it has no URL yet.)*

## Distribution tab

Visibility: Public (or Unlisted to share by link first). Regions: all.
