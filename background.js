// Clicking the toolbar icon (or Ctrl+Shift+D) injects the swarm into the active tab.
// Injecting again while it is running toggles it off.

// For one screenshot frame, show only the pixels the DOM can't give back
// (WebGL canvases, playing video, cross-origin iframes) so the swarm can crop them cleanly.
const MEDIA_ONLY_CSS = `
html body *:not(canvas):not(video):not(iframe):not(embed):not(object) { visibility: hidden !important; }
html body canvas, html body video, html body iframe, html body embed, html body object { visibility: visible !important; }
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rebuild(tab) {
  if (!tab || tab.id == null) return;
  const target = { tabId: tab.id };
  let hidden = false;
  try {
    const [probe] = await chrome.scripting.executeScript({
      target,
      func: () => {
        const running = !!(window.__divPointers && window.__divPointers.app);
        let media = false;
        if (!running) {
          for (const el of document.querySelectorAll("canvas, video, iframe, embed, object")) {
            const r = el.getBoundingClientRect();
            if (r.width > 8 && r.height > 8 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth) {
              media = true;
              break;
            }
          }
        }
        return { running, media };
      },
    });
    const { running, media } = probe.result || {};
    if (!running && media) {
      try {
        await chrome.scripting.insertCSS({ target, css: MEDIA_ONLY_CSS });
        hidden = true;
        await sleep(90);
        const shot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
        await chrome.scripting.executeScript({
          target,
          func: (s) => {
            window.__divPointersShot = s;
            window.__divPointersHidden = true;
          },
          args: [shot],
        });
      } catch (_) {
        // no screenshot: those regions fall back to placeholders
        if (hidden) {
          await chrome.scripting.removeCSS({ target, css: MEDIA_ONLY_CSS }).catch(() => {});
          hidden = false;
        }
      }
    }
    await chrome.scripting.executeScript({ target, files: ["engine.js"] });
  } catch (err) {
    if (hidden) await chrome.scripting.removeCSS({ target, css: MEDIA_ONLY_CSS }).catch(() => {});
    // chrome://, the Web Store, PDFs and other protected pages can't be scripted.
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#F24822" });
    await chrome.action.setBadgeText({ tabId: tab.id, text: "×" });
    await chrome.action.setTitle({ tabId: tab.id, title: "divPointers can't run on this page" });
    setTimeout(() => {
      chrome.action.setBadgeText({ tabId: tab.id, text: "" });
      chrome.action.setTitle({ tabId: tab.id, title: "divPointers (Ctrl+Shift+D)" });
    }, 2500);
  }
}

chrome.action.onClicked.addListener(rebuild);

// The swarm asks us to restore the page once its own canvas fully covers it.
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg && msg.type === "divptr:unhide" && sender.tab) {
    chrome.scripting
      .removeCSS({ target: { tabId: sender.tab.id }, css: MEDIA_ONLY_CSS })
      .catch(() => {})
      .then(() => reply(true));
    return true;
  }
});
