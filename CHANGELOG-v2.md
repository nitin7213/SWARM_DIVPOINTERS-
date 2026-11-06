# 2.8.2 — a quiet restart that would change nothing no longer happens at all, and never gets stuck forever either

## Fixed: it could keep restarting on its own on a busy page, with nothing actually new to show

A page with enough of its own background DOM activity - a live dashboard
re-rendering its own rows, a chat widget's read receipts, anything polling -
could cross the same mutation bar a real route change does, with nothing
genuinely new ever appearing. Up to now that still went through with a full
restart: tear the current build down, put a new one up, same as any route
change. Even with the carry-over work above making the content itself
reappear instantly, the restart cycle itself is visible - which reads as
exactly this: the rebuild looping on its own, with no click, no refresh, no
reason anyone watching can see.

A restart that's about to fire now checks first: capture what's on screen
right now and compare it against what's already drawn, the same way a quiet
restart's content carry-over already does. If literally everything would
carry over unchanged, the restart is dropped before it starts - no blank
flash, no new build, nothing visible at all. A page that's always this
chatty just stays quiet; the moment something genuinely new shows up, it
still restarts and draws it, same as always.

## Fixed: sustained background activity could also delay or block a real change from ever being drawn

The flip side of the bug above: coalescing a burst of changes into one
restart (so a route swap's own sequence of DOM changes becomes one restart,
not several) worked by pushing a 400ms timer back on every qualifying
mutation - which had no ceiling. A page busy enough to keep re-triggering
that within every 400ms window could push the timer back forever, so a
restart - including one triggered by a real, deliberate change - might never
actually fire as long as that background chatter kept up. Fixed by capping
how long one burst can keep deferring it: past 1.2 seconds from the first
mutation in a burst, it fires on schedule regardless of whatever else is
still going on, so sustained chatter gets coalesced into an occasional
restart instead of blocking one indefinitely.

# 2.8.1 — repeated/listed content carries over too, and the vertical record button is centered

## Changed: duplicate groups (sidebars, nav lists, card grids) now carry over on a quiet restart too

2.8.0 only covered plain, one-off content - a repeated pattern (the rebuild's
"one master plus duplicates" grouping for things like a list of nav links, a
sidebar of rows, a grid of cards) still redrew in full every time, even when
none of it had actually changed. That's exactly the case this was reported
against: a sidebar of chat-style entries where clicking one only swaps the
main panel - the sidebar itself never moves - but the whole sidebar kept
rebuilding anyway.

Duplicate-group content is now matched the same way plain content is: a
fresh row is compared against the old one it corresponds to, and if its
content and position are still the same it just appears instantly instead of
redrawing. This also covers the trickier case where a row's "selected" or
"active" styling moves to a different row between two restarts - which
changes which row the rebuild treats as the group's master versus its
duplicates - so an item can flip from one to the other across restarts
without that flip, by itself, making it redraw. Only a row whose actual
content changed still gets the normal drawn build.

## Fixed: the record button wasn't centered in the bar when the toolbar is vertical

Rotating the toolbar to vertical stretched the record button to the bar's
full width but left its icon pinned to one side instead of centered in that
space - fixed by centering the button's contents regardless of orientation.

# 2.8.0 — a quiet restart only draws what actually changed, and stopped looping

## Changed: a quiet auto-restart now only draws what's actually new or changed

Up to now, *any* restart - including the quiet ones that follow you around a
single-page app - rebuilt the whole page from nothing, same as clicking
Replay yourself: everything got wiped and every cursor redrew everything,
even content that hadn't changed at all. Switching tabs in a React app meant
watching the swarm redraw the nav bar, the sidebar, the footer - all the
stuff that was already sitting there correctly a moment ago - just to get to
the one panel that actually swapped.

A quiet restart now compares its fresh snapshot against the one it's
replacing. Anything that's genuinely the same - same kind of content, same
text or image or box styling, sitting in the same spot - just appears the
way it already looked, instantly, with no cursor involved. Only content
that's actually new or changed gets the usual crosshair-drawn build. A
clicked-through Replay still gets the full show, every time, same as always
- this only changes what an automatic follow-along restart does.

(Repeated patterns the rebuild draws as one master plus duplicates - a row
of nav links, a grid of cards - aren't covered by this yet and still redraw
in full on a quiet restart; everything else does not.)

## Fixed: the rebuild could restart itself in a loop, seemingly out of nowhere

2.7.0's click-correlated detection could re-arm itself on mutations that had
nothing to do with any real change. Once a burst of changes crossed the
lower, click-correlated bar, the running tally that measured it wasn't
cleared - so it stayed "over the bar" for the rest of its one-second window,
and *any* further mutation in that window, even a single harmless one (a
live clock ticking its own text, or - worse - the rebuild's own restart
putting itself back on the page) would read as "still over the bar" and
schedule another restart on top of the one already pending. On a page with
almost any sub-second ambient activity, this could keep pushing a restart's
own timer back, or fire a second, unprompted one a couple of seconds after
a real one already went out - which is what looked like the rebuild
restarting on a loop, on its own.

