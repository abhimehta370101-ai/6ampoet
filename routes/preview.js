// routes/preview.js
// Dev/staging-only page viewer: every page of the site in live iframes,
// with mobile/desktop viewport toggles and reload-all.
//
// SECURITY: mounted ONLY when ENABLE_PREVIEW=1 (set on the Railway staging
// environment, never on production) AND gated behind the existing admin
// session. Both conditions — the env flag alone is not enough.
//
// Integration (server.js):
//   if (process.env.ENABLE_PREVIEW === "1") {
//     app.use("/preview", requireAdmin, require("./routes/preview"));
//   }
//
// NOTE: helmet sets X-Frame-Options / frame-ancestors by default, which
// blocks same-origin iframes. On staging, configure helmet with:
//   frameguard: { action: "sameorigin" }
// and in CSP: "frame-ancestors": ["'self'"], "frame-src": ["'self'"]

const express = require("express");
const router = express.Router();

// Every page worth eyeballing after a Claude Code change.
// Add new routes here as the site grows.
const PAGES = [
  { path: "/",            label: "Splash (sunset)" },
  { path: "/join",        label: "Founding 100 landing" },
  { path: "/member",      label: "Member area (shows login state if logged out)" },
  { path: "/admin",       label: "Admin (shows login if logged out)" },
];

router.get("/", (req, res) => {
  const frames = PAGES.map(p => `
    <section class="pane" data-path="${p.path}">
      <header>
        <span>${p.label} <code>${p.path}</code></span>
        <span class="controls">
          <button data-w="375">mobile</button>
          <button data-w="768">tablet</button>
          <button data-w="1280" class="active">desktop</button>
          <button data-reload>↻</button>
          <a href="${p.path}" target="_blank" rel="noopener">open ↗</a>
        </span>
      </header>
      <div class="frame-wrap"><iframe src="${p.path}" loading="lazy" title="${p.label}"></iframe></div>
    </section>`).join("");

  res.type("html").send(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>6ampoet — page viewer</title>
<style>
  *{box-sizing:border-box;margin:0}
  body{font:14px/1.4 system-ui,sans-serif;background:#14100C;color:#F5EFE6;padding:1rem}
  h1{font-size:1.1rem;font-weight:500;margin-bottom:.25rem}
  .meta{color:#9c8f80;font-size:.8rem;margin-bottom:1rem}
  .toolbar{margin-bottom:1rem}
  .toolbar button{cursor:pointer;background:#2A2018;color:#F5EFE6;border:1px solid #4a3c2e;
    border-radius:6px;padding:.4rem .9rem;font-size:.85rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:1rem}
  .pane{background:#1E1710;border:1px solid #35291d;border-radius:10px;overflow:hidden}
  .pane header{display:flex;justify-content:space-between;align-items:center;gap:.5rem;
    padding:.5rem .75rem;font-size:.82rem;flex-wrap:wrap}
  .pane code{color:#c9a86a;margin-left:.3rem}
  .controls button,.controls a{cursor:pointer;background:none;border:1px solid #4a3c2e;
    color:#c9bba9;border-radius:5px;padding:.15rem .5rem;font-size:.75rem;text-decoration:none}
  .controls button.active{background:#4a3c2e;color:#F5EFE6}
  .frame-wrap{background:#000;display:flex;justify-content:center;overflow:auto;
    resize:vertical;height:560px;min-height:240px}
  iframe{border:0;width:100%;max-width:var(--w,1280px);height:100%;background:#fff;
    transition:max-width .25s ease}
</style></head>
<body>
  <h1>6ampoet page viewer</h1>
  <p class="meta">Staging preview — panes are live iframes. Drag a pane's bottom edge to
  change its height. For the splash's no-cookie (sunset) state, open it in a private
  window; this browser may already carry the sixam_card cookie.</p>
  <div class="toolbar"><button id="reloadAll">Reload all pages</button></div>
  <div class="grid">${frames}</div>
<script>
(function(){
  document.querySelectorAll(".pane").forEach(function(pane){
    var iframe = pane.querySelector("iframe");
    pane.querySelectorAll("[data-w]").forEach(function(b){
      b.addEventListener("click", function(){
        pane.querySelectorAll("[data-w]").forEach(function(x){ x.classList.remove("active"); });
        b.classList.add("active");
        iframe.style.setProperty("--w", b.dataset.w + "px");
      });
    });
    pane.querySelector("[data-reload]").addEventListener("click", function(){
      iframe.src = iframe.src;
    });
  });
  document.getElementById("reloadAll").addEventListener("click", function(){
    document.querySelectorAll("iframe").forEach(function(f){ f.src = f.src; });
  });
})();
</script>
</body></html>`);
});

module.exports = router;
