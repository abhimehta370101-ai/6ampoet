const { layout } = require('./layout');
const { escapeHtml } = require('../lib/escape');

const TESTIMONIAL_MESSAGES = {
  submitted: 'Thank you — your words may appear on our landing page.',
  pending: "You already have a submission awaiting review — thank you for your patience.",
  invalid: 'Please fill in both fields.',
  error: 'Something went wrong. Please try again.'
};

function memberPage({ member, memberNumber, cap, ebookUrl, hasPendingTestimonial, testimonialStatus }) {
  const ebookSection = ebookUrl
    ? `<a class="btn" href="${ebookUrl}">Download your ebook</a>`
    : `<p>Your <em>100 Poetry Prompts</em> ebook lands in your inbox this week.</p>`;

  const testimonialMessage = testimonialStatus && TESTIMONIAL_MESSAGES[testimonialStatus]
    ? `<p class="form-message">${escapeHtml(TESTIMONIAL_MESSAGES[testimonialStatus])}</p>`
    : '';

  const testimonialForm = hasPendingTestimonial
    ? `<p class="signup-sub">You have a submission awaiting review — thank you for your patience.</p>`
    : `<form method="POST" action="/member/testimonial">
        <p><input type="text" name="author_name" placeholder="Your name" required></p>
        <p><textarea name="body" rows="4" placeholder="Your words about 6ampoet..." required></textarea></p>
        <button type="submit">Submit</button>
      </form>`;

  const content = `
    <main class="member-page">
      <div class="wrap">
        <h1>You are founding member #${memberNumber} of ${cap}</h1>
        <p class="signup-sub">${escapeHtml(member.email)}</p>

        <div class="member-card">
          <h2 style="font-family:var(--serif);font-weight:400;margin-top:0;">What's coming</h2>
          <ul>
            <li>Daily poems, delivered at first light</li>
            <li>Portal features as they ship</li>
          </ul>
          <h2 style="font-family:var(--serif);font-weight:400;">Your ebook</h2>
          ${ebookSection}
        </div>

        <div class="member-card">
          <h2 style="font-family:var(--serif);font-weight:400;margin-top:0;">Share your words</h2>
          ${testimonialMessage}
          ${testimonialForm}
        </div>

        <form method="POST" action="/auth/logout">
          <button type="submit" class="logout-link" style="background:none;border:none;padding:0;text-decoration:underline;cursor:pointer;">Log out</button>
        </form>
      </div>
    </main>
  `;

  return layout({ title: 'Your 6ampoet membership', content });
}

module.exports = { memberPage };
