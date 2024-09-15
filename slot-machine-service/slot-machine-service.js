const express = require('express');
const axios = require('axios');
const winston = require('winston');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
require('dotenv').config();  // Load environment variables

const app = express();
app.use(express.json());
app.use(cors());

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

function generateSpinResult() {
    return Array(3).fill().map(() => Math.floor(Math.random() * 10));
}

app.post('/spin', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        console.log('Spin request missing userId');
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        const { data: balanceData } = await axios.get(`${process.env.POINTS_API}/balance/${userId}`);
        if (balanceData.spins <= 0) {
            return res.status(403).json({ error: 'Not enough spins' });
        }

        const spinResult = generateSpinResult();
        const updateResponse = await axios.post(`${process.env.POINTS_API}/update`, {
            userId,
            spinResult,
            spinsUsed: 1
        });

        res.json({
            spinResult,
            pointsEarned: updateResponse.data.pointsEarned,
            newPointsBalance: updateResponse.data.newPointsBalance,  // Rename to newPointsBalance
            newCoinsBalance: updateResponse.data.newCoinsBalance,
            spinsLeft: balanceData.spins - 1,
            coinsLeft: balanceData.coins,
            pointsLeft: balanceData.points,
            missionCompleted: updateResponse.data.missionCompleted,
            currentMissionIndex: updateResponse.data.missionIndex,
            currentMissionGoal: updateResponse.data.currentMissionGoal
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Slot machine service running on port ${PORT}`);
        console.log(`Swagger UI should be available at http://localhost:${PORT}/api-docs`);
    });
}

module.exports = { app, generateSpinResult };
