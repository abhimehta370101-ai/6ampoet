const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (ch) => MAP[ch]);
}

module.exports = { escapeHtml };