Fixed two ways: the tally is cleared the moment it crosses the bar, instead
of lingering for the rest of its window; and the rebuild's own on-page
footprint (removing and re-adding its own overlay element on every restart,
the opacity fade on exit, the cursor-glow toggle) is now excluded from what
the detector watches in the first place, so none of its own output can ever
feed back into triggering another restart.

# 2.7.0 — tab/container swaps are actually detected now, and the vertical bar is slim

## Fixed: switching tabs within a page (no URL change) didn't update the rebuild

2.4.2's "follows you across routes" only ever reliably caught a full page's
own router swapping a large, already-fully-formed subtree in one go. A tab
switch within an already-loaded page is usually much smaller - replacing a
small content well, or (just as often) not adding or removing anything at
all, just toggling a `hidden` attribute or a class on panels that were both
already sitting in the DOM. Neither reliably crossed the flat 40-node bar
the rebuild used to decide "that's a real change," so the swarm kept
showing whatever was on screen before you switched tabs.

Fixed two ways together: a mutation - of any size, including an attribute
change alone - that happens within a short window of a real click is now
held to a much lower bar than one with no recent click behind it (ordinary
incidental page life - a toast, a lazy image, an ad slot - isn't preceded
by a click, so it still needs to clear the original, much higher bar). And
the observer now also watches `hidden`/`class`/`style`/`aria-*` attribute
changes, not just nodes being added or removed, so a tab library that
reuses existing panels and just toggles their visibility is caught too.

(Getting the lower bar right took a second pass: naively counting every
added/removed node meant anything on the page updating a live counter or
timestamp via `.textContent` on its own timer could, by coincidence, tip
the bar on its own within 800ms of *any* unrelated click. The count now
only looks at element nodes, not text nodes, which a plain text update
never touches.)

## Fixed: the vertical bar wasn't actually slim

The first pass at a vertical layout let the bar's width follow whatever its
widest child needed - which, in practice, was the build-progress text
("23 agents • 1,204 / 5,302 layers"), stretching the whole column out to
match one unbroken line of that. It's now a fixed, narrow width with that
text wrapping onto a couple of lines instead, and every icon button sized
to its own content rather than stretched to match.

# 2.6.0 — typing no longer restarts the rebuild, quieter auto-restarts, a draggable collapsed bar, vertical layout

## Fixed: typing in a real search/autocomplete box kept restarting the rebuild

2.4.2 added SPA-navigation detection so the rebuild follows a route change
without needing a manual replay. The side effect: typing into a live
search box or any other field that rewrites a chunk of the page on every
keystroke (autocomplete, a filtered list, a typeahead) crossed the same
DOM-mutation threshold a real route change does, so the rebuild kept
auto-restarting mid-keystroke — which is what "can't write in textboxes"
actually was.

Fixed properly this time: an auto-restart that would otherwise fire while a
real input, textarea, select, or contenteditable element has focus is now
deferred instead of dropped — it fires the moment focus actually leaves that
field, not before. Typing in a churny search box no longer restarts anything
while you're still in it.

## Changed: auto-restarts are quiet now

A restart the extension triggers on its own (following an SPA route change,
or the deferred typing-safe one above) now skips the theatrical wipe-to-blank
and orbiting-favicon intro and the full-page scroll scan — it just rebuilds
the new content directly, in well under a second instead of the original
2-3 second sequence. Pressing **Replay** yourself still gets the full show;
only auto-restarts are quiet.

## Added: drag a collapsed bar by its own icon

Collapsing the toolbar to a small nub used to make it undraggable until
expanded again — every other button is left alone so its own click still
works, but a collapsed bar hides everything except that one icon, so there
was nothing else left to grab. The hide/show icon can now also start a drag
when the bar is collapsed, without losing its normal click-to-expand
behavior. (Getting this right meant working around a Chrome quirk where
capturing the pointer for a drag silently redirects the *next* click away
from the button it started on, even after releasing the capture — the fix
tracks the drag on `document` instead of relying on pointer capture at all.)

## Added: lay the toolbar out vertically

A new button next to Sound turns the bar into a vertical column instead of
a horizontal row — useful if you'd rather it sit along a screen edge. The
choice is remembered per-browser, same as the bar's position and
collapsed/expanded state.

# 2.5.0 — one shortcut scheme for Windows and Mac, no relabeling

2.4.1 fixed the Mac shortcuts by switching to `e.code` and adding Mac-specific
"Ctrl+Option+" label text. That label text was itself the wrong call — needing
a different label per platform at all meant the underlying modifier choice
(Ctrl+Alt) was wrong, not just its display string.

## Changed: Ctrl+Shift, not Ctrl+Alt — and four different letters

Every letter shortcut now uses **Ctrl+Shift+<letter>**, identical on Windows and
Mac with no per-platform label at all: Ctrl and Shift are physical keys with the
same name on every keyboard, unlike Alt/Option (different label, and Option also
remaps the character a key produces — the whole reason 2.4.1 needed `e.code` in
the first place).

