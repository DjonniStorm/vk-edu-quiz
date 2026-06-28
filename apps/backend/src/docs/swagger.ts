import { swagger } from "@elysiajs/swagger";

export const swaggerDocs = () =>
  swagger({
    path: "/docs",
    specPath: "/docs/json",
    provider: "scalar",
    documentation: {
      info: {
        title: "VK Education Quiz API",
        version: "1.0.0",
        description:
          "MVP API for realtime quiz rooms. Runtime validation is implemented with Zod schemas in route handlers.",
      },
      tags: [
        { name: "System", description: "Health checks and service metadata" },
        { name: "Auth", description: "Registration, login and current user" },
        { name: "Quizzes", description: "Organizer quiz management" },
        { name: "Rooms", description: "Live room lifecycle and participant answers" },
        { name: "Realtime", description: "WebSocket entry points and realtime service checks" },
        { name: "History", description: "Participant and organizer quiz history" },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });
