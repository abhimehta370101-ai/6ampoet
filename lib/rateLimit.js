// Small in-memory sliding-window rate limiter. Not shared across processes —
// fine for a single Railway instance; would need a shared store behind a load balancer.
const buckets = new Map();

function hit(key, max, windowMs) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= max) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Periodically drop stale buckets so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now - entry.windowStart > 60 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}, 15 * 60 * 1000).unref();

module.exports = { hit };
