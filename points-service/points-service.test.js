const request = require('supertest');
const app = require('./points-service');

jest.mock('ioredis', () => require('ioredis-mock'));

describe('Points Service', () => {

    describe('GET /balance/:userId', () => {
        it('should return the correct balance for spins, points, and coins', async () => {
            const redis = new (require('ioredis-mock'))(); // Initialize mock Redis
            const userId = 'user123';

            // Set balances in mock Redis
            await redis.set(`spins:${userId}`, 5);
            await redis.set(`points:${userId}`, 100);
            await redis.set(`coins:${userId}`, 50);

            const response = await request(app).get(`/balance/${userId}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('spins', 5);
            expect(response.body).toHaveProperty('points', 100);
            expect(response.body).toHaveProperty('coins', 50);
        });
    });

    describe('GET /balance/:userId/:resource', () => {
        it('should return the correct balance for spins', async () => {
            const redis = new (require('ioredis-mock'))(); // Initialize Redis mock
            const userId = 'user123';

            // Set balance in mock Redis for spins
            await redis.set(`spins:${userId}`, 5);

            const response = await request(app).get('/balance/user123/spins');
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('balance', 5);  // Ensure the balance matches
        });
    });

    describe('POST /update', () => {
        it('should update points based on spin result', async () => {
            const response = await request(app)
                .post('/update')
                .send({ userId: 'user123', spinResult: [7, 7, 7], spinsUsed: 1 });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('pointsEarned');
            expect(response.body).toHaveProperty('newPointsBalance');
        });

        it('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/update')
                .send({ userId: 'user123' });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Missing required fields');
        });
    });

    describe('POST /set-balance', () => {
        it('should set the spins balance for the user', async () => {
            const response = await request(app)
                .post('/set-balance')
                .send({ userId: 'user123', resource: 'spins', amount: 10 });

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('spins balance updated successfully');
        });
    });
});
