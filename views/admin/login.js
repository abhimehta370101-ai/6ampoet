const { layout } = require('../layout');

function loginPage({ error }) {
  const errorHtml = error ? `<div class="flash">${error}</div>` : '';

  const content = `
    <div class="wrap">
      <div class="login-box">
        <h1 style="margin-top:0;">6ampoet admin</h1>
        ${errorHtml}
        <form method="POST" action="/admin/login">
          <input type="email" name="email" placeholder="Email" required autocomplete="username">
          <input type="password" name="password" placeholder="Password" required autocomplete="current-password">
          <button type="submit" style="width:100%;">Log in</button>
        </form>
      </div>
    </div>
  `;

  return layout({ title: '6ampoet admin login', bodyClass: 'admin', content });
}

module.exports = { loginPage };
