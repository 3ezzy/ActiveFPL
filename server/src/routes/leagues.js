const { Router } = require('express');
const axios = require('axios');
const { FPL_BASE, CACHE_TTL } = require('../config');
const { cachedFetch } = require('../cache');

const router = Router();

router.get('/:id/standings', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = req.query.page || 1;
    const data = await cachedFetch(`league_${id}_p${page}`, CACHE_TTL.LEAGUE, async () => {
      const resp = await axios.get(
        `${FPL_BASE}/leagues-classic/${id}/standings/?page_standings=${page}`
      );
      return resp.data;
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
