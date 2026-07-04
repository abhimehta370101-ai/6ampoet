const { layout } = require('./layout');
const { escapeHtml } = require('../lib/escape');

function testimonialCard(t) {
  const tag = t.source === 'instagram' ? 'via Instagram' : 'Founding member';
  return `<div class="testimonial-card">
    <p class="quote">&ldquo;${escapeHtml(t.body)}&rdquo;</p>
    <div class="testimonial-meta">
      <span>${escapeHtml(t.author_name)}</span>
      <span>${tag}</span>
    </div>
  </div>`;
}

function landing({ foundingCount, cap, testimonials, banner }) {
  const full = foundingCount >= cap;
  const pct = Math.min(100, Math.round((foundingCount / cap) * 100));

  const counterSection = full
    ? `<section class="counter-block" id="counter">
        <p class="count-label">The Founding 100 is full.</p>
        <div class="progress-track"><div class="progress-fill" style="width:100%"></div></div>
      </section>`
    : `<section class="counter-block" id="counter">
        <p class="count-label">${foundingCount} of ${cap} founding spots claimed</p>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </section>`;

  const formHeading = full
    ? 'Join the waitlist for opening day of the paid membership.'
    : 'Claim your founding spot — free, forever.';

  const buttonLabel = full ? 'Join the waitlist' : 'Claim my founding spot';

  const bannerHtml = banner
    ? `<div class="form-message" style="margin-bottom:24px;">${escapeHtml(banner)}</div>`
    : '';

  const testimonialsSection = testimonials.length
    ? `<section id="testimonials">
        <div class="wrap">
          <h2 class="testimonials-header">What readers say about 6ampoet</h2>
          <div class="testimonial-grid">
            ${testimonials.map(testimonialCard).join('\n')}
          </div>
        </div>
      </section>`
    : '';

  const content = `
    <main>
      <section class="hero">
        <div class="wrap">
          <div class="wordmark">6ampoet</div>
          <h1>Daily poems, delivered at first light.</h1>
          <p class="pitch">Cinematic, slow-burn, abstract poetry — one quiet message in your inbox each morning.</p>
          <p class="founding-offer"><strong>The first 100 members join free, forever.</strong> Daily poems by email, the <em>100 Poetry Prompts</em> ebook, and behind-the-scenes access as the portal grows.</p>
        </div>
      </section>

      <div class="wrap">${counterSection}</div>

      <section>
        <div class="wrap">
          <!-- REPLACE: sample poem -->
          <div class="poem-block">first light —
the kettle sighs
before I do

a whole life
folded into
the space between
waking
and the word for it</div>
        </div>
      </section>

      <section>
        <div class="wrap signup-block">
          <h2>${formHeading}</h2>
          <p class="signup-sub">One email. No spam. Unsubscribe anytime.</p>
          ${bannerHtml}
          <form class="signup-form" id="signup-form" data-full="${full}">
            <input type="email" name="email" id="signup-email" placeholder="you@example.com" required autocomplete="email">
            <button type="submit">${buttonLabel}</button>
          </form>
          <div class="form-message" id="form-message"></div>
        </div>
      </section>

      ${testimonialsSection}

      <footer>
        <div class="wrap">
          <a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:hello@6ampoet.com">hello@6ampoet.com</a>
        </div>
      </footer>
    </main>
    <script src="/js/signup.js"></script>
  `;

  return layout({ title: '6ampoet — The Founding 100', content });
}

module.exports = { landing };
