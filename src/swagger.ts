import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sentinel API',
      version: '1.0.0',
      description: `
I built this after getting tired of manually managing API keys while working on different projects. I wanted a simple way to generate keys, revoke them when needed, and see how they were being used.

So I built Sentinel. It lets users create and manage API keys, track request activity in real time, and monitor everything through a live dashboard. Authentication is handled through Google OAuth, so there's no password management to worry about.

**Why WebSockets?**
Initially I thought of refreshing the dashboard every few seconds, but it felt inefficient because the frontend would keep making requests even when there was no new data. Since I wanted the dashboard to update as soon as something happened, I decided to try WebSockets. It was my first time working with them, but I liked that the server could push updates directly instead of the frontend constantly asking for them.

**Why Google OAuth?**
I didn't think building a username/password system was the most interesting part of the project. Google OAuth was already a trusted solution, so I used that and focused my time on the API key management and real-time dashboard features, which were the parts I actually wanted to learn.

**Why MySQL?**
I'd already used PostgreSQL in my previous project, so I used Sentinel as an opportunity to try MySQL. The project didn't have any requirements that specifically needed one over the other, and it ended up working well for the use case.
      `,
      contact: {
        name: 'Thrisha',
        email: 'saithrishadaggupati@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Enter your Sentinel API key (sk_...)',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export default swaggerJsdoc(options);