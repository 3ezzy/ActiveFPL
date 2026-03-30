const { Router } = require('express');
const axios = require('axios');
const { FPL_BASE, CACHE_TTL } = require('../config');
const { cachedFetch } = require('../cache');

const router = Router();

router.get('/:id/event/:event/picks', async (req, res, next) => {
  try {
    const { id, event } = req.params;
    const data = await cachedFetch(`picks_${id}_${event}`, CACHE_TTL.PICKS, async () => {
      const resp = await axios.get(`${FPL_BASE}/entry/${id}/event/${event}/picks/`);
      return resp.data;
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
