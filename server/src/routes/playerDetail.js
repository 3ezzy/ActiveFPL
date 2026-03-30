const { Router } = require('express');
const axios = require('axios');
const { FPL_BASE, CACHE_TTL } = require('../config');
const { cachedFetch } = require('../cache');

const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await cachedFetch(`player_${id}`, CACHE_TTL.PLAYER_DETAIL, async () => {
      const resp = await axios.get(`${FPL_BASE}/element-summary/${id}/`);
      return resp.data;
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
