const express = require('express');
const Redis = require('ioredis');
const path = require('path'); // Import path to handle file locations
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
console.log(`Connecting to Redis at: ${REDIS_URL}`);
const redis = new Redis(REDIS_URL);

redis.on('connect', () => console.log('Connected to Redis successfully'));
redis.on('error', (err) => console.error('Redis connection error:', err));

app.get('/balance/:userId/:resource', async (req, res) => {
    const { userId, resource } = req.params;
    console.log(`Fetching balance for user: ${userId}, resource: ${resource}`);
    const balance = await redis.get(`${resource}:${userId}`) || '0';
    res.json({ balance: parseInt(balance) });
});

app.get('/balance/:userId', async (req, res) => {
    const { userId } = req.params;
    console.log(`Fetching full balance for user: ${userId}`);
    const spins = await redis.get(`spins:${userId}`) || '0';
    const points = await redis.get(`points:${userId}`) || '0';
    const coins = await redis.get(`coins:${userId}`) || '0';

    res.json({
        spins: parseInt(spins),
        points: parseInt(points),
        coins: parseInt(coins)
    });
});

app.post('/update', async (req, res) => {
    const { userId, spinResult, spinsUsed } = req.body;
    console.log(`Updating points for user: ${userId}, spin result: ${spinResult}, spins used: ${spinsUsed}`);
    if (!userId || !spinResult || spinsUsed === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let points = parseInt(await redis.get(`points:${userId}`)) || 0;
    await redis.decrby(`spins:${userId}`, spinsUsed);

    // Calculate points earned from the spin result
    const pointsEarned = spinResult.reduce((sum, num) => sum + num, 0);
    points += pointsEarned;
    await redis.set(`points:${userId}`, points);

    console.log(`Points updated for user: ${userId}. Earned: ${pointsEarned}, Total: ${points}`);

    res.json({
        pointsEarned,
        newPointsBalance: points
    });
});

app.post('/set-balance', async (req, res) => {
    const { userId, resource, amount } = req.body;
    console.log(`Setting balance for user: ${userId}, resource: ${resource}, amount: ${amount}`);
    if (!userId || !resource || amount === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    await redis.set(`${resource}:${userId}`, amount);
    console.log(`Balance updated for user: ${userId}, resource: ${resource}, amount: ${amount}`);
    res.json({ message: `${resource} balance updated successfully` });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Points service listening on port ${PORT}`);
    console.log(`Swagger UI should be available at http://localhost:${PORT}/api-docs`);
});
module.exports = app;
