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
        it('should return spin result and update points', async () => {
            axios.get.mockResolvedValueOnce({ data: { balance: 10 } });
            axios.post.mockResolvedValueOnce({ data: { pointsEarned: 21, newBalance: 71 } });
            axios.get.mockResolvedValueOnce({ data: { balance: 5 } });

            const response = await request(app)
                .post('/spin')
                .send({ userId: 'user123' });

            // Log the response in case of failure for debugging
            if (response.statusCode !== 200) {
                console.error('Response:', response.body);
            }

            expect(response.statusCode).toBe(200);  // This is where it fails
            expect(response.body).toHaveProperty('spinResult');
            expect(response.body).toHaveProperty('pointsEarned');
            expect(response.body).toHaveProperty('newBalance');
            expect(response.body).toHaveProperty('spinsLeft');
        });

        it('should return 403 if not enough spins', async () => {
            // Mocking insufficient balance
            axios.get.mockResolvedValueOnce({ data: { balance: 0 } });

            const response = await request(app)
                .post('/spin')
                .send({ userId: 'user123' });

            expect(response.statusCode).toBe(403);
            expect(response.body.error).toBe('Not enough spins');
        });
    });
});
