module.exports = {
  FPL_BASE: 'https://fantasy.premierleague.com/api',
  PORT: process.env.PORT || 3001,
  CACHE_TTL: {
    BOOTSTRAP: 300,
    FIXTURES: 300,
    ENTRY: 60,
    PICKS: 60,
    LEAGUE: 120,
    PLAYER_DETAIL: 180,
  },
};
