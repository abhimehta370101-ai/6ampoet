const { layout } = require('../layout');

function adminShell({ title, active, content }) {
  const navItem = (href, label, key) =>
    `<a href="${href}" style="${active === key ? 'font-weight:700;' : ''}">${label}</a>`;

  const body = `
    <div class="wrap">
      <nav>
        ${navItem('/admin', 'Dashboard', 'dashboard')}
        ${navItem('/admin/members', 'Members', 'members')}
        ${navItem('/admin/testimonials', 'Testimonials', 'testimonials')}
        <form method="POST" action="/admin/logout" style="margin-left:auto;">
          <button type="submit" class="btn secondary small">Log out</button>
        </form>
      </nav>
      ${content}
    </div>
  `;

  return layout({ title, bodyClass: 'admin', content: body });
}

module.exports = { adminShell };
