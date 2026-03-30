const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

async function cachedFetch(key, ttl, fetchFn) {
  const cached = cache.get(key);
  if (cached) return cached;

  const data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
}

module.exports = { cachedFetch };
