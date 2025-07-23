# ==================================
#      1. 빌드 스테이지 (Builder Stage)
# ==================================
# 안정성을 위해 Alpine 대신 표준 Debian 기반의 node:18 이미지를 사용합니다.
FROM node:18 AS builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 의존성 설치 (개발용 포함)
# package.json과 pnpm-lock.yaml만 먼저 복사하여 Docker 레이어 캐시를 활용합니다.
COPY package.json pnpm-lock.yaml ./
# --frozen-lockfile은 CI/CD 환경에서 일관된 설치를 보장합니다.
RUN pnpm install --frozen-lockfile

# 전체 소스 코드를 복사합니다.
COPY . .

# TypeScript 코드를 JavaScript로 빌드합니다.
RUN pnpm run build


# ==================================
#      2. 프로덕션 스테이지 (Production Stage)
# ==================================
FROM node:18

WORKDIR /app

# 환경 변수 설정
ENV NODE_ENV=production

# pnpm 설치
RUN npm install -g pnpm

# package.json과 pnpm-lock.yaml을 복사합니다.
COPY package.json pnpm-lock.yaml ./

# ✨ 핵심: 프로덕션 의존성만 새로 설치합니다.
# 이 과정에서 심볼릭 링크가 아닌 실제 파일들로 node_modules가 구성되어 호환성 문제를 해결합니다.
RUN pnpm install --prod --frozen-lockfile

# 빌드 스테이지에서 컴파일된 dist 폴더만 복사합니다.
COPY --from=builder /app/dist ./dist

# 애플리케이션이 사용할 포트를 노출합니다.
EXPOSE 8000

# package.json의 "start" 스크립트를 실행하여 컨테이너를 시작합니다.
CMD [ "pnpm", "start" ]
