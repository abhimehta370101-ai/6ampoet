const { adminShell } = require('./shared');

function dashboardPage({ foundingCount, cap, waitlistCount, pendingTestimonialCount, ebookReady, blastResult, cardDownloadsTotal, cardDownloadsRecent }) {
  const blastFlash = blastResult
    ? `<div class="flash">Ebook blast complete — sent to ${blastResult.sent} member(s)${blastResult.failed ? `, ${blastResult.failed} failed` : ''}.</div>`
    : '';

  const blastButton = ebookReady
    ? `<form method="POST" action="/admin/ebook-blast">
        <button type="submit" class="btn">Send ebook to all founding members who haven't received it</button>
      </form>`
    : `<button class="btn secondary" disabled title="Set EBOOK_R2_KEY and upload the PDF first">Send ebook to all founding members who haven't received it</button>
       <p style="font-size:13px;color:#666;">Disabled until EBOOK_R2_KEY is set and the file exists in R2.</p>`;

  const content = `
    <h1>Dashboard</h1>
    ${blastFlash}
    <div class="stat-row">
      <div class="stat-card">
        <div class="num">${foundingCount} / ${cap}</div>
        <div class="label">Founding members</div>
      </div>
      <div class="stat-card">
        <div class="num">${waitlistCount}</div>
        <div class="label">Waitlist</div>
      </div>
      <div class="stat-card">
        <div class="num">${pendingTestimonialCount}</div>
        <div class="label">Pending testimonials</div>
      </div>
      <div class="stat-card">
        <div class="num">${cardDownloadsTotal}</div>
        <div class="label">Card downloads (${cardDownloadsRecent} in last 7 days)</div>
      </div>
    </div>

    <section class="panel">
      <h2>Ebook blast</h2>
      ${blastButton}
    </section>
  `;

  return adminShell({ title: 'Admin dashboard', active: 'dashboard', content });
}

module.exports = { dashboardPage };
