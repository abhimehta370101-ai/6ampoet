const { adminShell } = require('./shared');
const { escapeHtml } = require('../../lib/escape');

function formatDate(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : '—';
}

function membersPage({ members }) {
  const rows = members
    .map(
      (m) => `<tr>
        <td>${escapeHtml(m.email)}</td>
        <td>${m.member_number || '—'}</td>
        <td>${escapeHtml(m.tier)}</td>
        <td>${formatDate(m.ebook_sent_at)}</td>
        <td>${formatDate(m.created_at)}</td>
      </tr>`
    )
    .join('\n');

  const content = `
    <h1>Members</h1>
    <p><a class="btn small" href="/admin/members.csv">Export CSV</a></p>
    <table>
      <thead>
        <tr><th>Email</th><th>#</th><th>Tier</th><th>Ebook sent</th><th>Joined</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  return adminShell({ title: 'Admin — Members', active: 'members', content });
}

module.exports = { membersPage };
