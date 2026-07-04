(function () {
  var form = document.getElementById('signup-form');
  if (!form) return;

  var message = document.getElementById('form-message');
  var emailInput = document.getElementById('signup-email');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var submitBtn = form.querySelector('button');
    submitBtn.disabled = true;
    message.textContent = '';

    fetch('/auth/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.value })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        message.textContent = data.message || 'Check your inbox — your link is on the way.';
        if (data.ok) {
          emailInput.value = '';
          form.querySelector('input, button').disabled = false;
        }
        submitBtn.disabled = false;
      })
      .catch(function () {
        message.textContent = 'Something went wrong. Please try again.';
        submitBtn.disabled = false;
      });
  });
})();