Ctrl+Shift+C/R/M, the obvious letters (Cursor/Record/Mute), can't be used for
this, though — they're genuine Chrome browser-level shortcuts on **both**
platforms (confirmed against Chrome's own keyboard-shortcut and DevTools
documentation, not just memory): Ctrl+Shift+C / Cmd+Shift+C toggles
inspect-element mode, Ctrl+Shift+R / Cmd+Shift+R is a hard reload, and
Ctrl+Shift+M / Cmd+Shift+M is "browse as Guest." Those are handled by Chrome
before a keydown event ever reaches page JS, so matching them here would have
meant the shortcut silently never firing (C, M) or the page hard-reloading
instead of recording (R) — exactly the class of bug this project keeps running
into with shortcuts that only look safe.

New letters, picked specifically because Chrome has no Ctrl+Shift/Cmd+Shift
binding for any of them on either platform:

- Cursor look: **C → L**
- Record: **R → V**
- Mute/unmute: **M → S**
- Hide/show toolbar: **H** (unchanged — already confirmed clear on both platforms)

Verified against the real extension with real, browser-level key presses (not
synthetic DOM events): all four combos toggle the right feature, none of them
open DevTools, reload the page, or open any other window, and plain typing of
the letters l/v/s/h with no modifiers into a real field is completely
unaffected.

# 2.4.2 — follows you across a single-page app's own navigation

On a single-page app (React Router, Vue Router, Next.js, a hand-rolled
`pushState` setup — anything that changes "page" without a real, cross-document
navigation), clicking a link doesn't touch this content script at all: the DOM
gets swapped for a different route, but the rebuild just kept showing its
original snapshot, frozen, while the real page had already moved on. That's
the "it freezes when I click a link" symptom — not a hang, a stale picture.

Fixed with a route-change watch: a `popstate` listener for the app's own
Back/Forward, plus a `MutationObserver` on the real page (the one mechanism
that sees a DOM swap no matter which router did it, since intercepting
`history.pushState` itself doesn't work from a content script's isolated JS
world — the page's own router code runs in a different world and never calls
through the patched version). A burst of more than ~40 nodes changing at once
— an actual route swap, not a toast or a lazy-loaded image or a chat widget
ticking — triggers a clean restart against the new content after a short
settle, the same restart "Replay" already does, so it looks like the swarm
follows you from "page" to "page" inside the app instead of going stale.
Confirmed against the real extension with a mock router: clicking between
three routes mid-build, and the browser's own Back button, both correctly
re-snapshot the new route, and a real input on the new route stays typable
the whole time — the page's own JS (a running heartbeat counter) never stops,
proving nothing actually freezes, before or after.

This doesn't cover a real cross-document navigation (an actual new URL, full
page load) — that tears down this script entirely, and following you there
automatically would mean this extension holding always-on permission to run
on every site, rather than the one-click `activeTab` grant it asks for today.

# 2.4.1 — the Mac shortcuts were silently dead, a stray stale-title bug, bfcache guard

Three bugs, all in code that 2.4.0 had just shipped.

## Fixed: every Ctrl+Alt shortcut was non-functional on a real Mac

2.4.0's new modifier requirement matched shortcuts with `e.key === "c"` (and
`"r"`/`"m"`/`"h"`). That's the character actually produced, and on a Mac, holding
Option (the physical key behind `altKey`) remaps it: Option+C delivers `"ç"`,
Option+R delivers `"®"`, Option+M delivers `"µ"`, and Option+H doesn't resolve to
`"h"` at all. Every one of the four new Ctrl+Alt shortcuts was checking for a
character a Mac keyboard can never actually send while Alt/Option is held — they
all silently never fired, on the one platform this extension is mainly used on.

Fixed by switching to `e.code` (`"KeyC"`/`"KeyR"`/`"KeyM"`/`"KeyH"`) — the physical
key position, unaffected by modifiers or keyboard layout — confirmed with a
Playwright test that dispatches the exact event shape real macOS sends for
Option+R (`key: "®", code: "KeyR"`) through the real extension and checks the
record button actually toggles.

Also added Mac-aware label text: "Alt" isn't printed on a Mac keyboard either (the
key is labeled "Option"), so a new `MODLABEL` constant now shows **Ctrl+Option+**
on Mac and **Ctrl+Alt+** elsewhere, everywhere a shortcut is mentioned (button
titles, the shortcuts legend).

## Fixed: Record/Sound button titles silently dropped the modifier text

Separate from the above — `renderRecordBtn()`/`renderSoundBtn()` re-render the
record and sound buttons' tooltips on every state change (recording started/
stopped, sound muted/unmuted), and had their own hardcoded `"(R)"`/`"(M)"` strings
left over from before 2.4.0's modifier requirement existed. Every time either
button re-rendered, its tooltip reverted to the old, modifier-less text. Both now
use `${MODLABEL}` like every other shortcut mention.

