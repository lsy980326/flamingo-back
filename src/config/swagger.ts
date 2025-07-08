import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

// 실행 환경이 'production'인지 확인
const isProduction = process.env.NODE_ENV === "production";

const serverUrl = isProduction
  ? process.env.SERVER_URL
  : `http://localhost:${process.env.PORT || 8000}`;

//  실행 환경에 따라 스캔할 파일 경로와 확장자를 동적으로 결정
//  프로덕션 환경에서는 컴파일된 JavaScript 파일(.js)을,
//  개발 환경에서는 TypeScript 파일(.ts)을 스캔
const apiFiles = [
  `${isProduction ? "./dist/api" : "./src/api"}/**/*.route.${
    isProduction ? "js" : "ts"
  }`,
];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Flamingo API",
      version: "1.0.0",
      description: "Flamingo 실시간 협업 서비스 API 문서",
    },
    servers: [
      {
        url: serverUrl,
        description: `${process.env.NODE_ENV || "development"} server`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: apiFiles,
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};
