import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// ✨ Pool 생성자에서 ssl 옵션을 완전히 제거합니다.
// 모든 설정은 .env 파일의 DATABASE_URL이 처리합니다.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("Successfully connected to the AWS RDS PostgreSQL database!");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(), // 클라이언트를 가져오는 메소드 추가
};