## Fixed: a stale rebuild could resurface after the browser's Back/Forward

Chrome can freeze an entire page — this content script's JS heap, DOM, running
animation loop and timers included — rather than tearing it down, and resume it
later exactly as it was (the back/forward cache, "bfcache"). If divPointers was
running when the page got frozen, resuming it later meant the swarm's physics saw
a multi-second-or-longer time jump in one frame and lurched or glitched, which
could look like "an old version is loading." A `pageshow` listener now detects
exactly this case (`event.persisted === true`, which only happens on a bfcache
restore, never a normal load) and cleanly stops back to the plain live page, the
same as clicking the toolbar icon to turn it off — so there's nothing stale or
glitchy left on screen; click the icon again for a correct, fresh rebuild of
whatever's there now.

# 2.4.0 — the real cause of "I still can't type," a movable/hideable toolbar, new icon

2.3.0's pointer-events fix made the real page click-through and scrollable, but
typing into a real field could still get hijacked mid-keystroke. Root-caused and
fixed, plus a toolbar you can move or tuck away, a new icon, and the leftover
old-publisher/license text removed from everything that ships or is read alongside
the project.

## Fixed: the actual "can't write in textboxes" cause

The letter shortcuts (`C`/`R`/`M`) were bound as bare keys on a `window`-level
listener with no awareness of what had focus. Typing "hello real input" into a real
field hit the `r` in "real" on the way through, which fired `toggleRecord()` →
`getDisplayMedia()` — a real screen-share prompt popping up in the middle of
someone's sentence, stealing focus and cutting the rest of the typed text off
(confirmed with Playwright driving the actual `background.js` → `chrome.scripting`
injection path end-to-end, not the direct-inject shortcut used for earlier
synthetic tests — the direct-inject path never exercises this). Two layers fixed it:

- `isRealFieldFocused()`: when `document.activeElement` is a real input, textarea,
  select, or contenteditable element outside our own shadow host, every letter
  shortcut is skipped outright and the keystroke reaches the field untouched.
- Every letter shortcut now also requires **Ctrl+Alt** held (`C`→Ctrl+Alt+C,
  `R`→Ctrl+Alt+R, `M`→Ctrl+Alt+M), so even somewhere the focus check doesn't
  recognize as a field, a plain typed letter can never be mistaken for a shortcut.
  Not Ctrl+Shift: Chrome reserves Ctrl+Shift+C (inspect element) and Ctrl+Shift+R
  (hard reload) for itself, so either combo would have never reached the page or
  would have reloaded away the whole rebuild instead of recording it.
- `Escape` is the one exception — it bypasses the focus check and always works,
  since it is a non-printable key that can never end up as typed content.

## Added: move or hide the toolbar

- **Drag** the bar from any blank spot on it (not a button) to put it anywhere on
  screen; position is remembered across rebuilds (`localStorage`).
- **Ctrl+Alt+H**, or the new chevron button at its left end, collapses it to a
  small nub and back; collapsed state is remembered too.
- The shortcuts-legend anchor logic now accounts for a dragged bar: it still opens
  above the `?` button by default, but flips to open below (and stays horizontally
  clamped) if the bar has been dragged somewhere that would otherwise push the
  panel off-screen.

## Fixed: format button width jump

Switching the record control between "WebM" and "MP4" changed the button's
rendered width (4 vs. 3 characters), visibly nudging the rest of the bar sideways
every time. The format button now has a fixed width, so the label text is centered
inside a stable box regardless of which format is selected.

## Changed: new icon

