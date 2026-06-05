# Sentinel 🛡️

A full-stack API Key Management Platform built with Node.js, TypeScript, MySQL, MongoDB, Redis, and AWS.

The system allows users to authenticate with Google OAuth, generate and manage API keys, monitor API usage in real time, and enforce rate limits for secure API access.

## Live Demo
- 🌐 **API:** http://13.234.122.84:3000
- 📖 **Swagger Docs:** http://13.234.122.84:3000/api-docs/

## Key Features
- Google OAuth 2.0 authentication
- API key generation and revocation
- Real-time monitoring with WebSockets
- API usage tracking and analytics
- Redis-based rate limiting
- Swagger/OpenAPI documentation
- Dockerized deployment on AWS EC2

## Tech Stack
- **Backend:** Node.js, Express.js, TypeScript
- **Databases:** MySQL, MongoDB, Redis
- **Real-time:** WebSockets
- **Authentication:** Google OAuth 2.0, Passport.js
- **Docs:** Swagger / OpenAPI 3.0
- **DevOps:** Docker, AWS EC2 , GitHub Actions

## API Endpoints

### Auth
- GET /auth/google
- GET /auth/logout

### API Keys
- POST /api/keys/generate
- GET /api/keys/user/:userId
- DELETE /api/keys/:id

## Run Locally
git clone <repository-url>
cd sentinel
cp .env.example .env
docker compose up --build

## Why I Built This
I built Sentinel to gain hands-on experience with authentication, API security, real-time systems, multi-database architecture, containerization, and cloud deployment. The project simulates features commonly used in production backend platforms.

## Author
Daggupati Sai Thrisha
