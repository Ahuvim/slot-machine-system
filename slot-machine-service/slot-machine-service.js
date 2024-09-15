const express = require('express');
const axios = require('axios');
const winston = require('winston');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path'); // Import path module to properly locate the Swagger file

const app = express();
app.use(express.json());
app.use(cors());

// Load Swagger for Slot Machine Service
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const POINTS_API = process.env.POINTS_API || 'http://localhost:3001';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'slot-machine-service.log'})
    ]
});

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
        console.log(`Checking balance for user ${userId}`);
        const { data: balanceData } = await axios.get(`${POINTS_API}/balance/${userId}/spins`);
        if (balanceData.balance <= 0) {
            console.log(`User ${userId} attempted to spin with insufficient balance`);
            return res.status(403).json({ error: 'Not enough spins' });
        }

        const spinResult = generateSpinResult();
        console.log(`User ${userId} spin result: ${spinResult}`);

        const updateResponse = await axios.post(`${POINTS_API}/update`, {
            userId,
            spinResult,
            spinsUsed: 1
        });

        const { data: updatedSpinsData } = await axios.get(`${POINTS_API}/balance/${userId}/spins`);
        const spinsLeft = updatedSpinsData.balance;

        console.log(`User ${userId} has ${spinsLeft} spins left`);

        res.json({
            spinResult,
            pointsEarned: updateResponse.data.pointsEarned,
            newBalance: updateResponse.data.newBalance,
            spinsLeft
        });
    } catch (error) {
        console.error(`Error during spin for user ${userId}: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Slot machine service running on port ${PORT}`);
    console.log(`Swagger UI should be available at http://localhost:${PORT}/api-docs`);

});
