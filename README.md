
# Slot Machine System

This project implements a slot machine game with points accumulation and rewards using a microservices architecture.

## Local Development Setup
1. Install dependencies:
   ```bash
   npm run install-all
   ```
2. Start Redis locally.

3. Run the services:
   ```bash
   npm start
   ```

The services will be available at:
- Slot Machine Service: http://localhost:3000
- Points Service: http://localhost:3001
- Swagger UI: 
   - Slot Machine Service: http://localhost:3000/api-docs
   - Points Service: http://localhost:3001/api-docs

## Docker Deployment
1. Build and start the services:
   ```bash
   docker-compose up --build
   ```

## Usage
You can set the balance for any user using the /set-balance API.

To test setting the spins balance for user, use the following payload in a POST request:

```bash
curl -X POST http://localhost:3001/set-balance -H "Content-Type: application/json" -d '{
  "userId": "user123",
  "resource": "spins",
  "amount": 100
}'
```

Than you can use the /spin API to spin the slot machine and get the result.

```bash
curl -X POST http://localhost:3000/spin -H "Content-Type: application/json" -d '{"userId": "user123"}'
```