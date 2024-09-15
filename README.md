
# Slot Machine Microservices

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