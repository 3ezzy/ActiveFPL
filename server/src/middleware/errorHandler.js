function errorHandler(err, req, res, next) {
  console.error(err.message);
  const status = err.response?.status || 500;
  const message =
    status === 404
      ? 'Resource not found. Check the ID and try again.'
      : 'Failed to fetch data from FPL API.';
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
