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

console.log('Slot machine service started');

function generateSpinResult() {
    const result = Array(3).fill().map(() => Math.floor(Math.random() * 10));
    console.log(`Generated spin result: ${result}`);
    return result;
}

app.post('/spin', async (req, res) => {
    const {userId} = req.body;
    if (!userId) {
        console.log('Spin request missing userId');
        return res.status(400).json({error: 'userId is required'});
    }

    try {
        console.log(`Fetching balance for user: ${userId}`);
        const {data: balanceData} = await axios.get(`${process.env.POINTS_API}/balance/${userId}`);
        console.log(`Balance data for user: ${userId}:`, balanceData);
        if (balanceData.spins <= 0) {
            console.log(`User ${userId} has no spins left`);
            return res.status(403).json({error: 'Not enough spins'});
        }

        const spinResult = generateSpinResult();
        console.log(`Sending spin result to points service for user: ${userId}`);
        const updateResponse = await axios.post(`${process.env.POINTS_API}/update`, {
            userId,
            spinResult,
            spinsUsed: 1
        });

        console.log(`Update response for user: ${userId}:`, updateResponse.data);
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
        console.error('Error during spin request:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Slot machine service running on port ${PORT}`);
    console.log(`Swagger UI should be available at http://localhost:${PORT}/api-docs`);
});

module.exports = {app, generateSpinResult};
