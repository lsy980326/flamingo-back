import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Flamingo API (TypeScript)",
      version: "1.0.0",
      description: "Flamingo API 문서",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8000}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./src/api/**/*.route.ts"],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};
