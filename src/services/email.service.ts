import nodemailer from "nodemailer";
import logger from "../config/logger";

// Ethereal 테스트 계정 생성 로직 (이 부분은 그대로)
let transporter: nodemailer.Transporter;

async function createTestAccount() {
  const testAccount = await nodemailer.createTestAccount();
  logger.info(
    `📧 Ethereal test account created: User: ${testAccount.user}, Pass: ${testAccount.pass}`
  );

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

createTestAccount().catch((err) =>
  logger.error("Failed to create Ethereal test account", err)
);

// 인증 이메일 발송 함수
export async function sendVerificationEmail(to: string, token: string) {
  // transporter가 초기화될 때까지 잠시 대기 (서버 시작 직후 호출 대비)
  if (!transporter) {
    logger.warn("Transporter not initialized, waiting...");
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초 대기
    if (!transporter) {
      logger.error(
        "Transporter still not initialized after wait. Email not sent."
      );
      return;
    }
  }

  // 프론트엔드 인증 페이지 URL
  const verificationUrl = `${
    process.env.CLIENT_URL || "http://localhost:3000"
  }/auth/verify?token=${token}`;

  const mailOptions = {
    from: '"Flamingo" <no-reply@flamingo.com>',
    to,
    subject: "🦩 Flamingo 회원가입 인증 메일입니다.",
    html: `
      <h1>Flamingo에 오신 것을 환영합니다!</h1>
      <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
      <a href="${verificationUrl}" 
         style="background-color: #007bff; color: white; padding: 15px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">
        이메일 인증하기
      </a>
      <p>또는 다음 링크를 브라우저에 붙여넣으세요: <a href="${verificationUrl}">${verificationUrl}</a></p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    // Ethereal에서 보낸 메일을 확인할 수 있는 URL을 로그에 출력
    logger.info(`Email sent: ${info.messageId}`);
    logger.info(`▶ Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    logger.error("Failed to send email", error);
  }
}