Replaced the old flat icon with hand-authored SVG source (`icons/icon.svg` for
48px/128px, `icons/icon-small.svg` for a simplified version at 16px/32px, where
the old version's extra detail just turned to mud) — three of the swarm's own
cursor colors glowing and converging on a sketched box at larger sizes, one bold
cursor at toolbar size for legibility. Both SVGs are kept alongside the rendered
PNGs the manifest actually loads (Chrome extension icons must be raster, not SVG).

## Removed: every remaining old-publisher/license-similarity reference

`README.md`'s "Background" section, `store/LISTING.md`'s pre-submission note, and
the `CHANGELOG-v2.md` 2.0.0 entry no longer mention where the rebuild technique was
originally adapted from or the license question around it; `ANALYSIS.md` (the file
those all pointed to) has been deleted from the project folder entirely. Also fixed
`scripts/package.sh`, found stale while doing this pass: it still referenced the
pre-rename `swarm-rebuild/` subfolder and `swarm.js`, left over from before the
2.0.0 flattening/rename, which would have made it fail outright if run — it now
zips `manifest.json`, `background.js`, `engine.js` and `icons/` straight from the
project root into `dist/divpointers-<version>.zip`.

---

# 2.3.0 — real page stays interactive during the rebuild

Resolves the open question left at the end of 2.2.0. Two clarifying questions were
asked directly ("fix nested scrolling in any container?" / "should the real page's
own inputs stay clickable and typable?") and both came back yes, which turned out to
be one fix, not two.

## Changed

- **The overlay host is now `pointer-events: none`.** It was `auto`, which is what
  made the whole rebuild layer swallow every click, scroll and keypress on the page
  — even though every one of its own internal visual layers (`.bg`, `.layer`,
  `.port`, `.badges`, `.cursors`, `.rulers`, `.intro`) already had
  `pointer-events: none` individually. The host's own inline style was the only
  thing actually capturing events. Flipping that one value means clicks, scrolling
  and focus now fall straight through to the real page everywhere, while the HUD
  and the shortcuts panel keep working exactly as before — they already opted back
  into `pointer-events: auto` in their own CSS, which is what makes them still
  clickable on top of an otherwise click-through layer.
- **Scroll-sync now listens on `document` with `{capture: true}`**, replacing the
  old listener bound only to the one scroller `detectEnv()` picks out at capture
  time. `scroll` doesn't bubble, but a capture-phase listener on an ancestor still
  sees it fire on any descendant, so the rebuild's view now stays in sync with
  whichever container the user actually scrolled — a sidebar, an inner panel, not
  just the page's main scroller.
- **The "click outside closes the shortcuts panel" listener now reads
  `e.composedPath()` instead of `e.target.closest(...)`.** It had to move from the
  shadow root to `document` to catch clicks on the now-interactive real page, and
  for a listener outside the shadow tree, `e.target` for anything that happened
  inside the shadow DOM gets retargeted to the `<div-pointers>` host element itself
  — `e.target.closest(...)` would have made every click on the extension's own HUD
  look like an outside click. `composedPath()` gives the true element chain across
  the shadow boundary.

## Removed

- **The manual wheel-forwarding hack** (`on(this.view.host, "wheel", ...)` calling
  `scrollBy` on the detected scroller by hand) for the non-root-scroller case —
  dead code now that native scroll passes through the overlay on its own.

## Verified

Playwright, against both a purpose-built fixture (an independently-scrollable
sidebar next to a main content area with a real `<input>` and `<textarea>`) and the
real `demo/index.html`: a real text input and a real textarea can be focused and
typed into through the overlay; the sidebar scrolls independently of the main
content area and both update their own `scrollTop`; the rebuild's own world-sync
still re-centers correctly after either one scrolls; HUD buttons (sound, help) still
work; the shortcuts panel still opens via its button, closes on a click to the
now-interactive real page, and stays open on a click inside itself. Also re-ran every
prior regression test (toggle on/off, the 2.2.0 UI-polish pass, WebM/MP4 recording
including the Replay-mid-recording carryover) — all still pass, zero new console
errors beyond a pre-existing unrelated favicon 404 in the demo page.

One test-fixture bug surfaced and was fixed along the way, worth a note in case it
recurs: the fixture's `main { overflow-y: auto; height: 100%; padding: 20px }`
without `box-sizing: border-box` made that element render 40px taller than `100%`,
which made the whole document microscopically scrollable and tricked `detectEnv()`'s
root-scroller check into picking `html` instead of the actual inner scroller. Not an
engine bug — fixed by adding `box-sizing: border-box` to the fixture.

---

# 2.2.0 — write mode removed, real cursor glow, merged record control, UI polish

Direct feedback on 2.1.0, addressed point by point:

## Removed

- **Write mode**, entirely — `Engine.writeMode`/`writePending`, the `*type()`
  branch that read them, the ✍️ HUD button, the `W` shortcut, and the keydown
  branch that suspended other letter shortcuts while it was on. It turned out to
  be a misreading of the original ask: "let me type" meant being able to use a
  real cursor to type into the *actual page's own textboxes* (search bars,
  comment forms) the way a visitor normally would — not a stylized "reveal the
  swarm's captured text with your keystrokes" gimmick. That's a materially
  different feature with a real tension to resolve first (the whole rebuild is a
  non-interactive visual layer completely covering the real, interactive page —
  that's what "Go live" exists to undo), so it's being worked through separately
  rather than guessed at again.

## Changed

- **Cursor "shiny" → actual glow.** The 2.1.0 "shiny" look (a gradient fill plus
  a small highlight stroke baked into the cursor artwork) didn't read as shiny —
  it read as a dim streak. What was actually wanted, going back to the removed
  theme system's Neon mode, was a cursor radiating its own light outward. That's
  now what the toggle does: `cursorSVG()` is back to always producing the plain
  flat-fill arrow it always did, and "glow" is purely a CSS
  `filter: drop-shadow(0 0 …px currentColor)` applied to each cursor's SVG (its
  `color` is set to match its own cursor color, so the halo is tinted per cursor),
  toggled by a `cur-glow` class on the host element. Same `C` shortcut and
  `localStorage` key, new effect underneath.
- **Record + format merged into one control.** Having a separate pill-shaped
  button for "record" and another one next to it just to pick WebM/MP4 read as
  two buttons doing one job. They're now a single compound control (`.rec-group`,
  one rounded background, a hairline divider between the two halves) — still two
  click targets under the hood (record toggles recording, the WebM/MP4 segment
  switches format), but it reads and looks like one thing.
