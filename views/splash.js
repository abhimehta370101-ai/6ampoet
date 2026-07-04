// views/splash.js
// Renders the 6ampoet splash page.
// States:
//   1. Sunset (default): logo sun high, card download CTA, founding link.
//   2. Nightfall (after download, or on return visit with the sixam_card cookie):
//      sky crossfades to night, sun sets, moon rises, stars twinkle,
//      shooting stars streak, and the founding email form blooms in.
//
// renderSplash({ foundingCount, cap, hasCard })
//   foundingCount : current number of founding members
//   cap           : FOUNDING_CAP (e.g. 100)
//   hasCard       : true when the sixam_card cookie is present (return visitor)

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function renderSplash({ foundingCount = 0, cap = 100, hasCard = false } = {}) {
  const spotsLeft = Math.max(0, cap - foundingCount);
  const isFull = spotsLeft === 0;

  const joinLabel = isFull
    ? "The Founding 100 is full — join the waitlist"
    : `Join the Founding 100 — ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`;

  const nightHeading = hasCard
    ? "Still carrying the card?"
    : "The sun has set. The poems begin at six.";

  const nightSub = hasCard
    ? (isFull
        ? "The Founding 100 has filled — but the waitlist is open for opening day of the membership."
        : `The card was the first line. The Founding 100 receive a poem every morning — free, forever. ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} remain.`)
    : (isFull
        ? "Your numbered card is downloading. The Founding 100 has filled — join the waitlist for opening day."
        : "Your numbered card is downloading. The Founding 100 receive a poem every morning — free, forever.");

  const formButton = isFull ? "Join the waitlist" : "Claim my founding spot";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>6am Poet — poetry for the hour before the world wakes</title>
<meta name="description" content="Take the 6am Poet card with you — a numbered edition, no email required — and join the Founding 100 for a poem every morning.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Newsreader:ital,opsz,wght@1,6..72,300&display=swap" rel="stylesheet">
<style>
  :root{
    --gold:#FFB800; --ember:#FF5A36; --rose:#FF7BA9; --violet:#8A6BE8;
    --plum:#2B0B45; --midnight:#081426; --nightdeep:#04070F;
    --paper:#F5EFE6; --ink:#1A1410;
    --dur-sky:4.5s; --dur-sun:5s; --dur-moon:6s;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{height:100%}
  body{
    font-family:"Newsreader",Georgia,serif;
    color:var(--ink);
    overflow-x:hidden;
    min-height:100svh;
  }

  /* ---------- The sky (signature element: the page IS the sky) ---------- */
  .sky{position:fixed;inset:0;z-index:-2}
  .sky--sunset{
    background:linear-gradient(180deg,
      var(--gold) 0%, var(--ember) 26%, var(--rose) 46%,
      var(--violet) 68%, var(--plum) 100%);
  }
  .sky--night{
    background:linear-gradient(180deg,
      var(--nightdeep) 0%, var(--midnight) 55%, #170A30 88%, #241040 100%);
    opacity:0;
    transition:opacity var(--dur-sky) ease-in-out;
    z-index:-1;
  }
  body.night .sky--night{opacity:1}

  /* Stars live inside the night layer so they inherit its fade-in */
  .stars{position:absolute;inset:0;overflow:hidden}
  .star{
    position:absolute;border-radius:50%;
    background:var(--paper);
    animation:twinkle var(--tw,3.4s) ease-in-out infinite alternate;
    animation-delay:var(--td,0s);
    opacity:.85;
  }
  @keyframes twinkle{
    from{opacity:.25;transform:scale(.8)}
    to{opacity:.95;transform:scale(1.05)}
  }
  /* Slow ambient drift of the whole field — "a nightfall that is moving" */
  body.night .stars{animation:drift 240s linear infinite}
  @keyframes drift{
    from{transform:translateX(0)}
    to{transform:translateX(-4vw)}
  }
  .shooter{
    position:absolute;width:130px;height:1.5px;border-radius:2px;
    background:linear-gradient(90deg,rgba(245,239,230,0) 0%,rgba(245,239,230,.95) 100%);
    transform:rotate(-32deg);
    animation:shoot 1.15s ease-out forwards;
    pointer-events:none;
  }
  @keyframes shoot{
    from{opacity:0;translate:0 0}
    12%{opacity:1}
    to{opacity:0;translate:-46vw 30vh}
  }

  /* ---------- Sun (logo) and moon ---------- */
  .sun{
    width:clamp(88px,14vw,132px);height:auto;display:block;margin:0 auto 1.1rem;
    transition:transform var(--dur-sun) cubic-bezier(.5,0,.7,.4), opacity var(--dur-sun) ease;
    filter:drop-shadow(0 0 34px rgba(255,184,0,.55));
  }
  body.night .sun{transform:translateY(58vh) scale(.86);opacity:0}

  .moon{
    position:fixed;top:9vh;right:11vw;width:clamp(64px,9vw,104px);height:auto;
    transform:translateY(64vh);opacity:0;
    transition:transform var(--dur-moon) cubic-bezier(.2,.6,.3,1) 1.4s, opacity 3s ease 1.6s;
    filter:drop-shadow(0 0 26px rgba(220,228,255,.35));
    z-index:0;pointer-events:none;
  }
  body.night .moon{transform:translateY(0);opacity:1}

  /* ---------- Layout ---------- */
  main{
    min-height:100svh;display:flex;flex-direction:column;align-items:center;
    justify-content:center;text-align:center;
    padding:8vh 1.4rem 10vh;position:relative;z-index:1;
  }
  .wordmark{
    font-family:"Fraunces",serif;font-weight:300;font-optical-sizing:auto;
    font-size:clamp(2.1rem,6vw,3.4rem);letter-spacing:.01em;color:var(--ink);
    transition:color var(--dur-sky) ease;
  }
  body.night .wordmark{color:var(--paper)}
  .whisper{
    font-style:italic;font-weight:300;
    font-size:clamp(1.02rem,2.4vw,1.25rem);
    margin-top:.55rem;color:rgba(26,20,16,.78);
    transition:color var(--dur-sky) ease, opacity 1.4s ease;
  }
  body.night .whisper{color:rgba(245,239,230,.72)}

  /* Pocket-card preview: clickable, flips gradient front -> poem back,
     then triggers the numbered download */
  .card-flip{
    width:min(300px,74vw);aspect-ratio:1050/600;
    margin:2.6rem auto 1.5rem;
    perspective:1100px;cursor:pointer;border:none;background:none;
    display:block;padding:0;
    transition:opacity 1.4s ease, transform 1.4s ease;
  }
  .card-flip:focus-visible{outline:3px solid var(--violet);outline-offset:5px;border-radius:12px}
  .card-inner{
    position:relative;width:100%;height:100%;
    transform-style:preserve-3d;
    transition:transform .9s cubic-bezier(.35,0,.25,1);
  }
  .card-flip:hover .card-inner{transform:rotateY(14deg)}
  .card-flip.flipped .card-inner,
  .card-flip.flipped:hover .card-inner{transform:rotateY(180deg)}
  .card-face{
    position:absolute;inset:0;border-radius:10px;
    backface-visibility:hidden;-webkit-backface-visibility:hidden;
    box-shadow:0 18px 44px rgba(23,8,42,.35);
    overflow:hidden;
  }
  .card-face--front{
    background:linear-gradient(90deg,
      var(--gold) 0%, var(--ember) 20%, var(--rose) 36%,
      var(--violet) 58%, var(--plum) 80%, var(--midnight) 100%);
    display:flex;align-items:flex-end;justify-content:flex-start;
    padding:.7rem .9rem;
  }
  .card-face--front span{
    font-family:"Fraunces",serif;font-size:.72rem;letter-spacing:.14em;
    text-transform:uppercase;color:rgba(245,239,230,.9);
  }
  .card-face--back{
    transform:rotateY(180deg);
    background:
      radial-gradient(2px 2px at 88% 84%, rgba(255,90,54,.55) 50%, transparent 51%),
      radial-gradient(2px 2px at 93% 76%, rgba(255,184,0,.5) 50%, transparent 51%),
      radial-gradient(1.6px 1.6px at 82% 90%, rgba(138,107,232,.5) 50%, transparent 51%),
      radial-gradient(1.6px 1.6px at 95% 90%, rgba(255,123,169,.55) 50%, transparent 51%),
      radial-gradient(1.4px 1.4px at 90% 68%, rgba(26,20,16,.4) 50%, transparent 51%),
      #FBF8F2;
    color:var(--ink);
    display:flex;flex-direction:column;justify-content:center;
    padding:.75rem 1.1rem;text-align:left;
    font-family:"Fraunces",serif;font-weight:300;
    font-size:clamp(.5rem,2.1vw,.62rem);line-height:1.45;
  }
  .card-face--back .l1{margin-bottom:.35em}
  .card-face--back .l2{margin-bottom:.55em}
  .card-face--back .cluster{margin-bottom:.55em}
  .card-face--back em{font-style:italic}
  .card-face--back strong{font-weight:600}
  .card-face--back .handle{
    margin-top:.6em;font-size:.9em;letter-spacing:.08em;color:rgba(26,20,16,.6);
  }
  body.night .day-only{opacity:0;transform:translateY(10px);pointer-events:none}

  .btn{
    font-family:"Fraunces",serif;font-size:1.05rem;letter-spacing:.02em;
    padding:.85rem 2.1rem;border-radius:999px;border:1.5px solid var(--ink);
    background:transparent;color:var(--ink);cursor:pointer;
    transition:background .35s ease,color .35s ease,border-color .35s ease,opacity .8s ease;
  }
  .btn:hover{background:var(--ink);color:var(--paper)}
  .btn:focus-visible{outline:3px solid var(--violet);outline-offset:3px}
  .btn[disabled]{opacity:.55;cursor:wait}

  .fineprint{
    margin-top:.8rem;font-size:.86rem;font-style:italic;color:rgba(26,20,16,.62);
  }
  .join-link{
    margin-top:2.2rem;display:inline-block;font-family:"Fraunces",serif;
    font-size:.98rem;color:var(--ink);text-decoration:none;
    border-bottom:1px solid rgba(26,20,16,.45);padding-bottom:2px;
  }
  .join-link:hover{border-bottom-color:var(--ink)}
  .join-link:focus-visible{outline:3px solid var(--violet);outline-offset:3px}

  /* ---------- Nightfall panel (email capture) ---------- */
  .nightfall{
    position:relative;z-index:1;max-width:34rem;margin:0 auto;
    padding:0 1.4rem 12vh;text-align:center;color:var(--paper);
    opacity:0;transform:translateY(18px);
    transition:opacity 1.8s ease 2.6s, transform 1.8s ease 2.6s;
    visibility:hidden;
  }
  body.night .nightfall{opacity:1;transform:none;visibility:visible}
  .nightfall h2{
    font-family:"Fraunces",serif;font-weight:300;
    font-size:clamp(1.5rem,4.2vw,2.2rem);margin-bottom:.7rem;
  }
  .nightfall p{font-weight:300;font-size:1.02rem;line-height:1.55;color:rgba(245,239,230,.82)}
  .serial-line{margin-top:.6rem;font-style:italic}
  .nightfall form{
    margin-top:1.6rem;display:flex;gap:.6rem;flex-wrap:wrap;justify-content:center;
  }
  .nightfall input[type=email]{
    font-family:"Newsreader",serif;font-size:1rem;
    padding:.8rem 1.1rem;border-radius:999px;min-width:min(280px,72vw);
    border:1.5px solid rgba(245,239,230,.5);background:rgba(245,239,230,.06);
    color:var(--paper);
  }
  .nightfall input[type=email]::placeholder{color:rgba(245,239,230,.45)}
  .nightfall input[type=email]:focus-visible{outline:3px solid var(--violet);outline-offset:2px}
  .btn--night{border-color:var(--paper);color:var(--paper)}
  .btn--night:hover{background:var(--paper);color:var(--midnight)}
  .form-msg{margin-top:1rem;font-style:italic;min-height:1.4em;color:rgba(245,239,230,.85)}

  footer{
    position:relative;z-index:1;text-align:center;padding:0 1rem 2rem;
    font-size:.82rem;color:rgba(26,20,16,.55);transition:color var(--dur-sky) ease;
  }
  body.night footer{color:rgba(245,239,230,.45)}
  footer a{color:inherit}

  /* Return visitors: arrive at night without sitting through the full dusk */
  body.is-returning{--dur-sky:.9s;--dur-sun:.9s;--dur-moon:1.4s}
  body.is-returning .nightfall{transition-delay:.4s,.4s}

  @media (prefers-reduced-motion: reduce){
    .sky--night,.sun,.moon,.nightfall,.wordmark,.whisper,.card-flip,.card-inner{transition:none!important}
    .star,.stars,.shooter{animation:none!important}
    .star{opacity:.8}
    .card-flip:hover .card-inner{transform:none}
  }
</style>
</head>
<body class="${hasCard ? "night is-returning" : ""}">

  <div class="sky sky--sunset" aria-hidden="true"></div>
  <div class="sky sky--night" aria-hidden="true">
    <div class="stars" id="stars"></div>
  </div>

  <!-- Moon: rises after nightfall -->
  <svg class="moon" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <radialGradient id="moonGlow" cx="42%" cy="38%" r="75%">
        <stop offset="0%" stop-color="#F7F4EC"/>
        <stop offset="78%" stop-color="#DDE0E8"/>
        <stop offset="100%" stop-color="#C3C9D8"/>
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#moonGlow)"/>
    <circle cx="36" cy="40" r="7"  fill="#C9CEDD" opacity=".55"/>
    <circle cx="62" cy="61" r="10" fill="#C9CEDD" opacity=".4"/>
    <circle cx="58" cy="30" r="4.5" fill="#C9CEDD" opacity=".5"/>
    <circle cx="40" cy="66" r="4"  fill="#C9CEDD" opacity=".45"/>
  </svg>

  <main>
    <!-- Sun logo: rebuilt inline so it sits on the gradient with no white box -->
    <svg class="sun" viewBox="0 0 120 120" role="img" aria-label="6am Poet rising sun">
      <defs>
        <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#FFDFA3"/>
          <stop offset="52%" stop-color="#FFAF62"/>
          <stop offset="53%" stop-color="#F79355"/>
          <stop offset="100%" stop-color="#EE7A4E"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#sunset)"/>
    </svg>

    <h1 class="wordmark">6am Poet</h1>
    <p class="whisper">Poetry for the hour before the world wakes.</p>

    <section class="day-only" aria-label="Take the 6am Poet card">
      <button class="card-flip" id="cardFlip" type="button"
              aria-label="Flip the 6am Poet card and download your numbered copy">
        <span class="card-inner">
          <span class="card-face card-face--front" aria-hidden="true">
            <span>Breathe in life</span>
          </span>
          <span class="card-face card-face--back" aria-hidden="true">
            <span class="l1">Breathe in Life</span>
            <span class="l2">Dare to Be</span>
            <span class="cluster">Peace &nbsp;Joy &nbsp;<strong>Free</strong> &nbsp;Light &nbsp;Love</span>
            <span class="cluster"><em>because</em></span>
            <span>I love &nbsp;You love &nbsp;He loves &nbsp;She loves &nbsp;We, love.</span>
            <span class="handle">@6ampoet</span>
          </span>
        </span>
      </button>
      <button class="btn" id="downloadBtn" type="button">Take the card with you</button>
      <p class="fineprint">A numbered edition. No email. No ads. Nothing shared.</p>
      <a class="join-link" href="/join">${esc(joinLabel)}</a>
    </section>
  </main>

  <section class="nightfall" id="nightfall" aria-live="polite">
    <h2>${esc(nightHeading)}</h2>
    <p>${esc(nightSub)}</p>
    <p class="serial-line" id="serialLine" hidden>Card No. <span id="serialNo"></span> is yours.</p>
    <form id="joinForm" novalidate>
      <label for="email" class="sr-only" style="position:absolute;left:-9999px">Email address</label>
      <input type="email" id="email" name="email" placeholder="your@email.com" autocomplete="email" required>
      <button class="btn btn--night" type="submit">${esc(formButton)}</button>
    </form>
    <p class="form-msg" id="formMsg"></p>
  </section>

  <footer>
    <a href="https://instagram.com/6ampoet" rel="noopener">@6ampoet</a>
    &nbsp;·&nbsp; <a href="/join">the Founding 100</a>
  </footer>

<script>
(function(){
  "use strict";
  var body = document.body;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----- Star field ----- */
  var starsEl = document.getElementById("stars");
  var STAR_COUNT = Math.min(150, Math.round(window.innerWidth / 9));
  for (var i = 0; i < STAR_COUNT; i++) {
    var s = document.createElement("span");
    s.className = "star";
    var size = (Math.random() * 1.9 + 0.6).toFixed(2);
    s.style.width = size + "px";
    s.style.height = size + "px";
    s.style.left = (Math.random() * 104 - 2).toFixed(2) + "%";
    s.style.top = (Math.random() * 78).toFixed(2) + "%";
    s.style.setProperty("--tw", (Math.random() * 3.2 + 2.2).toFixed(2) + "s");
    s.style.setProperty("--td", (Math.random() * 5).toFixed(2) + "s");
    starsEl.appendChild(s);
  }

  /* ----- Shooting stars: one streak every 6–15 s while it's night ----- */
  var shootTimer = null;
  function scheduleShooter(){
    shootTimer = setTimeout(function(){
      if (body.classList.contains("night") && !reduced) {
        var sh = document.createElement("span");
        sh.className = "shooter";
        sh.style.left = (Math.random() * 55 + 35).toFixed(1) + "%";
        sh.style.top  = (Math.random() * 32 + 4).toFixed(1) + "%";
        starsEl.appendChild(sh);
        setTimeout(function(){ sh.remove(); }, 1400);
      }
      scheduleShooter();
    }, Math.random() * 9000 + 6000);
  }
  scheduleShooter();

  function nightfall(){
    if (!body.classList.contains("night")) body.classList.add("night");
  }

  /* ----- Download → numbered PDF → transition ----- */
  var btn = document.getElementById("downloadBtn");
  var card = document.getElementById("cardFlip");
  var downloading = false;

  function startDownload(){
    if (downloading) return;
    downloading = true;
    if (btn) { btn.disabled = true; btn.textContent = "Numbering your card…"; }
    fetch("/card/download")
      .then(function(res){
        if (res.status === 429) throw new Error("busy");
        if (!res.ok) throw new Error("failed");
        var serial = res.headers.get("X-Card-Serial") || "";
        return res.blob().then(function(blob){ return { blob: blob, serial: serial }; });
      })
      .then(function(r){
        var url = URL.createObjectURL(r.blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "6ampoet-card-no-" + (r.serial || "edition") + ".pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function(){ URL.revokeObjectURL(url); }, 30000);
        if (r.serial) {
          document.getElementById("serialNo").textContent = r.serial;
          document.getElementById("serialLine").hidden = false;
        }
        // Let the poem side sit in view for a beat before dusk falls.
        var pause = (card && card.classList.contains("flipped") && !reduced) ? 1400 : 0;
        setTimeout(nightfall, pause);
      })
      .catch(function(err){
        downloading = false;
        if (btn) { btn.disabled = false; btn.textContent = "Take the card with you"; }
        if (card) card.classList.remove("flipped");
        var msg = err.message === "busy"
          ? "The sky is crowded right now — try again in a minute."
          : "Something slipped. Try the download again.";
        var note = document.querySelector(".fineprint");
        if (note) note.textContent = msg;
      });
  }

  if (card) card.addEventListener("click", function(){
    if (downloading) return;
    card.classList.add("flipped");
    // Begin the download as the flip lands (transition is .9s).
    setTimeout(startDownload, reduced ? 0 : 650);
  });
  if (btn) btn.addEventListener("click", startDownload);

  /* ----- Founding signup (posts to the existing Phase 0 endpoint) ----- */
  var form = document.getElementById("joinForm");
  var msg = document.getElementById("formMsg");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var email = document.getElementById("email").value.trim();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      msg.textContent = "That email doesn't look complete.";
      return;
    }
    var submitBtn = form.querySelector("button");
    submitBtn.disabled = true;
    fetch("/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "email=" + encodeURIComponent(email)
    })
      .then(function(res){
        if (!res.ok) throw new Error();
        msg.textContent = "Check your inbox — your link is on the way.";
        form.reset();
      })
      .catch(function(){
        msg.textContent = "The message didn't send. Try once more.";
        submitBtn.disabled = false;
      });
  });
})();
</script>
</body>
</html>`;
}

module.exports = { renderSplash };
