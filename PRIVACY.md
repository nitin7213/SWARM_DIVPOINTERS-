# Privacy policy: divPointers

divPointers does not collect, store, sell or transmit any personal data.

**Single purpose:** animate a rebuild of the current web page — when you click the
icon, the page is replaced by a canvas on which animated cursors redraw its layout,
text and images, with an optional recording of that rebuild.

**Permissions:**

- `activeTab`: runs only on the tab you explicitly click the icon on (or press
  Alt+Shift+S on), and is used to capture that tab once so canvases, videos and
  iframes can be redrawn. No access to any other tab or site.
- `scripting`: injects the bundled animation script into the active tab, and briefly
  applies CSS that leaves only media visible for that one screenshot.

**Recording:** uses the browser's own screen/tab-sharing picker
(`getDisplayMedia`) and `MediaRecorder`, both standard browser APIs — not an
extension permission. Nothing is uploaded anywhere; the finished video is written
straight to your downloads as a `.webm` file.

**Remote code:** none. All JavaScript ships inside the extension package.

**Data usage:** collects no user data of any kind.

Questions: ask Nitin directly. (No public issue tracker yet — this policy doesn't
have a hosted URL, which would be needed before any real Chrome Web Store
submission.)
