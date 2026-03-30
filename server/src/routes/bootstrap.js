const { Router } = require('express');
const axios = require('axios');
const { FPL_BASE, CACHE_TTL } = require('../config');
const { cachedFetch } = require('../cache');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await cachedFetch('bootstrap', CACHE_TTL.BOOTSTRAP, async () => {
      const resp = await axios.get(`${FPL_BASE}/bootstrap-static/`);
      return resp.data;
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
