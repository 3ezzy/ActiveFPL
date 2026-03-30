require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PORT } = require('./config');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/bootstrap', require('./routes/bootstrap'));
app.use('/api/entry', require('./routes/entry'));
app.use('/api/entry', require('./routes/picks'));
app.use('/api/leagues', require('./routes/leagues'));
app.use('/api/fixtures', require('./routes/fixtures'));
app.use('/api/element-summary', require('./routes/playerDetail'));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ActiveFPL server running on port ${PORT}`);
});
