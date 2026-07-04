const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM;

function wrapper(bodyHtml) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#0c0c0d;font-family:Georgia,'Times New Roman',serif;color:#ece7de;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c0d;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#141416;border-radius:8px;padding:40px;">
          <tr>
            <td style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#c9a34e;padding-bottom:24px;">6ampoet</td>
          </tr>
          <tr>
            <td style="font-size:16px;line-height:1.7;color:#ece7de;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6b6b6f;">
              6ampoet &middot; daily poems at first light
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href, label) {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;padding:14px 28px;background:#c9a34e;color:#0c0c0d;text-decoration:none;border-radius:4px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;">${label}</a>`;
}

async function sendMagicLinkEmail({ to, link }) {
  const html = wrapper(`
    <p>Here's your link to 6ampoet. It's valid for 15 minutes.</p>
    ${button(link, 'Continue to 6ampoet')}
    <p style="margin-top:24px;font-size:13px;color:#8a8a8e;">If you didn't request this, you can ignore this email.</p>
  `);
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Your 6ampoet link',
    html
  });
}

async function sendFoundingWelcomeEmail({ to, memberNumber, ebookUrl }) {
  const ebookSection = ebookUrl
    ? `<p>Your <em>100 Poetry Prompts</em> ebook is ready.</p>${button(ebookUrl, 'Download your ebook')}`
    : `<p>Your <em>100 Poetry Prompts</em> ebook lands in your inbox this week.</p>`;

  const html = wrapper(`
    <p style="font-size:20px;">You're in — Founding Member #${memberNumber}.</p>
    <p>You're one of the first 100 readers of 6ampoet, free forever. Here's what's coming:</p>
    <ul style="padding-left:20px;color:#ece7de;">
      <li>Daily poems, delivered at first light</li>
      <li>The <em>100 Poetry Prompts</em> ebook</li>
      <li>Behind-the-scenes access as the portal grows</li>
    </ul>
    ${ebookSection}
  `);
  return resend.emails.send({
    from: FROM,
    to,
    subject: `You're in — Founding Member #${memberNumber}`,
    html
  });
}

async function sendEbookDeliveryEmail({ to, url }) {
  const html = wrapper(`
    <p>Your <em>100 Poetry Prompts</em> ebook has arrived.</p>
    ${button(url, 'Download your ebook')}
    <p style="margin-top:24px;font-size:13px;color:#8a8a8e;">This link expires in 7 days, but a fresh one is always available on your member page.</p>
  `);
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Your 100 Poetry Prompts ebook',
    html
  });
}

module.exports = { sendMagicLinkEmail, sendFoundingWelcomeEmail, sendEbookDeliveryEmail };