- **Icons now match the existing flat/monochrome HUD language** instead of pasted-on
  emoji. The cursor-style and shortcuts-help buttons use small `currentColor` SVGs
  built in the same style as the existing speaker icon (16×16, mostly stroke) —
  solid cursor renders as a filled arrow glyph, glow as the same arrow outlined
  plus a tiny sparkle mark; `?` is a plain outlined circle-question-mark. No new
  emoji anywhere in the HUD.
- **Shortcuts legend now opens anchored above the `?` button** that opens it
  (computed from the button's own bounding rect at open time), instead of
  centered on the whole screen looking like a disconnected, centered dialog.

## Verified

Full Playwright re-pass: no `write`/`writeMode`/`writePending`/`shiny` references
remain anywhere in `engine.js` (grep-clean); the record+format group renders as one
`.rec-group` container with both controls inside it and recording (including the
Replay-mid-recording carryover and the MP4 path) still works unchanged; clicking the
cursor-style button toggles a `cur-glow` class on the custom element and the glow
persists correctly across a fresh load when set via `localStorage` beforehand,
confirmed visually in a screenshot (each cursor shows a soft colored halo); the
shortcuts panel's center lines up with the `?` button's center (not the screen's)
when opened, confirmed both by bounding-rect math and a screenshot. Zero console
errors in any run.

The open question below (real page interactivity + nested scrolling) was resolved
in 2.3.0 — see that section above.

---

# 2.1.0 — themes removed, write mode, cursor style, MP4 recording, shortcuts

Direct feedback round: the theme system shipped in 2.0.0 was explicitly called out
as not working for this project and pulled entirely, and five smaller things were
added in its place. The nested `divpointers/` folder that used to sit inside the
project folder has also been flattened — `manifest.json`, `background.js`,
`engine.js`, `icons/` etc. now live at the top level of this project folder
directly, not in a duplicated-name subfolder.

## Removed

- **Theme system.** `THEMES`, `applyTheme()`, `View.applyThemeVisuals()`, the 🎨 HUD
  button, the `T` shortcut, the `--accent`/`--accent-rgb` CSS variables, and the
  `.grid`/`.glow` canvas treatments are all gone. Cursor colors, the music's scale,
  and the canvas background are back to their original single (Classic) look.
  `localStorage`'s old `__divPointersTheme` key is simply no longer read.

## Added

- **Write mode (✍️ / `W`).** Lets you type a line back in yourself instead of
  watching it auto-type: while it's on, your own keystrokes reveal the next
  character of whatever text the swarm is currently placing (`Engine.writeMode`/
  `writePending`, read inside `*type()`), rather than the usual timer pacing. It's
  a "type along" over the page's real captured text, not freeform authorship, so
  the rebuild still matches the real page — but it means you can drive the pace of
  a line by hand, scrolling still works throughout, and you never have to "go live"
  first. `W` toggles it on or off at any time; turning it off mid-task falls back
  to normal auto-typing immediately. Letter shortcuts (`M`/`R`/`C`) are suspended
  while it's on except for `W` itself, since any keystroke now means "reveal a
  character."
- **Cursor style (`●`/`✨` button, or `C`).** A simple solid/shiny toggle for the
  arrow and duplicate cursors — flat fill vs. a linear gradient with a highlight
  glint (`cursorSVG()`, `lighten`/`darken` hex helpers, unique-per-render gradient
  ids so simultaneous cursors don't share one gradient definition). Persisted via
  `localStorage` (`__divPointersCursorStyle`). Deliberately separate from (and much
  simpler than) the removed theme system — it only touches how cursors are drawn.
- **MP4 recording option.** The ⏺ recording feature from 1.3.0 is unchanged in how
  it's triggered, but a **WebM / MP4** button now appears next to it whenever the
  browser's `MediaRecorder` can actually mux MP4 (`MediaRecorder.isTypeSupported`,
  checked once and cached) — mainly current Chrome/Edge. Picking MP4 feeds the
  right `mimeType` into `MediaRecorder` and `saveRecording()` now writes the file
  with whatever extension the recorder actually used (`.mp4` or `.webm`), since the
  codec-candidate list can still fall back past what was requested. True `.mov`
  isn't achievable with browser APIs alone — `MediaRecorder` only knows WebM and,
  on supporting browsers, MP4 — producing an actual QuickTime container would need
  a muxer like ffmpeg.wasm, which was judged too heavy for this project's scope.
  The choice is remembered across sessions (`__divPointersRecordFormat`).
- **Shortcuts legend (`?`).** A small popover in the HUD listing every shortcut
  (toggle, write, cursor style, record, mute, exit), opened by the `?` button and
  closed by clicking it again or tapping anywhere else.
- **Activation shortcut changed to `Ctrl+Shift+D`** (was `Alt+Shift+S`), in
  `manifest.json`'s `commands._execute_action` and the toolbar title strings in
  `background.js`. Mac is pinned to the literal Control key (`MacCtrl+Shift+D`)
  rather than letting Chrome substitute Command, matching what was asked for. Note
  this can collide with a browser's own default binding for the same combination
  (e.g. Chrome's "bookmark all tabs") — if it doesn't fire, it's rebindable at
  `chrome://extensions/shortcuts`.

## Verified

Full Playwright smoke pass against the updated `engine.js`: theme button is gone
from the HUD and no theme-related globals remain (`grep` clean); cursor style
toggle flips the button title/icon, persists to `localStorage`, and produces a
cursor `<svg>` containing a `linearGradient` when shiny; write mode turns on via
both the HUD button and the `W` key, keystrokes while it's on reveal text (and a
stray `w` inside typed text correctly toggles it off, since `W` is the universal
toggle), scrolling during write mode still works, and other letter shortcuts
(`M`) still fire normally once write mode is off; the shortcuts popover opens and
closes correctly; the recording test from 1.3.0 (start → Replay mid-recording →
stop → `.webm` download) still passes unchanged, and a new MP4-specific run
(toggle the format button → record → stop) confirmed a genuine `.mp4` file
downloads when the browser supports it. Zero new console/page errors in any run.

---

# v2 changes (1.1.0 → 2.0.0)

First "v2" feature from the futuristic-upgrade list: a **theme system**. Everything
else on the original v2 list (live video/canvas during rebuild, real multiplayer,
semantic/ARIA-based duplicate detection, director-mode camera + export, letting the
user place a piece themselves, a canvas/WebGL renderer to raise the layer cap) needs
either new permissions, a backend, or a renderer rewrite — not "easy end-to-end," so
they're left for later. This one only touches `swarm-rebuild/swarm.js` and needed no
new permissions, no backend, and no architecture change: every value it swaps
(cursor colors, an accent color, the canvas background, the music's scale/register)
was already a plain constant the rest of the engine reads at call time.

## What's new

A 🎨 button in the HUD (and the **T** key) cycles three themes, live — before a
rebuild starts or mid-rebuild:

- **Classic** — the original look and E-major-pentatonic glass piano, unchanged.
- **Blueprint** — white/blue "technical drawing" palette on a deep blueprint-blue
  canvas with a faint grid overlay; same scale, shifted up an octave for a crisper,
  more clinical chime.
- **Neon** — a vivid neon palette (pink/cyan/purple/green) on a near-black canvas,
  cursors and crosshairs rendered with a colored glow, a darker minor-pentatonic
  register for a synthwave mood.

Switching themes recolors cursors already on screen (not just new ones), reskins the
canvas background/grid/glow instantly, and re-tunes the music — all without
restarting the build. The chosen theme is remembered (`localStorage`) across
replays and future visits.

## How it works (for anyone extending this further)

- `THEMES` (top of `swarm.js`, right after `NAMES`): one object per theme —
  `colors` (cursor palette), `accent` (HUD/crosshair/selection color), `bg` (canvas
  background color, or `null` to keep using the real page's background, as Classic
  does), `grid`/`glow` (visual treatment flags), and `scale`/`root` (the musical
  scale's semitone offsets and register).
- `applyTheme(idx, engine?)` swaps the live `COLORS`/`BLUE`/`PENTA`/`E2` bindings
  that the rest of the file already reads from, persists the choice, and — if an
  `Engine` instance is passed — recolors its live cursors.
- `View.applyThemeVisuals(theme)` pushes the theme into the DOM: sets `--accent`/
  `--accent-rgb` CSS custom properties (used throughout `STYLE` for the HUD, ruler
  selection color, and selection highlight), toggles `.grid`/`.glow` classes on the
  shadow-root host (two new CSS rules handle the grid lines and the glow filter),
  and sets the canvas background.
- The HUD's 🎨 button and the `T` keyboard shortcut both call `App.cycleTheme()`,
  which calls the two functions above and forces cursor `<svg>` elements to redraw
  (their markup is cached by shape, not color, so a forced cache-bust is needed to
  show the new color on cursors that don't change shape).

## Adding a 4th theme

Add one object to the `THEMES` array — that's the entire change; the cycle button,
persistence, and all the CSS hooks are generic over the array's length.

## Verified (theme system)

Smoke-tested headlessly with Playwright against `demo/index.html`: injected the
updated `swarm.js`, let it auto-run, and clicked the theme button through a full
Classic → Blueprint → Neon → Classic cycle. No console/page errors, and the button's
title and the persisted `localStorage` index both tracked the cycle correctly.

---

# 1.3.0 — one-click recording

The README's own "for a perfect screen recording" line (about Tour mode) was an
admission that getting a shareable video out of this still meant reaching for a
separate screen recorder. This closes that gap from inside the extension, with
**no new manifest permissions** — it's built entirely on two standard web APIs any
page can call, not an extension capability:

- `navigator.mediaDevices.getDisplayMedia()` — the browser's own "pick a tab/window/
  screen to share" flow. Called with `audio: true` so ticking "share tab audio" in
  that picker captures the page's synthesized Web Audio soundtrack too, and with the
  newer `preferCurrentTab`/`selfBrowserSurface: "include"` hints so modern Chrome
  offers (and can pre-select) *this* tab with minimal friction.
- `MediaRecorder` — records that stream to WebM (vp9/opus where supported) in the
  browser, no server involved.

## What's new

A ⏺ button in the HUD (and the **R** key). Click it, pick "this tab" (+ tick "share
tab audio") in the one-time browser prompt, and it starts recording — the button
turns into a pulsing red ⏹ with a running timer. Click again (or press R, or use the
browser's own "Stop sharing" bar) to stop: the recording is packaged as a `.webm` and
downloaded immediately as `swarm-rebuild-<host>-<timestamp>.webm`. No upload, nothing
leaves the browser.

Two things that make it actually robust rather than a demo-only hack:

- **Replay doesn't cut the recording.** Clicking Replay mid-recording tears down and
  rebuilds the internal `App` instance (that's pre-existing behavior), so `restart()`
  now hands the live `MediaRecorder`/`MediaStream`/chunk buffer off to the new
  instance instead of orphaning it — one continuous video can span several rebuilds
  back to back.
- **Closing mid-recording still saves what you have.** `App.destroy()` stops and
  saves the recording before tearing down, so hitting Esc, "Go live," or the ✕ while
  recording doesn't silently throw the video away.

## How it works

- `App.startRecord()` / `stopRecord()` / `saveRecording()` / `renderRecordBtn()`
  (added next to the existing theme methods) own the whole lifecycle: request the
  display stream, wire up `MediaRecorder`, buffer `ondataavailable` chunks, and on
  stop assemble a `Blob` → `URL.createObjectURL` → a synthetic `<a download>` click.
- The record button's elapsed-time text piggybacks on the existing 200ms HUD tick
  (`App.frame()`) that already refreshes the sound button, rather than adding a
  second timer.
- `stream.getVideoTracks()[0].onended` treats the browser's own "Stop sharing" button
  exactly like pressing the extension's stop button, so there's no path where the
  recorder is left dangling with a dead stream.

## Verified

Headless Playwright test against `demo/index.html`, with `--use-fake-ui-for-media-
stream`/`--use-fake-device-for-media-stream` and `getDisplayMedia` mocked to return a
*real* `MediaStream` (`canvas.captureStream()` + an oscillator through
`createMediaStreamDestination()`), so `MediaRecorder` exercises genuine browser APIs
end to end — only the OS-level share picker itself (which can't be automated, and
isn't part of this extension's code) is stubbed. The test: clicked Record, watched
the button flip to a running `⏹ 0:0N` timer, clicked **Replay** mid-recording and
confirmed the timer kept counting (didn't reset) through the rebuild restart, then
clicked Stop and confirmed a `swarm-rebuild-localhost-<timestamp>.webm` download
actually fired. Zero console/page errors introduced.

## Still open

Real multiplayer (WebRTC/WebSocket), live video/canvas during the rebuild instead of
a frozen screenshot, ARIA/semantic duplicate detection, a director-mode auto-zoom
camera, letting the user place a piece themselves, and a canvas/WebGL renderer to
raise the ~4,000-layer cap — each needs a backend, new permissions, or a renderer
rewrite, so they're left for a future pass.

---

# 2.0.0 — renamed to divPointers

Full rebrand: this is **divPointers**, authored by Nitin. Every internal and
user-facing identifier was renamed for consistency, and the extension's own folder
was renamed to `divpointers/`:

- `manifest.json`: `name` → `divPointers`, added `"author": "Nitin"`, `version` →
  `2.0.0`, retitled the toolbar/command strings.
- `swarm.js` renamed to `engine.js`; `background.js` updated to match.
- Internal identifiers renamed for consistency (none of these are user-visible):
  the custom element tag → `<div-pointers>`, the window global → `__divPointers`,
  the screenshot/hide-state globals shared with `background.js` → `__divPointersShot`,
  `__divPointersHidden`/`__divPointersUnhide`, the internal message type →
  `divptr:unhide`, the debug hook → `__divPointersSfxLog`, the `localStorage` theme
  key → `__divPointersTheme`, console log tags, and the recorded video's filename
  prefix → `divpointers-*.webm`.
- `README.md`, `PRIVACY.md` and `store/LISTING.md` rewritten for divPointers, with
  install instructions pointing at the `divpointers/` folder.

## Verified

Re-ran both existing Playwright smoke tests (theme cycling, recording-through-replay)
against the renamed `engine.js`/`<div-pointers>` element — same results as before the
rename, zero new console/page errors. Also specifically tested the toggle-on/
toggle-off re-injection path (clicking the toolbar icon a second time), since that
logic depends on the renamed `window.__divPointers` global: confirmed it still
correctly removes the `<div-pointers>` element on the second injection.
