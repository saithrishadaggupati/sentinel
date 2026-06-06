# Sentinel 🛡️

A full-stack API Key Management Platform built with Node.js, TypeScript, MySQL, Redis, and AWS.

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
- MVC architecture (controllers + routes)
- Dockerized deployment on AWS EC2
- CI/CD with GitHub Actions

## Tech Stack
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MySQL (Prisma ORM)
- **Cache:** Redis
- **Authentication:** Google OAuth 2.0, Passport.js
- **Real-time:** WebSockets
- **Frontend:** React, TypeScript, Vite
- **Docs:** Swagger / OpenAPI 3.0
- **DevOps:** Docker, AWS EC2, GitHub Actions

## Architecture
- MVC pattern — routes handle HTTP, controllers handle business logic
- MySQL for structured relational data (users, API keys)
- Redis for rate limiting and caching
- WebSockets for real-time dashboard updates

## API Endpoints

### Auth
- GET /auth/google — Login with Google
- GET /auth/logout — Logout

### API Keys
- POST /api/keys/generate — Generate a new API key
- GET /api/keys/user/:userId — List all keys for a user
- DELETE /api/keys/:id — Revoke an API key

## Run Locally
git clone https://github.com/saithrishadaggupati/sentinel.git
cd sentinel
cp .env.example .env
docker compose up --build

## Why I Built This
I built Sentinel to gain hands-on experience with authentication, API security, real-time systems, database architecture, containerization, and cloud deployment. The project simulates features commonly used in production backend platforms.

## Author
Daggupati Sai Thrisha — saithrishadaggupati@gmail.com
