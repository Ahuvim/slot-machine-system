const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const redis = new Redis();  // Initialize Redis

app.get('/balance/:userId/:resource', async (req, res) => {
    const { userId, resource } = req.params;
    const balance = await redis.get(`${resource}:${userId}`) || '0';
    res.json({ balance: parseInt(balance) });
});

app.get('/balance/:userId', async (req, res) => {
    const { userId } = req.params;
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
    if (!userId || !spinResult || spinsUsed === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let points = parseInt(await redis.get(`points:${userId}`)) || 0;
    await redis.decrby(`spins:${userId}`, spinsUsed);

    // Calculate points earned from the spin result
    const pointsEarned = spinResult.reduce((sum, num) => sum + num, 0);
    points += pointsEarned;
    await redis.set(`points:${userId}`, points);

    res.json({
        pointsEarned,
        newPointsBalance: points
    });
});

app.post('/set-balance', async (req, res) => {
    const { userId, resource, amount } = req.body;
    if (!userId || !resource || amount === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    await redis.set(`${resource}:${userId}`, amount);
    res.json({ message: `${resource} balance updated successfully` });
});

module.exports = app;
