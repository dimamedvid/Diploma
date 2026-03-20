const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Ukr-Book Auth API",
      version: "1.0.0",
      description: "API авторизації та технічних endpoint-ів проєкту Ukr-Book.",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local development server",
      },
    ],
    tags: [
      { name: "Auth", description: "Операції авторизації користувача" },
      { name: "System", description: "Системні endpoint-и" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["login", "firstName", "lastName", "email", "password"],
          properties: {
            login: {
              type: "string",
              example: "user123",
            },
            firstName: {
              type: "string",
              example: "Dmytro",
            },
            lastName: {
              type: "string",
              example: "Medvid",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@mail.com",
            },
            password: {
              type: "string",
              example: "Passw0rd123",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["login", "password"],
          properties: {
            login: {
              type: "string",
              example: "user123",
            },
            password: {
              type: "string",
              example: "Passw0rd123",
            },
          },
        },
        AuthUser: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "1740000000000",
            },
            login: {
              type: "string",
              example: "user123",
            },
            firstName: {
              type: "string",
              example: "Dmytro",
            },
            lastName: {
              type: "string",
              example: "Medvid",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@mail.com",
            },
            role: {
              type: "string",
              example: "user",
            },
          },
        },
        TokenPayloadUser: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "1740000000000",
            },
            login: {
              type: "string",
              example: "user123",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@mail.com",
            },
            role: {
              type: "string",
              example: "user",
            },
            iat: {
              type: "integer",
              example: 1710000000,
            },
            exp: {
              type: "integer",
              example: 1710600000,
            },
          },
        },
        AuthSuccessResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: {
              $ref: "#/components/schemas/AuthUser",
            },
          },
        },
        MeResponse: {
          type: "object",
          properties: {
            user: {
              $ref: "#/components/schemas/TokenPayloadUser",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Невірний логін або пароль.",
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            ok: {
              type: "boolean",
              example: true,
            },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "..", "index.js"),
    path.join(__dirname, "..", "routes", "*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;