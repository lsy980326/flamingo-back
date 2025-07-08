# --- 1. 빌드 스테이지 (Builder Stage) ---
    FROM node:18-alpine AS builder

    WORKDIR /usr/src/app
    
    # pnpm 설치
    RUN npm install -g pnpm
    
    # 의존성 설치 (개발용 포함)
    COPY package.json pnpm-lock.yaml ./
    RUN pnpm install
    
    # 소스 코드 복사 및 빌드
    COPY . .
    RUN pnpm build
    
    # 프로덕션용 의존성만 남기기
    RUN pnpm prune --prod
    
    
    # --- 2. 프로덕션 스테이지 (Production Stage) ---
    FROM node:18-alpine
    
    WORKDIR /usr/src/app

    ENV NODE_ENV=production
    
    # 빌드 스테이지에서 필요한 파일만 복사
    COPY --from=builder /usr/src/app/dist ./dist
    COPY --from=builder /usr/src/app/node_modules ./node_modules
    COPY --from=builder /usr/src/app/package.json ./package.json
    
    EXPOSE 8000
    
    CMD [ "node", "dist/server.js" ]