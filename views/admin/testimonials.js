const { adminShell } = require('./shared');
const { escapeHtml } = require('../../lib/escape');

function pendingRow(t) {
  return `<tr>
    <td>${escapeHtml(t.author_name)}</td>
    <td>${escapeHtml(t.body)}</td>
    <td>${t.source === 'instagram' ? 'Instagram' : 'Member'}</td>
    <td>
      <form class="inline" method="POST" action="/admin/testimonials/${t.id}/approve">
        <button type="submit" class="btn small">Approve</button>
      </form>
      <form class="inline" method="POST" action="/admin/testimonials/${t.id}/reject">
        <button type="submit" class="btn danger small">Reject</button>
      </form>
    </td>
  </tr>`;
}

function publishedRow(t) {
  return `<tr>
    <td>
      <form method="POST" action="/admin/testimonials/${t.id}/update">
        <input type="text" name="author_name" value="${escapeHtml(t.author_name)}" style="width:120px;">
    </td>
    <td>
        <textarea name="body" rows="2" style="width:260px;">${escapeHtml(t.body)}</textarea>
    </td>
    <td>${t.source === 'instagram' ? 'Instagram' : 'Member'}</td>
    <td>
        <input type="number" name="display_order" value="${t.display_order}" style="width:60px;">
    </td>
    <td>
        <button type="submit" class="btn small">Save</button>
      </form>
      <form class="inline" method="POST" action="/admin/testimonials/${t.id}/delete">
        <button type="submit" class="btn danger small">Delete</button>
      </form>
    </td>
  </tr>`;
}

function testimonialsPage({ pending, published }) {
  const pendingSection = pending.length
    ? `<table>
        <thead><tr><th>Author</th><th>Body</th><th>Source</th><th>Actions</th></tr></thead>
        <tbody>${pending.map(pendingRow).join('\n')}</tbody>
      </table>`
    : `<p style="color:#666;">No pending submissions.</p>`;

  const publishedSection = published.length
    ? `<table>
        <thead><tr><th>Author</th><th>Body</th><th>Source</th><th>Order</th><th>Actions</th></tr></thead>
        <tbody>${published.map(publishedRow).join('\n')}</tbody>
      </table>`
    : `<p style="color:#666;">No published testimonials yet.</p>`;

  const content = `
    <h1>Testimonials</h1>

    <section class="panel">
      <h2>Add Instagram-sourced testimonial</h2>
      <form method="POST" action="/admin/testimonials">
        <input type="hidden" name="source" value="instagram">
        <p><input type="text" name="author_name" placeholder="Author name" required style="width:240px;"></p>
        <p><textarea name="body" rows="3" placeholder="Testimonial text" required style="width:400px;"></textarea></p>
        <button type="submit" class="btn small">Add</button>
      </form>
    </section>

    <section class="panel">
      <h2>Pending review</h2>
      ${pendingSection}
    </section>

    <section class="panel">
      <h2>Published</h2>
      ${publishedSection}
    </section>
  `;

  return adminShell({ title: 'Admin — Testimonials', active: 'testimonials', content });
}

module.exports = { testimonialsPage };
