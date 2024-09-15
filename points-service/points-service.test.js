const request = require('supertest');
const express = require('express');
const redis = require('ioredis-mock'); // Mock Redis
const app = require('./points-service');

// Mock Redis client
jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

describe('Points Service', () => {
    describe('GET /balance/:userId/:resource', () => {
        it('should return the correct balance for spins', async () => {
            const response = await request(app).get('/balance/user123/spins');
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('balance');
        });
    });

    describe('POST /update', () => {
        it('should update points based on spin result', async () => {
            const response = await request(app)
                .post('/update')
                .send({ userId: 'user123', spinResult: [7, 7, 7], spinsUsed: 1 });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('pointsEarned');
            expect(response.body).toHaveProperty('newBalance');
        });

        it('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/update')
                .send({ userId: 'user123' }); // Missing spinResult and spinsUsed

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
