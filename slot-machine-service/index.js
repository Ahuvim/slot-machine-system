const express = require('express');
const axios = require('axios');
const winston = require('winston');

const app = express();
app.use(express.json());

const POINTS_API = process.env.POINTS_API || 'http://localhost:3001';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'slot-machine-service.log' })
  ]
});

function generateSpinResult() {
  return Array(3).fill().map(() => Math.floor(Math.random() * 10));
}

app.post('/spin', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    logger.error('Spin request missing userId');
    console.log('Spin request missing userId');
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    console.log(`Checking balance for user ${userId}`);
    const { data } = await axios.get(`${POINTS_API}/balance/${userId}/spins`);
    if (data.balance <= 0) {
      logger.warn(`User ${userId} attempted to spin with insufficient balance`);
      console.log(`User ${userId} attempted to spin with insufficient balance`);
      return res.status(403).json({ error: 'Not enough spins' });
    }

    const spinResult = generateSpinResult();
    logger.info(`User ${userId} spin result: ${spinResult}`);
    console.log(`User ${userId} spin result: ${spinResult}`);

    console.log(`Updating points for user ${userId}`);
    const updateResponse = await axios.post(`${POINTS_API}/update`, {
      userId,
      spinResult,
      spinsUsed: 1
    });

    console.log(`Spin result for user ${userId}:`, {
      spinResult,
      pointsEarned: updateResponse.data.pointsEarned,
      newBalance: updateResponse.data.newBalance
    });

    res.json({
      spinResult,
      pointsEarned: updateResponse.data.pointsEarned,
      newBalance: updateResponse.data.newBalance
    });
  } catch (error) {
    logger.error(`Error during spin for user ${userId}: ${error.message}`);
    console.error(`Error during spin for user ${userId}: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Slot machine service running on port ${PORT}`);
  console.log(`Slot machine service running on port ${PORT}`);
});