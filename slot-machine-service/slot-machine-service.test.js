const request = require('supertest');
const express = require('express');
const app = require('./slot-machine-service');
const axios = require('axios');

// Mock axios to simulate the API call to Points Service
jest.mock('axios');

describe('Slot Machine Service', () => {
    describe('generateSpinResult', () => {
        it('should return an array of three random numbers between 0 and 9', () => {
            const result = app.generateSpinResult();
            expect(result.length).toBe(3);
            result.forEach(num => {
                expect(num).toBeGreaterThanOrEqual(0);
                expect(num).toBeLessThanOrEqual(9);
            });
        });
    });

    describe('POST /spin', () => {
        it('should return spin result and update points', async () => {
            // Mocking the balance and update API responses from Points Service
            axios.get.mockResolvedValueOnce({ data: { balance: 10 } });
            axios.post.mockResolvedValueOnce({ data: { pointsEarned: 21, newBalance: 71 } });

            const response = await request(app)
                .post('/spin')
                .send({ userId: 'user123' });

            expect(response.statusCode).toBe(200);
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
