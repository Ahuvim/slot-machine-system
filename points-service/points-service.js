const express = require('express');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path'); // Import path to handle file locations
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Load Swagger for Points Service
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

let gameConfig;
try {
    gameConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'gameConfig.json'), 'utf8'));
    console.log('Game configuration loaded successfully');
} catch (error) {
    console.error(`Failed to load game configuration: ${error.message}`);
    process.exit(1);
}

app.get('/balance/:userId/:resource', async (req, res) => {
    const { userId, resource } = req.params;
    try {
        const balance = await redis.get(`${resource}:${userId}`) || '0';
        console.log(`Balance for user ${userId}, resource ${resource}: ${balance}`);
        res.json({ balance: parseInt(balance) });
    } catch (error) {
        console.error(`Error fetching balance for user ${userId}: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/update', async (req, res) => {
    const { userId, spinResult, spinsUsed } = req.body;

    if (!userId || !spinResult || spinsUsed === undefined) {
        console.error('Update request missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        let points = parseInt(await redis.get(`points:${userId}`)) || 0;
        await redis.decrby(`spins:${userId}`, spinsUsed);

        console.log(`User ${userId} initial points: ${points}`);
        console.log(`Deducted ${spinsUsed} spins from user ${userId}`);

        if (new Set(spinResult).size === 1) {
            const pointsEarned = spinResult.reduce((sum, num) => sum + num, 0);
            points += pointsEarned;
            console.log(`User ${userId} earned ${pointsEarned} points from spin`);
        }

        const missionIndex = parseInt(await redis.get(`missionIndex:${userId}`)) || 0;
        const currentMission = gameConfig.missions[missionIndex];

        console.log(`User ${userId} current mission index: ${missionIndex}`);

        let missionCompleted = false;
        if (points >= currentMission.pointsGoal) {
            points -= currentMission.pointsGoal;
            missionCompleted = true;

            for (const reward of currentMission.rewards) {
                await redis.incrby(`${reward.type}:${userId}`, reward.amount);
                console.log(`User ${userId} received reward: ${reward.amount} ${reward.type}`);
            }

            if (missionIndex === gameConfig.missions.length - 1) {
                await redis.set(`missionIndex:${userId}`, gameConfig.resetIndex);
                console.log(`User ${userId} completed all missions, reset to index ${gameConfig.resetIndex}`);
            } else {
                await redis.incr(`missionIndex:${userId}`);
                console.log(`User ${userId} progressed to next mission`);
            }
        }

        await redis.set(`points:${userId}`, points);

        console.log(`User ${userId} final points: ${points}`);

        res.json({
            pointsEarned: points,
            newBalance: await redis.get(`points:${userId}`),
            missionCompleted
        });
    } catch (error) {
        console.error(`Error updating state for user ${userId}: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/set-balance', async (req, res) => {
    const { userId, resource, amount } = req.body;

    if (!userId || !resource || amount === undefined) {
        console.error('Set balance request missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        if (resource !== 'points' && resource !== 'spins') {
            console.error(`Invalid resource type: ${resource}`);
            return res.status(400).json({ error: 'Invalid resource type' });
        }

        await redis.set(`${resource}:${userId}`, amount);
        console.log(`Set ${resource} balance for user ${userId} to ${amount}`);

        const newBalance = await redis.get(`${resource}:${userId}`);
        console.log(`New ${resource} balance for user ${userId}: ${newBalance}`);
        res.json({ message: `${resource} balance updated successfully`, newBalance });
    } catch (error) {
        console.error(`Error setting ${resource} balance for user ${userId}: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Points service listening on port ${PORT}`);
    console.log(`Swagger UI should be available at http://localhost:${PORT}/api-docs`);
});
module.exports = app;
