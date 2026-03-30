const { Router } = require('express');
const axios = require('axios');
const { FPL_BASE, CACHE_TTL } = require('../config');
const { cachedFetch } = require('../cache');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await cachedFetch('fixtures', CACHE_TTL.FIXTURES, async () => {
      const resp = await axios.get(`${FPL_BASE}/fixtures/`);
      return resp.data;
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
