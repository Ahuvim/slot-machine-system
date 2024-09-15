const request = require('supertest');
const { app, generateSpinResult } = require('./slot-machine-service');  // Import the app and function
const axios = require('axios');

// Mock axios to simulate the API call to Points Service
jest.mock('axios');

describe('Slot Machine Service', () => {
    describe('generateSpinResult', () => {
        it('should return an array of three random numbers between 0 and 9', () => {
            const result = generateSpinResult();
            expect(result.length).toBe(3);
            result.forEach(num => {
                expect(num).toBeGreaterThanOrEqual(0);
                expect(num).toBeLessThanOrEqual(9);
            });
        });
    });

    describe('POST /spin', () => {
        it('should return spin result and update points, coins, and spins', async () => {
            // Mocking the unified balance response
            axios.get.mockResolvedValueOnce({ data: { spins: 10, points: 100, coins: 50 } });
            axios.post.mockResolvedValueOnce({ data: { pointsEarned: 21, newPointsBalance: 71, newCoinsBalance: 60 } });

            const response = await request(app)
                .post('/spin')
                .send({ userId: 'user123' });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('spinResult');
            expect(response.body).toHaveProperty('pointsEarned');
            expect(response.body).toHaveProperty('newPointsBalance', 71);  // Updated
            expect(response.body).toHaveProperty('newCoinsBalance', 60);  // Coins
            expect(response.body).toHaveProperty('spinsLeft', 9);
            expect(response.body).toHaveProperty('coinsLeft', 50);
            expect(response.body).toHaveProperty('pointsLeft', 100);
        });

        it('should return 403 if not enough spins', async () => {
            // Mocking insufficient balance
            axios.get.mockResolvedValueOnce({ data: { spins: 0, points: 100, coins: 50 } });

            const response = await request(app)
                .post('/spin')
                .send({ userId: 'user123' });

            expect(response.statusCode).toBe(403);
            expect(response.body.error).toBe('Not enough spins');
        });
    });
});
